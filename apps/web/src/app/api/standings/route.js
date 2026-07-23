// Dosya: src/app/api/standings/route.js
import { neon } from "@neondatabase/serverless";

// Frontend leagueId ("vct-emea") -> DB'deki gerçek "league" metin değeri ("VCT EMEA")
const LEAGUE_NAME_MAP = {
  "vct-emea": "VCT EMEA",
  "vct-americas": "VCT Americas",
  "vct-pacific": "VCT Pacific",
  "vct-masters": "VCT Masters",
  "vct-champions": "VCT Champions",
  lec: "LEC",
  lcs: "LCS",
  lck: "LCK",
  lpl: "LPL",
  "worlds-2026": "Worlds",
  "esl-pro-league": "ESL Pro League",
  "blast-premier": "BLAST Premier",
  "pgl-major": "PGL Major",
  "iem-cologne": "IEM Cologne",
  pmgc: "PMGC",
  "pmpl-emea": "PMPL EMEA",
  "pmpl-sea": "PMPL SEA",
  "pmpl-sa": "PMPL SA",
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const game = searchParams.get("game") || "valorant";
    const leagueId =
      searchParams.get("leagueId") || searchParams.get("league") || "vct-emea";

    const sql = neon(process.env.DATABASE_URL);

    // Frontend id'sini DB'deki gerçek lig adına çevir
    const leagueName = LEAGUE_NAME_MAP[leagueId] || leagueId;

    // standings tablosu: id, league, team_name, played, won, lost, points
    const rows = await sql`
      SELECT id, league, team_name, played, won, lost, points
      FROM standings
      WHERE league = ${leagueName}
      ORDER BY points DESC
    `;

    if (rows.length === 0) {
      return new Response(
        JSON.stringify({
          game,
          leagueId,
          leagueName,
          standings: [],
        }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    const standings = rows.map((row, idx) => ({
      rank: idx + 1,
      teamId: row.id,
      teamName: row.team_name,
      teamLogo: null,
      played: row.played,
      wins: row.won,
      losses: row.lost,
      points: row.points,
      winRate: row.played > 0 ? Math.round((row.won / row.played) * 100) : 0,
      form: [],
    }));

    return new Response(
      JSON.stringify({
        game,
        leagueId,
        leagueName,
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
