/**
 * GET /api/teams/:id
 * Returns team info, roster, and recent match history.
 * :id is the PandaScore team ID stored in matches.team_a_id / team_b_id
 */
import sql from "@/app/api/utils/sql";
import { ps } from "@/app/api/utils/pandascore";

export async function GET(request, { params: { id } }) {
  try {
    const teamId = String(id);

    // ── 1. Fetch recent matches involving this team from local DB ──────────
    const dbMatches = await sql(
      `SELECT * FROM matches
       WHERE (team_a_id = $1 OR team_b_id = $1)
         AND start_time > NOW() - INTERVAL '90 days'
       ORDER BY start_time DESC
       LIMIT 20`,
      [teamId],
    );

    // Build base team info from first DB match (fast fallback)
    let teamInfo = null;
    if (dbMatches.length > 0) {
      const first = dbMatches[0];
      const isA = first.team_a_id === teamId;
      teamInfo = {
        id: teamId,
        name: isA ? first.team_a_name : first.team_b_name,
        logo: isA ? first.team_a_logo : first.team_b_logo,
        game: first.game,
        acronym: null,
        location: null,
      };
    }

    // ── 2. PandaScore enrichment (if API key present) ─────────────────────
    let players = [];
    if (process.env.PANDASCORE_API_KEY) {
      // Team details
      try {
        const psTeam = await ps(`/teams/${teamId}`);
        if (psTeam && psTeam.id) {
          teamInfo = {
            id: teamId,
            name: psTeam.name || teamInfo?.name || "Bilinmiyor",
            logo: psTeam.image_url || teamInfo?.logo || null,
            acronym: psTeam.acronym || null,
            location: psTeam.location || null,
            game: psTeam.current_videogame?.slug || teamInfo?.game || null,
          };
        }
      } catch (e) {
        console.error(`[teams/${teamId}] PandaScore team fetch:`, e.message);
      }

      // Roster
      try {
        const rawPlayers = await ps(`/teams/${teamId}/players`, {
          "page[size]": "10",
        });
        players = (Array.isArray(rawPlayers) ? rawPlayers : []).map((p) => ({
          id: p.id,
          name: p.name || "?",
          first_name: p.first_name || null,
          last_name: p.last_name || null,
          nationality: p.nationality || null,
          role: p.role || null,
          image_url: p.image_url || null,
          age: p.age || null,
        }));
      } catch (e) {
        console.error(`[teams/${teamId}] PandaScore players fetch:`, e.message);
      }
    }

    // ── 3. Format match history ───────────────────────────────────────────
    const matchHistory = dbMatches.map((m) => {
      const isA = m.team_a_id === teamId;
      const result =
        m.status === "finished"
          ? m.winner_team === (isA ? "team_a" : "team_b")
            ? "win"
            : "loss"
          : m.status; // 'live' | 'upcoming'

      return {
        id: m.id,
        opponent_name: isA ? m.team_b_name : m.team_a_name,
        opponent_logo: isA ? m.team_b_logo : m.team_a_logo,
        opponent_id: isA ? m.team_b_id : m.team_a_id,
        team_score: isA ? m.score_a : m.score_b,
        opponent_score: isA ? m.score_b : m.score_a,
        status: m.status,
        result,
        start_time: m.start_time,
        tournament: m.tournament,
        pandascore_tournament_id: m.pandascore_tournament_id,
        game: m.game,
      };
    });

    // ── 4. Return ─────────────────────────────────────────────────────────
    if (!teamInfo) {
      return Response.json({ error: "Takım bulunamadı." }, { status: 404 });
    }

    return Response.json({ team: teamInfo, players, matches: matchHistory });
  } catch (err) {
    console.error("[GET /api/teams/:id]", err);
    return Response.json(
      { error: "Takım verisi yüklenemedi." },
      { status: 500 },
    );
  }
}
