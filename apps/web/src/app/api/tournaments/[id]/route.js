/**
 * GET /api/tournaments/:id
 * Returns tournament info, standings, teams list, and match list.
 * :id is the PandaScore tournament ID stored in matches.pandascore_tournament_id
 */
import sql from "@/app/api/utils/sql";
import { ps } from "@/app/api/utils/pandascore";

export async function GET(request, { params: { id } }) {
  try {
    const tournId = String(id);

    // ── 1. Matches for this tournament from local DB ───────────────────────
    const dbMatches = await sql(
      `SELECT * FROM matches
       WHERE pandascore_tournament_id = $1
       ORDER BY start_time ASC
       LIMIT 50`,
      [tournId],
    );

    // Build base tournament info from DB matches
    let tournamentInfo = null;
    if (dbMatches.length > 0) {
      const first = dbMatches[0];
      tournamentInfo = {
        id: tournId,
        name: first.tournament,
        full_name: first.tournament,
        game: first.game,
        league_name: null,
        serie_name: null,
        begin_at: null,
        end_at: null,
        prizepool: null,
      };
    }

    // Collect unique teams from DB matches
    const teamMap = new Map();
    for (const m of dbMatches) {
      if (m.team_a_id && m.team_a_name !== "TBD") {
        teamMap.set(m.team_a_id, {
          id: m.team_a_id,
          name: m.team_a_name,
          logo: m.team_a_logo,
        });
      }
      if (m.team_b_id && m.team_b_name !== "TBD") {
        teamMap.set(m.team_b_id, {
          id: m.team_b_id,
          name: m.team_b_name,
          logo: m.team_b_logo,
        });
      }
    }

    // ── 2. PandaScore enrichment ──────────────────────────────────────────
    let standings = [];
    if (process.env.PANDASCORE_API_KEY) {
      // Tournament metadata
      try {
        const psTourn = await ps(`/tournaments/${tournId}`);
        if (psTourn && psTourn.id) {
          tournamentInfo = {
            id: tournId,
            name:
              psTourn.name ||
              psTourn.full_name ||
              tournamentInfo?.name ||
              "Bilinmiyor",
            full_name: psTourn.full_name || psTourn.name,
            game: psTourn.videogame?.slug || tournamentInfo?.game || null,
            league_name: psTourn.league?.name || null,
            serie_name: psTourn.serie?.full_name || null,
            begin_at: psTourn.begin_at || null,
            end_at: psTourn.end_at || null,
            prizepool: psTourn.prizepool || null,
          };
        }
      } catch (e) {
        console.error(`[tournaments/${tournId}] PS metadata:`, e.message);
      }

      // Standings
      try {
        const rawStandings = await ps(`/tournaments/${tournId}/standings`, {
          "page[size]": "20",
        });
        if (Array.isArray(rawStandings) && rawStandings.length > 0) {
          standings = rawStandings.map((entry, idx) => {
            const team = entry.team || {};
            const wins = entry.wins || 0;
            const losses = entry.losses || 0;
            return {
              rank: idx + 1,
              team_id: team.id ? String(team.id) : null,
              team_name: team.name || "TBD",
              team_logo: team.image_url || null,
              wins,
              losses,
              played: wins + losses,
              points: entry.total_points ?? wins * 3,
            };
          });

          // Also enrich teamMap from standings
          for (const s of standings) {
            if (s.team_id && !teamMap.has(s.team_id)) {
              teamMap.set(s.team_id, {
                id: s.team_id,
                name: s.team_name,
                logo: s.team_logo,
              });
            }
          }
        }
      } catch (e) {
        console.error(`[tournaments/${tournId}] PS standings:`, e.message);
      }
    }

    // ── 3. Format match list for the page ────────────────────────────────
    const matchList = dbMatches.map((m) => ({
      id: m.id,
      team_a_name: m.team_a_name,
      team_a_logo: m.team_a_logo,
      team_a_id: m.team_a_id,
      team_b_name: m.team_b_name,
      team_b_logo: m.team_b_logo,
      team_b_id: m.team_b_id,
      score_a: m.score_a,
      score_b: m.score_b,
      status: m.status,
      winner_team: m.winner_team,
      start_time: m.start_time,
    }));

    // ── 4. Return ─────────────────────────────────────────────────────────
    if (!tournamentInfo) {
      return Response.json({ error: "Turnuva bulunamadı." }, { status: 404 });
    }

    return Response.json({
      tournament: tournamentInfo,
      standings,
      teams: Array.from(teamMap.values()),
      matches: matchList,
    });
  } catch (err) {
    console.error("[GET /api/tournaments/:id]", err);
    return Response.json(
      { error: "Turnuva verisi yüklenemedi." },
      { status: 500 },
    );
  }
}
