// Dosya: src/app/api/tournament-stages/route.js
import { neon } from "@neondatabase/serverless";
import { resolveTournamentName } from "../_lib/leagues";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const game = searchParams.get("game") || "valorant";
    const leagueId =
      searchParams.get("leagueId") || searchParams.get("league") || "vct";
    const tournament = resolveTournamentName(leagueId);

    const sql = neon(process.env.DATABASE_URL);
    const apiKey = process.env.PANDASCORE_API_KEY;

    const rows = await sql`
      SELECT DISTINCT pandascore_tournament_id
      FROM matches
      WHERE game = ${game} AND tournament = ${tournament} AND pandascore_tournament_id IS NOT NULL
    `;

    const stageIds = rows.map((r) => r.pandascore_tournament_id);

    if (stageIds.length === 0) {
      return new Response(
        JSON.stringify({ game, leagueId, leagueName: tournament, stages: [] }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    const stages = await Promise.all(
      stageIds.map(async (id) => {
        try {
          const res = await fetch(
            `https://api.pandascore.co/tournaments/${id}?token=${apiKey}`,
          );
          if (!res.ok) return null;
          const data = await res.json();
          return {
            stageId: id,
            name: data.name,
            hasBracket: !!data.has_bracket,
            // "Serie" gerçek etkinliği ayırt eder (ör. "Pacific Stage 2 2026")
            serieName: data.serie?.full_name || data.serie?.name || null,
            beginAt: data.begin_at || null,
          };
        } catch {
          return null;
        }
      }),
    );

    const validStages = stages
      .filter(Boolean)
      // Kronolojik sırala: en eski etkinlik önce, aynı serideki aşamalar yan yana dursun
      .sort((a, b) => {
        if (!a.beginAt) return 1;
        if (!b.beginAt) return -1;
        return new Date(a.beginAt) - new Date(b.beginAt);
      });

    return new Response(
      JSON.stringify({
        game,
        leagueId,
        leagueName: tournament,
        stages: validStages,
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[tournament-stages] API Detaylı Hatası:", error);
    return new Response(
      JSON.stringify({ error: "İşlem hatası", message: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
