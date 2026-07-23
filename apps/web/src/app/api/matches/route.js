import sql from "@/app/api/utils/sql";
import { fetchTodayMatches } from "@/app/api/utils/pandascore";

/**
 * Upsert a PandaScore-normalized match into the local DB.
 * Uses pandascore_id as the conflict key.
 */
async function upsertMatch(m) {
  if (!m.pandascore_id) return;
  await sql(
    `INSERT INTO matches
       (pandascore_id, game, tournament, team_a_name, team_a_logo, team_a_id,
        team_b_name, team_b_logo, team_b_id, pandascore_tournament_id,
        status, score_a, score_b, start_time, stream_url, winner_team)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
     ON CONFLICT (pandascore_id) WHERE pandascore_id IS NOT NULL
     DO UPDATE SET
       status                   = EXCLUDED.status,
       score_a                  = EXCLUDED.score_a,
       score_b                  = EXCLUDED.score_b,
       stream_url               = COALESCE(EXCLUDED.stream_url, matches.stream_url),
       winner_team              = EXCLUDED.winner_team,
       team_a_logo              = COALESCE(EXCLUDED.team_a_logo, matches.team_a_logo),
       team_b_logo              = COALESCE(EXCLUDED.team_b_logo, matches.team_b_logo),
       team_a_id                = COALESCE(EXCLUDED.team_a_id, matches.team_a_id),
       team_b_id                = COALESCE(EXCLUDED.team_b_id, matches.team_b_id),
       pandascore_tournament_id = COALESCE(EXCLUDED.pandascore_tournament_id, matches.pandascore_tournament_id)`,
    [
      m.pandascore_id,
      m.game,
      m.tournament,
      m.team_a_name,
      m.team_a_logo,
      m.team_a_id || null,
      m.team_b_name,
      m.team_b_logo,
      m.team_b_id || null,
      m.pandascore_tournament_id || null,
      m.status,
      m.score_a,
      m.score_b,
      m.start_time,
      m.stream_url,
      m.winner_team,
    ],
  );
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const game = searchParams.get("game") || "hepsi";

    // ── ALWAYS: fix stale "live" / "upcoming" matches ───────────────────────
    // Runs before PandaScore sync so the UI never shows ghost-live matches.
    // Any "live" match that started more than 8 hours ago is impossible —
    // the longest esports matches run ~4 hours max.
    await sql`
      UPDATE matches SET status = 'finished'
      WHERE status = 'live'
        AND start_time < NOW() - INTERVAL '8 hours'`;

    // Any "upcoming" match that started more than 6 hours ago was never
    // picked up as "running" — treat it as finished to avoid ghost-upcoming.
    await sql`
      UPDATE matches SET status = 'finished'
      WHERE status = 'upcoming'
        AND start_time < NOW() - INTERVAL '6 hours'`;

    // ── PandaScore live sync (only when API key is configured) ────────────
    if (process.env.PANDASCORE_API_KEY) {
      try {
        const psMatches = await fetchTodayMatches(
          game === "hepsi" ? null : game,
        );
        await Promise.allSettled(psMatches.map(upsertMatch));

        // If PandaScore reports no running matches, flip DB "live" rows
        // that PandaScore no longer knows about to "finished".
        const runningIds = psMatches
          .filter((m) => m.status === "live" && m.pandascore_id)
          .map((m) => m.pandascore_id);

        if (runningIds.length > 0) {
          await sql(
            `UPDATE matches SET status = 'finished'
             WHERE status = 'live'
               AND pandascore_id IS NOT NULL
               AND pandascore_id != ALL($1::text[])
               AND start_time < NOW() - INTERVAL '4 hours'`,
            [runningIds],
          );
        } else {
          // Zero running matches from PandaScore → close all stale live rows
          await sql`
            UPDATE matches SET status = 'finished'
            WHERE status = 'live'
              AND pandascore_id IS NOT NULL
              AND start_time < NOW() - INTERVAL '4 hours'`;
        }
      } catch (syncErr) {
        console.error("[matches/GET] PandaScore sync hatası:", syncErr.message);
      }
    }

    // ── Read from DB — strictly time-bounded to avoid showing old data ────
    //
    // Rules:
    //   "live"     → must have started within the last 8 hours
    //   "upcoming" → must start within the next 48 hours
    //   "finished" → must have started within the last 24 hours
    //   Anything else → excluded
    //
    // This means the homepage only ever shows matches from roughly
    // [now - 24h, now + 48h], which is the correct "today's matches" window.

    const BASE_WHERE = `
      status != 'cancelled'
      AND (
        (status = 'live'     AND start_time > NOW() - INTERVAL '8 hours')
        OR
        (status = 'upcoming' AND start_time BETWEEN NOW() - INTERVAL '1 hour'
                                                 AND NOW() + INTERVAL '48 hours')
        OR
        (status = 'finished' AND start_time > NOW() - INTERVAL '24 hours')
      )
    `;
    const ORDER_BY = `
      ORDER BY
        CASE status
          WHEN 'live'     THEN 0
          WHEN 'upcoming' THEN 1
          ELSE                 2
        END,
        start_time ASC
    `;

    let matches;
    if (game && game !== "hepsi") {
      matches = await sql(
        `SELECT * FROM matches WHERE game = $1 AND ${BASE_WHERE} ${ORDER_BY}`,
        [game],
      );
    } else {
      matches = await sql(
        `SELECT * FROM matches WHERE ${BASE_WHERE} ${ORDER_BY}`,
      );
    }

    return Response.json(matches);
  } catch (error) {
    console.error("GET /api/matches error", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
