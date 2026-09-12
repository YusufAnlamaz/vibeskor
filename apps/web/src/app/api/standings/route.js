// Dosya: src/app/api/standings/route.js
import { neon } from "@neondatabase/serverless";
import { resolveTournamentName } from "../_lib/leagues";

function slugifyTeamName(name) {
  return (name || "team")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// winner_team boşsa skora bakarak kazananı belirle.
// Skorlar eşitse veya rakip "TBD" ise güvenilir sonuç yok demektir, null döner.
function resolveWinner(m) {
  if (m.team_a_name === "TBD" || m.team_b_name === "TBD") return null;
  if (m.winner_team === "team_a" || m.winner_team === "team_b") {
    return m.winner_team;
  }
  const a = Number(m.score_a);
  const b = Number(m.score_b);
  if (Number.isFinite(a) && Number.isFinite(b) && a !== b) {
    return a > b ? "team_a" : "team_b";
  }
  return null;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const game = searchParams.get("game") || "valorant";
    const leagueId =
      searchParams.get("leagueId") || searchParams.get("league") || "vct";
    const stageId = searchParams.get("stageId") || null;

    const tournament = resolveTournamentName(leagueId);

    const sql = neon(process.env.DATABASE_URL);

    // stageId verilmişse, sadece o gerçek alt-gruba (ör. Grup A) ait maçları çek.
    // Verilmemişse eski davranış: tüm lig (geriye dönük uyumluluk için).
    const finishedMatches = stageId
      ? await sql`
          SELECT team_a_name, team_b_name, team_a_id, team_b_id, winner_team, score_a, score_b, start_time
          FROM matches
          WHERE game = ${game}
            AND tournament = ${tournament}
            AND pandascore_tournament_id = ${stageId}
            AND status = 'finished'
          ORDER BY start_time DESC
        `
      : await sql`
          SELECT team_a_name, team_b_name, team_a_id, team_b_id, winner_team, score_a, score_b, start_time
          FROM matches
          WHERE game = ${game}
            AND tournament = ${tournament}
            AND status = 'finished'
          ORDER BY start_time DESC
        `;

    if (finishedMatches.length === 0) {
      return new Response(
        JSON.stringify({
          game,
          leagueId,
          leagueName: tournament,
          standings: [],
        }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    const teamResults = new Map();

    for (const m of finishedMatches) {
      const winner = resolveWinner(m);
      if (!winner) continue;

      const entries = [
        {
          name: m.team_a_name,
          id: m.team_a_id,
          result: winner === "team_a" ? "W" : "L",
        },
        {
          name: m.team_b_name,
          id: m.team_b_id,
          result: winner === "team_b" ? "W" : "L",
        },
      ];

      for (const entry of entries) {
        if (!entry.name || entry.name === "TBD") continue;

        if (!teamResults.has(entry.name)) {
          teamResults.set(entry.name, {
            teamId: entry.id ? String(entry.id) : slugifyTeamName(entry.name),
            teamName: entry.name,
            played: 0,
            wins: 0,
            losses: 0,
            form: [],
          });
        }

        const t = teamResults.get(entry.name);
        t.played += 1;
        if (entry.result === "W") t.wins += 1;
        else t.losses += 1;
        if (t.form.length < 5) t.form.push(entry.result);
      }
    }

    const standings = Array.from(teamResults.values())
      .sort((a, b) => b.wins - a.wins || b.played - a.played)
      .map((t, idx) => ({
        rank: idx + 1,
        teamId: t.teamId,
        teamName: t.teamName,
        teamLogo: null,
        played: t.played,
        wins: t.wins,
        losses: t.losses,
        winRate: t.played > 0 ? Math.round((t.wins / t.played) * 100) : 0,
        form: [...t.form].reverse(),
      }));

    return new Response(
      JSON.stringify({
        game,
        leagueId,
        leagueName: tournament,
        updatedAt: new Date().toISOString(),
        standings,
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[standings] API Detaylı Hatası:", error);
    return new Response(
      JSON.stringify({
        error: "Veritabanı operasyon hatası",
        message: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
