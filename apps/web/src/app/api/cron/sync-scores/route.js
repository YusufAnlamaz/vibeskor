/**
 * Cron: /api/cron/sync-scores
 * ─────────────────────────────────────────────────────────────────────────────
 * Canlı devam eden maçların anlık skorlarını PandaScore'dan çekip DB'yi
 * günceller. Önerilen çalışma sıklığı: her 1-2 dakikada bir.
 *
 * Güvenlik: Authorization: Bearer <CRON_SECRET> header'ı zorunludur.
 */

import sql from "@/app/api/utils/sql";
import { fetchRunningMatches } from "@/app/api/utils/pandascore";

function checkSecret(request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();
  const secret = process.env.CRON_SECRET;
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
  const startTime = Date.now();

  try {
    if (!process.env.PANDASCORE_API_KEY) {
      return Response.json({
        ok: false,
        message: "PANDASCORE_API_KEY tanımlı değil",
      });
    }

    // Fetch all running matches from PandaScore
    const runningMatches = await fetchRunningMatches();
    let updatedCount = 0;
    const log = [];

    for (const m of runningMatches) {
      if (!m.pandascore_id) continue;

      // Upsert the match (create if not exists, update score if exists)
      const result = await sql(
        `INSERT INTO matches
           (pandascore_id, game, tournament, team_a_name, team_a_logo,
            team_b_name, team_b_logo, status, score_a, score_b, start_time, stream_url)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'live',$8,$9,$10,$11)
         ON CONFLICT (pandascore_id) WHERE pandascore_id IS NOT NULL
         DO UPDATE SET
           status     = 'live',
           score_a    = EXCLUDED.score_a,
           score_b    = EXCLUDED.score_b,
           stream_url = COALESCE(EXCLUDED.stream_url, matches.stream_url),
           team_a_logo = COALESCE(EXCLUDED.team_a_logo, matches.team_a_logo),
           team_b_logo = COALESCE(EXCLUDED.team_b_logo, matches.team_b_logo)
         RETURNING id, score_a, score_b`,
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
        ],
      );

      if (result.length > 0) {
        updatedCount++;
        log.push(
          `Maç #${result[0].id} (${m.team_a_name} vs ${m.team_b_name}): ${result[0].score_a}-${result[0].score_b}`,
        );
      }
    }

    // Also mark any DB matches as 'upcoming' that PandaScore no longer shows as running
    // (they may have finished or not started yet)
    if (runningMatches.length > 0) {
      const runningIds = runningMatches
        .map((m) => m.pandascore_id)
        .filter(Boolean);
      await sql(
        `UPDATE matches
         SET status = 'upcoming'
         WHERE status = 'live'
           AND pandascore_id IS NOT NULL
           AND pandascore_id != ALL($1::text[])`,
        [runningIds],
      );
    }

    return Response.json({
      ok: true,
      duration_ms: Date.now() - startTime,
      live_matches_found: runningMatches.length,
      matches_updated: updatedCount,
      log,
    });
  } catch (error) {
    console.error("[cron/sync-scores] Hata:", error);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}
