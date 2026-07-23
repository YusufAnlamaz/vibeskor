import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return Response.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const [users] = await sql`SELECT COUNT(*)::int AS total FROM auth_users`;
    const [matches] = await sql`SELECT COUNT(*)::int AS total FROM matches`;
    const [liveMatches] =
      await sql`SELECT COUNT(*)::int AS total FROM matches WHERE status = 'live'`;
    const [predictions] =
      await sql`SELECT COUNT(*)::int AS total FROM predictions`;
    const [wonPreds] =
      await sql`SELECT COUNT(*)::int AS total FROM predictions WHERE status = 'won'`;
    const [pointsSum] =
      await sql`SELECT COALESCE(SUM(points),0)::int AS total FROM auth_users`;
    // Favorites count
    const [favs] = await sql`SELECT COUNT(*)::int AS total FROM user_favorites`;

    // Top 5 users
    const topUsers = await sql`
      SELECT name, email, points FROM auth_users ORDER BY points DESC LIMIT 5`;

    // Recent matches
    const recentMatches = await sql`
      SELECT game, team_a_name, team_b_name, status, score_a, score_b, start_time
      FROM matches ORDER BY start_time DESC LIMIT 8`;

    // Matches by game
    const byGame = await sql`
      SELECT game, COUNT(*)::int AS total FROM matches GROUP BY game ORDER BY total DESC`;

    // API key status
    const apiConnected = !!process.env.PANDASCORE_API_KEY;

    return Response.json({
      users: users.total,
      matches: matches.total,
      live_matches: liveMatches.total,
      predictions: predictions.total,
      won_predictions: wonPreds.total,
      accuracy:
        predictions.total > 0
          ? Math.round((wonPreds.total / predictions.total) * 100)
          : 0,
      points_awarded: pointsSum.total,
      favorites: favs.total,
      api_connected: apiConnected,
      top_users: topUsers,
      recent_matches: recentMatches,
      by_game: byGame,
    });
  } catch (err) {
    console.error("[admin/stats]", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
