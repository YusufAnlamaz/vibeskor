/**
 * GET /api/search?q=<query>
 * Maç / takım arama — DB'deki kayıtları sorgular, max 8 sonuç döner.
 */
import sql from "@/app/api/utils/sql";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();

    if (!q || q.length < 2) {
      return Response.json([]);
    }

    // Optional limit: navbar dropdown uses default (8), search page passes limit=30
    const limitRaw = parseInt(searchParams.get("limit") || "8", 10);
    const limit = Math.min(Math.max(limitRaw, 1), 50); // clamp 1–50

    const pattern = `%${q}%`;

    const results = await sql(
      `SELECT
         id,
         game,
         tournament,
         team_a_name,
         team_a_logo,
         team_b_name,
         team_b_logo,
         status,
         score_a,
         score_b,
         start_time
       FROM matches
       WHERE
         status != 'cancelled'
         AND (
           team_a_name ILIKE $1
           OR team_b_name ILIKE $1
           OR tournament ILIKE $1
         )
       ORDER BY
         CASE status WHEN 'live' THEN 0 WHEN 'upcoming' THEN 1 ELSE 2 END,
         start_time DESC
       LIMIT $2`,
      [pattern, limit],
    );

    return Response.json(results);
  } catch (err) {
    console.error("[search]", err);
    return Response.json([], { status: 500 });
  }
}
