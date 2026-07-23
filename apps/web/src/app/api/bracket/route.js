/**
 * GET /api/bracket?matchId=<db_match_id>
 *
 * Returns all matches for the same tournament, sorted by start_time.
 * Used to render the bracket / playoff tree on the match detail page.
 * Falls back to DB-only data if PandaScore bracket endpoint is unavailable.
 */
import sql from "@/app/api/utils/sql";
import { ps } from "@/app/api/utils/pandascore";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const matchId = parseInt(searchParams.get("matchId"), 10);

    if (isNaN(matchId)) {
      return Response.json({ error: "Geçersiz matchId" }, { status: 400 });
    }

    // Get the anchor match to find tournament info
    const anchor = await sql(
      `SELECT tournament, pandascore_tournament_id, game FROM matches WHERE id = $1 LIMIT 1`,
      [matchId],
    );

    if (!anchor.length) {
      return Response.json({ rounds: [], tournament: null }, { status: 404 });
    }

    const { tournament, pandascore_tournament_id, game } = anchor[0];

    // ── Try PandaScore brackets endpoint first ───────────────────────────
    let psRounds = [];
    if (pandascore_tournament_id && process.env.PANDASCORE_API_KEY) {
      try {
        const raw = await ps(
          `/tournaments/${pandascore_tournament_id}/brackets`,
          { "page[size]": "50" },
        );

        if (Array.isArray(raw) && raw.length > 0) {
          // Group slots by round number
          const byRound = {};
          for (const slot of raw) {
            const roundNum = slot.round ?? 0;
            if (!byRound[roundNum]) byRound[roundNum] = [];

            const m = slot.match || {};
            const opp = Array.isArray(m.opponents) ? m.opponents : [];
            byRound[roundNum].push({
              slot_id: slot.id,
              position: slot.position ?? 0,
              round: roundNum,
              match_id: m.id ? String(m.id) : null,
              team_a: opp[0]?.opponent?.name || "TBD",
              team_a_logo: opp[0]?.opponent?.image_url || null,
              team_b: opp[1]?.opponent?.name || "TBD",
              team_b_logo: opp[1]?.opponent?.image_url || null,
              score_a: Array.isArray(m.results)
                ? (m.results[0]?.score ?? 0)
                : 0,
              score_b: Array.isArray(m.results)
                ? (m.results[1]?.score ?? 0)
                : 0,
              status: m.status || "upcoming",
              winner: m.winner?.name || null,
              begin_at: m.begin_at || null,
            });
          }

          psRounds = Object.entries(byRound)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([roundNum, matches]) => ({
              round: Number(roundNum),
              label: getRoundLabel(
                Number(roundNum),
                Object.keys(byRound).length,
              ),
              matches: matches.sort((a, b) => a.position - b.position),
            }));
        }
      } catch (psErr) {
        console.error("[bracket] PandaScore brackets error:", psErr.message);
      }
    }

    if (psRounds.length > 0) {
      return Response.json({
        rounds: psRounds,
        tournament,
        source: "pandascore",
      });
    }

    // ── Fallback: build bracket from DB matches in same tournament ───────
    const dbMatches = await sql(
      `SELECT id, team_a_name, team_a_logo, team_b_name, team_b_logo,
              score_a, score_b, status, start_time, winner_team
       FROM matches
       WHERE tournament = $1 AND game = $2 AND status != 'cancelled'
       ORDER BY start_time ASC
       LIMIT 32`,
      [tournament, game],
    );

    if (!dbMatches.length) {
      return Response.json({ rounds: [], tournament, source: "empty" });
    }

    // Group DB matches into pseudo-rounds based on total count
    const total = dbMatches.length;
    const rounds = groupMatchesIntoRounds(dbMatches, total);

    return Response.json({ rounds, tournament, source: "db" });
  } catch (err) {
    console.error("[bracket GET]", err);
    return Response.json({ rounds: [], tournament: null }, { status: 500 });
  }
}

/** Generate human-readable round label */
function getRoundLabel(round, totalRounds) {
  const fromEnd = totalRounds - round;
  if (fromEnd === 0) return "Final";
  if (fromEnd === 1) return "Yarı Final";
  if (fromEnd === 2) return "Çeyrek Final";
  if (fromEnd === 3) return "Son 16";
  return `Tur ${round}`;
}

/** Group a flat list of DB matches into bracket rounds */
function groupMatchesIntoRounds(matches, total) {
  // Heuristic: slice into round groups [QF=4, SF=2, F=1] etc.
  const groups = [];
  let remaining = [...matches];

  // Build rounds from final backwards (reverse bracket style)
  const roundSizes = [];
  let n = 1;
  while (n < total) {
    roundSizes.unshift(n);
    n *= 2;
  }
  roundSizes.unshift(
    Math.max(total - roundSizes.reduce((a, b) => a + b, 0), 0),
  );

  let roundNum = 1;
  const totalRounds = roundSizes.filter((s) => s > 0).length;
  for (const size of roundSizes) {
    if (size <= 0) continue;
    const batch = remaining.splice(0, size);
    if (batch.length === 0) continue;
    groups.push({
      round: roundNum,
      label: getRoundLabel(roundNum, totalRounds),
      matches: batch.map((m, i) => ({
        slot_id: m.id,
        position: i,
        round: roundNum,
        match_id: String(m.id),
        team_a: m.team_a_name,
        team_a_logo: m.team_a_logo,
        team_b: m.team_b_name,
        team_b_logo: m.team_b_logo,
        score_a: m.score_a,
        score_b: m.score_b,
        status: m.status,
        winner:
          m.winner_team === "team_a"
            ? m.team_a_name
            : m.winner_team === "team_b"
              ? m.team_b_name
              : null,
        begin_at: m.start_time,
      })),
    });
    roundNum++;
  }

  return groups;
}
