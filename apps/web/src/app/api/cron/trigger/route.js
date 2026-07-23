/**
 * Tek seferlik tetikleyici — hem sync-scores hem sync-matches çalıştırır.
 * Güvenlik: ?secret=<CRON_SECRET> query param ile doğrulanır.
 */
import {
  fetchTodayMatches,
  fetchRunningMatches,
  fetchRecentlyFinishedMatches,
} from "@/app/api/utils/pandascore";
import sql from "@/app/api/utils/sql";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const provided = searchParams.get("secret") || "";
  const expected = process.env.CRON_SECRET || "";

  if (expected && provided !== expected) {
    return Response.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const t0 = Date.now();
  const log = [];

  try {
    // ── 1. Bugünkü maçları çek (upcoming + live) ──────────────────
    log.push("▶ Bugünkü maçlar çekiliyor...");
    const todayMatches = await fetchTodayMatches(null);
    log.push(`  → ${todayMatches.length} maç bulundu.`);

    // ── 2. Her maçı DB'ye upsert et ───────────────────────────────
    let upserted = 0;
    for (const m of todayMatches) {
      if (!m.pandascore_id) continue;
      await sql(
        `INSERT INTO matches
           (pandascore_id, game, tournament,
            team_a_name, team_a_logo, team_b_name, team_b_logo,
            status, score_a, score_b, start_time, stream_url, winner_team)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         ON CONFLICT (pandascore_id) WHERE pandascore_id IS NOT NULL
         DO UPDATE SET
           status      = EXCLUDED.status,
           score_a     = EXCLUDED.score_a,
           score_b     = EXCLUDED.score_b,
           tournament  = EXCLUDED.tournament,
           stream_url  = COALESCE(EXCLUDED.stream_url, matches.stream_url),
           team_a_logo = COALESCE(EXCLUDED.team_a_logo, matches.team_a_logo),
           team_b_logo = COALESCE(EXCLUDED.team_b_logo, matches.team_b_logo),
           winner_team = EXCLUDED.winner_team`,
        [
          m.pandascore_id,
          m.game,
          m.tournament,
          m.team_a_name,
          m.team_a_logo,
          m.team_b_name,
          m.team_b_logo,
          m.status,
          m.score_a,
          m.score_b,
          m.start_time,
          m.stream_url,
          m.winner_team,
        ],
      );
      upserted++;
      log.push(
        `  ✓ ${m.game.toUpperCase()} | ${m.team_a_name} vs ${m.team_b_name} [${m.status}] ${m.score_a}-${m.score_b}`,
      );
    }

    // ── 3. Biten maçları çek ve tahminleri sonuçlandır ───────────
    log.push("▶ Biten maçlar kontrol ediliyor...");
    const finishedMatches = await fetchRecentlyFinishedMatches();
    log.push(`  → ${finishedMatches.length} bitmiş maç bulundu.`);

    let settled = 0;
    let pointsTotal = 0;

    for (const m of finishedMatches) {
      if (!m.pandascore_id || m.status !== "finished") continue;

      const rows = await sql(
        `INSERT INTO matches
           (pandascore_id, game, tournament,
            team_a_name, team_a_logo, team_b_name, team_b_logo,
            status, score_a, score_b, start_time, stream_url, winner_team)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'finished',$8,$9,$10,$11,$12)
         ON CONFLICT (pandascore_id) WHERE pandascore_id IS NOT NULL
         DO UPDATE SET
           status      = 'finished',
           score_a     = EXCLUDED.score_a,
           score_b     = EXCLUDED.score_b,
           winner_team = EXCLUDED.winner_team
         RETURNING id, winner_team`,
        [
          m.pandascore_id,
          m.game,
          m.tournament,
          m.team_a_name,
          m.team_a_logo,
          m.team_b_name,
          m.team_b_logo,
          m.score_a,
          m.score_b,
          m.start_time,
          m.stream_url,
          m.winner_team,
        ],
      );

      if (!rows.length || !rows[0].winner_team) continue;
      const { id: matchId, winner_team } = rows[0];

      const preds = await sql(
        `SELECT id, user_id, predicted_team FROM predictions
         WHERE match_id = $1 AND status = 'pending'`,
        [matchId],
      );

      for (const p of preds) {
        const won = p.predicted_team === winner_team;
        await sql(
          `UPDATE predictions SET status=$1, points_awarded=$2 WHERE id=$3`,
          [won ? "won" : "lost", won ? 50 : 0, p.id],
        );
        if (won) {
          await sql(
            `UPDATE auth_users SET points = points + 50 WHERE id = $1`,
            [p.user_id],
          );
          pointsTotal += 50;
        }
      }
      settled++;
    }

    // ── 4. DB'deki mevcut sayıyı getir ───────────────────────────
    const dbCount =
      await sql`SELECT COUNT(*) as total, status FROM matches WHERE pandascore_id IS NOT NULL GROUP BY status`;

    return Response.json({
      ok: true,
      ms: Date.now() - t0,
      upserted_matches: upserted,
      settled_predictions: settled,
      points_awarded: pointsTotal,
      db_summary: dbCount,
      log,
    });
  } catch (err) {
    console.error("[trigger]", err);
    return Response.json(
      { ok: false, error: err.message, log },
      { status: 500 },
    );
  }
}
