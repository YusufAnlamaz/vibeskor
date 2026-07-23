import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function POST(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { matchId, predictedTeam } = await request.json();
    if (!matchId || !predictedTeam) {
      return Response.json(
        { error: "matchId ve predictedTeam zorunludur" },
        { status: 400 },
      );
    }

    // Make sure the match exists and is still upcoming / live
    const matchRows = await sql(`SELECT status FROM matches WHERE id = $1`, [
      parseInt(matchId),
    ]);
    if (!matchRows.length) {
      return Response.json({ error: "Maç bulunamadı" }, { status: 404 });
    }
    if (
      matchRows[0].status === "finished" ||
      matchRows[0].status === "cancelled"
    ) {
      return Response.json(
        { error: "Bu maç için artık tahmin yapılamaz" },
        { status: 400 },
      );
    }

    // Check duplicate prediction
    const existing = await sql(
      `SELECT id FROM predictions WHERE user_id = $1 AND match_id = $2`,
      [session.user.id, parseInt(matchId)],
    );
    if (existing.length > 0) {
      return Response.json(
        { error: "Bu maç için zaten tahmin yaptınız" },
        { status: 400 },
      );
    }

    const result = await sql(
      `INSERT INTO predictions (user_id, match_id, predicted_team, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING *`,
      [session.user.id, parseInt(matchId), predictedTeam],
    );

    // NOTE: Points are awarded automatically by the cron job (/api/cron/sync-matches)
    // when the match finishes. Correct prediction = +50 puan.

    return Response.json({
      ...result[0],
      message: "Tahmin alındı! Maç bitince puan hesaplanacak.",
    });
  } catch (error) {
    console.error("POST /api/predictions error", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get("matchId");

    let rows;
    if (matchId) {
      rows = await sql(
        `SELECT * FROM predictions WHERE user_id = $1 AND match_id = $2`,
        [session.user.id, parseInt(matchId)],
      );
    } else {
      rows = await sql(
        `SELECT * FROM predictions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
        [session.user.id],
      );
    }

    return Response.json(rows);
  } catch (error) {
    console.error("GET /api/predictions error", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
