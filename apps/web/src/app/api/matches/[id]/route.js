import sql from "@/app/api/utils/sql";

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const matchId = parseInt(id, 10);

    if (isNaN(matchId)) {
      return Response.json({ error: "Geçersiz maç ID'si" }, { status: 400 });
    }

    const rows = await sql(`SELECT * FROM matches WHERE id = $1 LIMIT 1`, [
      matchId,
    ]);

    if (!rows.length) {
      return Response.json({ error: "Maç bulunamadı" }, { status: 404 });
    }

    return Response.json(rows[0]);
  } catch (error) {
    console.error("GET /api/matches/[id] error", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
