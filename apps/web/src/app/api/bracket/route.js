/**
 * GET /api/bracket?matchId=<db_match_id>
 * GET /api/bracket?stageId=<pandascore_tournament_id>
 *
 * matchId verilirse: o maçın bağlı olduğu turnuvanın ağacını döner (maç detay sayfası için).
 * stageId verilirse: doğrudan o PandaScore alt-turnuvasının ağacını döner (puan durumu sayfası için).
 * PandaScore bracket endpoint'i başarısız olursa DB'den tahmini ağaç kurar.
 */
import sql from "@/app/api/utils/sql";
import { ps } from "@/app/api/utils/pandascore";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const matchIdParam = searchParams.get("matchId");
    const stageIdParam = searchParams.get("stageId");

    let tournament = null;
    let game = null;
    let pandascore_tournament_id = stageIdParam || null;

    if (matchIdParam) {
      const matchId = parseInt(matchIdParam, 10);
      if (isNaN(matchId)) {
        return Response.json({ error: "Geçersiz matchId" }, { status: 400 });
      }

      const anchor = await sql(
        `SELECT tournament, pandascore_tournament_id, game FROM matches WHERE id = $1 LIMIT 1`,
        [matchId],
      );

      if (!anchor.length) {
        return Response.json({ rounds: [], tournament: null }, { status: 404 });
      }

      tournament = anchor[0].tournament;
      game = anchor[0].game;
      pandascore_tournament_id =
        pandascore_tournament_id || anchor[0].pandascore_tournament_id;
    } else if (!stageIdParam) {
      return Response.json(
        { error: "matchId ya da stageId parametrelerinden biri gerekli" },
        { status: 400 },
      );
    }

    // ── Önce PandaScore bracket endpoint'ini dene ────────────────────────
    let psRounds = [];
    if (pandascore_tournament_id && process.env.PANDASCORE_API_KEY) {
      try {
        const raw = await ps(
          `/tournaments/${pandascore_tournament_id}/brackets`,
          { "page[size]": "50" },
        );

        if (Array.isArray(raw) && raw.length > 0) {
          psRounds = buildRoundsFromPandaScoreMatches(raw);
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

    // ── Fallback: DB'deki maçlardan tahmini ağaç kur ─────────────────────
    let dbMatches = [];
    if (pandascore_tournament_id) {
      dbMatches = await sql(
        `SELECT id, team_a_name, team_a_logo, team_b_name, team_b_logo,
                score_a, score_b, status, start_time, winner_team
         FROM matches
         WHERE pandascore_tournament_id = $1 AND status != 'cancelled'
         ORDER BY start_time ASC
         LIMIT 32`,
        [pandascore_tournament_id],
      );
    } else if (tournament && game) {
      dbMatches = await sql(
        `SELECT id, team_a_name, team_a_logo, team_b_name, team_b_logo,
                score_a, score_b, status, start_time, winner_team
         FROM matches
         WHERE tournament = $1 AND game = $2 AND status != 'cancelled'
         ORDER BY start_time ASC
         LIMIT 32`,
        [tournament, game],
      );
    }

    if (!dbMatches.length) {
      return Response.json({ rounds: [], tournament, source: "empty" });
    }

    const total = dbMatches.length;
    const rounds = groupMatchesIntoRounds(dbMatches, total);

    return Response.json({ rounds, tournament, source: "db" });
  } catch (err) {
    console.error("[bracket GET]", err);
    return Response.json({ rounds: [], tournament: null }, { status: 500 });
  }
}

/**
 * PandaScore'un GERÇEK /brackets yanıtı düz bir maç listesidir; her maç
 * "previous_matches" alanıyla kendinden önceki maçlara işaret eder.
 * Bir maçın "turu", ona giren maçların turundan bir fazladır.
 */
function buildRoundsFromPandaScoreMatches(raw) {
  const matchesById = new Map();

  for (const m of raw) {
    const opponents = Array.isArray(m.opponents) ? m.opponents : [];
    const teamA = opponents[0]?.opponent || null;
    const teamB = opponents[1]?.opponent || null;
    const results = Array.isArray(m.results) ? m.results : [];
    const scoreFor = (teamId) =>
      results.find((r) => r.team_id === teamId)?.score ?? 0;

    matchesById.set(m.id, {
      id: m.id,
      status: m.status || "upcoming",
      beginAt: m.begin_at || null,
      teamAName: teamA?.name || "TBD",
      teamALogo: teamA?.image_url || null,
      teamBName: teamB?.name || "TBD",
      teamBLogo: teamB?.image_url || null,
      scoreA: teamA ? scoreFor(teamA.id) : 0,
      scoreB: teamB ? scoreFor(teamB.id) : 0,
      winnerName:
        m.winner_id === teamA?.id
          ? teamA?.name
          : m.winner_id === teamB?.id
            ? teamB?.name
            : null,
      previousMatchIds: (m.previous_matches || []).map((p) => p.match_id),
    });
  }

  const roundCache = new Map();
  function computeRound(id) {
    if (roundCache.has(id)) return roundCache.get(id);
    const match = matchesById.get(id);
    if (!match || match.previousMatchIds.length === 0) {
      roundCache.set(id, 1);
      return 1;
    }
    const prevRounds = match.previousMatchIds
      .filter((pid) => matchesById.has(pid))
      .map((pid) => computeRound(pid));
    const round = prevRounds.length > 0 ? Math.max(...prevRounds) + 1 : 1;
    roundCache.set(id, round);
    return round;
  }

  const all = Array.from(matchesById.values()).map((m) => ({
    ...m,
    round: computeRound(m.id),
  }));

  const maxRound = Math.max(...all.map((m) => m.round), 1);
  const rounds = [];
  for (let roundNum = 1; roundNum <= maxRound; roundNum++) {
    const matches = all
      .filter((m) => m.round === roundNum)
      .sort((a, b) => new Date(a.beginAt) - new Date(b.beginAt));
    if (matches.length === 0) continue;
    rounds.push({
      round: roundNum,
      label: getRoundLabel(roundNum, maxRound),
      matches: matches.map((m, i) => ({
        slot_id: m.id,
        position: i,
        round: roundNum,
        match_id: String(m.id),
        team_a: m.teamAName,
        team_a_logo: m.teamALogo,
        team_b: m.teamBName,
        team_b_logo: m.teamBLogo,
        score_a: m.scoreA,
        score_b: m.scoreB,
        status: m.status,
        winner: m.winnerName,
        begin_at: m.beginAt,
      })),
    });
  }
  return rounds;
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

/** Group a flat list of DB matches into bracket rounds (fallback only) */
function groupMatchesIntoRounds(matches, total) {
  const groups = [];
  let remaining = [...matches];

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
