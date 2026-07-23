/**
 * /api/favorites
 * GET    — returns the current user's favorite teams
 * POST   — adds a team to favorites  { team_id, team_name, team_logo, game }
 * DELETE — removes a team             ?team_id=X
 */
import { auth } from "@/auth";
import sql from "@/app/api/utils/sql";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json([], { status: 401 });
    }

    const rows = await sql(
      `SELECT team_id, team_name, team_logo, game, created_at
       FROM user_favorites
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [session.user.id],
    );

    return Response.json(rows);
  } catch (err) {
    console.error("[favorites GET]", err);
    return Response.json([], { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Giriş gerekli" }, { status: 401 });
    }

    const { team_id, team_name, team_logo, game } = await request.json();

    if (!team_id || !team_name) {
      return Response.json(
        { error: "team_id ve team_name zorunlu" },
        { status: 400 },
      );
    }

    await sql(
      `INSERT INTO user_favorites (user_id, team_id, team_name, team_logo, game)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, team_id) DO NOTHING`,
      [
        session.user.id,
        String(team_id),
        team_name,
        team_logo || null,
        game || "valorant",
      ],
    );

    return Response.json({ ok: true });
  } catch (err) {
    console.error("[favorites POST]", err);
    return Response.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Giriş gerekli" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const team_id = searchParams.get("team_id");

    if (!team_id) {
      return Response.json({ error: "team_id zorunlu" }, { status: 400 });
    }

    await sql(
      `DELETE FROM user_favorites WHERE user_id = $1 AND team_id = $2`,
      [session.user.id, team_id],
    );

    return Response.json({ ok: true });
  } catch (err) {
    console.error("[favorites DELETE]", err);
    return Response.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
