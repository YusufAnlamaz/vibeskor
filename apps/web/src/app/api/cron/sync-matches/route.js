/**
 * Cron: /api/cron/sync-matches
 * ─────────────────────────────────────────────────────────────────────────────
 * Bu endpoint'i harici bir cron servisi (örn: cron-job.org) her 5 dakikada
 * bir çağırmalı. Biten maçları PandaScore'dan çekip:
 *   1. Maç durumunu DB'de "finished" olarak günceller
 *   2. Doğru tahmin yapan kullanıcılara 50 puan verir
 *   3. Tahmin durumunu "won" / "lost" olarak işaretler
 *
 * Güvenlik: Authorization: Bearer <CRON_SECRET> header'ı zorunludur.
 */

import sql from "@/app/api/utils/sql";
import { fetchRecentlyFinishedMatches } from "@/app/api/utils/pandascore";

function checkSecret(request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();
  const secret = process.env.CRON_SECRET;
  // If no secret is set, allow (dev mode). In production, always set CRON_SECRET.
  if (secret && token !== secret) return false;
  return true;
}

export async function POST(request) {
  if (!checkSecret(request)) {
    return Response.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }
  return runSync();
}

export async function GET(request) {
  if (!checkSecret(request)) {
    return Response.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }
  return runSync();
}

async function runSync() {
  const log = [];
  const startTime = Date.now();

  try {
    if (!process.env.PANDASCORE_API_KEY) {
      return Response.json({
        ok: false,
        message: "PANDASCORE_API_KEY tanımlı değil",
      });
    }

    // 1. Fetch recently finished matches from PandaScore
    log.push("PandaScore'dan biten maçlar çekiliyor...");
    const finishedMatches = await fetchRecentlyFinishedMatches();
    log.push(`${finishedMatches.length} biten maç bulundu.`);

    let settledCount = 0;
    let pointsAwarded = 0;

    for (const m of finishedMatches) {
      if (!m.pandascore_id || m.status !== "finished") continue;

      // 2. Find match in our DB by pandascore_id
      const dbRows = await sql(
        `SELECT id, winner_team, status FROM matches WHERE pandascore_id = $1`,
        [m.pandascore_id],
      );

      if (!dbRows.length) {
        // Match not in DB yet, upsert it
        await sql(
          `INSERT INTO matches
             (pandascore_id, game, tournament, team_a_name, team_a_logo,
              team_b_name, team_b_logo, status, score_a, score_b, start_time,
              stream_url, winner_team)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
           ON CONFLICT (pandascore_id) WHERE pandascore_id IS NOT NULL DO NOTHING`,
          [
            m.pandascore_id,
            m.game,
            m.tournament,
            m.team_a_name,
            m.team_a_logo,
            m.team_b_name,
            m.team_b_logo,
            "finished",
            m.score_a,
            m.score_b,
            m.start_time,
            m.stream_url,
            m.winner_team,
          ],
        );
        continue;
      }

      const dbMatch = dbRows[0];

      // Skip if already settled (winner_team already set)
      if (dbMatch.winner_team) {
        // Just keep score fresh
        await sql(`UPDATE matches SET score_a=$1, score_b=$2 WHERE id=$3`, [
          m.score_a,
          m.score_b,
          dbMatch.id,
        ]);
        continue;
      }

      // 3. Update match status + scores + winner in DB
      const winnerTeam = m.winner_team;
      await sql(
        `UPDATE matches
         SET status = 'finished',
             score_a = $1,
             score_b = $2,
             winner_team = $3
         WHERE id = $4`,
        [m.score_a, m.score_b, winnerTeam, dbMatch.id],
      );

      if (!winnerTeam) {
        log.push(
          `Maç #${dbMatch.id}: kazanan takım belirlenemedi, tahminler atlandı.`,
        );
        continue;
      }

      // 4. Settle predictions for this match
      const predictions = await sql(
        `SELECT p.id, p.user_id, p.predicted_team
         FROM predictions p
         WHERE p.match_id = $1 AND p.status = 'pending'`,
        [dbMatch.id],
      );

      for (const pred of predictions) {
        const isCorrect = pred.predicted_team === winnerTeam;
        const pointsToAward = isCorrect ? 50 : 0;

        // Update prediction status
        await sql(
          `UPDATE predictions
           SET status = $1, points_awarded = $2
           WHERE id = $3`,
          [isCorrect ? "won" : "lost", pointsToAward, pred.id],
        );

        // Award points to user if correct
        if (isCorrect) {
          await sql(
            `UPDATE auth_users SET points = points + $1 WHERE id = $2`,
            [pointsToAward, pred.user_id],
          );
          pointsAwarded += pointsToAward;
        }
      }

      settledCount++;
      log.push(
        `Maç #${dbMatch.id} sonuçlandı. ${predictions.length} tahmin işlendi, kazanan: ${winnerTeam}.`,
      );
    }

    return Response.json({
      ok: true,
      duration_ms: Date.now() - startTime,
      finished_matches_found: finishedMatches.length,
      matches_settled: settledCount,
      total_points_awarded: pointsAwarded,
      log,
    });
  } catch (error) {
    console.error("[cron/sync-matches] Hata:", error);
    return Response.json(
      { ok: false, error: error.message, log },
      { status: 500 },
    );
  }
}
