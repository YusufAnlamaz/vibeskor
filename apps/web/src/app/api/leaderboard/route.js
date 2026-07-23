import sql from "@/app/api/utils/sql";

export async function GET() {
  try {
    const leaderboard = await sql`
      SELECT id, name, email, points, image 
      FROM auth_users 
      ORDER BY points DESC 
      LIMIT 10
    `;

    // Clean data for frontend
    const cleaned = leaderboard.map((user) => ({
      id: user.id,
      name: user.name || user.email.split("@")[0],
      points: user.points,
      image: user.image,
    }));

    return Response.json(cleaned);
  } catch (error) {
    console.error("GET /api/leaderboard error", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
