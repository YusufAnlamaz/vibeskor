import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";
import { filterProfanity } from "@/app/api/utils/profanity";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get("matchId");

    if (!matchId) {
      return Response.json({ error: "matchId is required" }, { status: 400 });
    }

    const messages = await sql`
      SELECT * FROM chat_messages 
      WHERE match_id = ${parseInt(matchId)} 
      ORDER BY created_at ASC 
      LIMIT 50
    `;

    return Response.json(messages);
  } catch (error) {
    console.error("GET /api/chat error", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { matchId, message } = await request.json();
    if (!matchId || !message) {
      return Response.json(
        { error: "matchId and message are required" },
        { status: 400 },
      );
    }

    const filteredMessage = filterProfanity(message);
    const username = session.user.name || session.user.email.split("@")[0];

    const result = await sql`
      INSERT INTO chat_messages (user_id, username, match_id, message)
      VALUES (${session.user.id}, ${username}, ${parseInt(matchId)}, ${filteredMessage})
      RETURNING *
    `;

    return Response.json(result[0]);
  } catch (error) {
    console.error("POST /api/chat error", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
