/**
 * GET /api/players?matchId=<db_match_id>
 *
 * Returns players for both teams in a match.
 * Fetches from PandaScore using the game slug + team IDs stored in DB.
 */
import sql from "@/app/api/utils/sql";
import { ps, GAME_SLUG_MAP } from "@/app/api/utils/pandascore";

/* ── Role display maps ──────────────────────────────────────────────────── */
const ROLE_LABELS = {
  // CS2
  awper: "AWPer",
  rifler: "Rifler",
  igl: "IGL",
  support: "Support",
  entry: "Entry Fragger",
  lurker: "Lurker",

  // Valorant
  duelist: "Duelist",
  controller: "Controller",
  sentinel: "Sentinel",
  initiator: "Initiator",
  flex: "Flex",

  // LoL
  top: "Top",
  jungle: "Jungle",
  mid: "Mid",
  bot: "Bot/ADC",
  adc: "ADC",
  support_lol: "Support",

  // PUBG Mobile
  assaulter: "Assaulter",
  sniper: "Sniper",
  rusher: "Rusher",
};

function formatRole(role) {
  if (!role) return "Oyuncu";
  const lower = role.toLowerCase().replace(/[-\s]/g, "_");
  return ROLE_LABELS[lower] || role.charAt(0).toUpperCase() + role.slice(1);
}

async function fetchTeamPlayers(gameSlug, teamId) {
  if (!teamId || !gameSlug) return [];
  try {
    const data = await ps(`/${gameSlug}/players`, {
      "filter[team_id]": teamId,
      "page[size]": "10",
      sort: "name",
    });
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error(`[players] ${gameSlug} team ${teamId}:`, err.message);
    return [];
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const matchId = parseInt(searchParams.get("matchId"), 10);

    if (isNaN(matchId)) {
      return Response.json({ error: "Geçersiz matchId" }, { status: 400 });
    }

    // Get match from DB
    const rows = await sql(
      `SELECT game, team_a_id, team_b_id, team_a_name, team_b_name,
              team_a_logo, team_b_logo
       FROM matches WHERE id = $1 LIMIT 1`,
      [matchId],
    );

    if (!rows.length) {
      return Response.json({ error: "Maç bulunamadı" }, { status: 404 });
    }

    const match = rows[0];
    const gameSlug = GAME_SLUG_MAP[match.game];

    if (!gameSlug) {
      return Response.json({ team_a: [], team_b: [] });
    }

    // Fetch both teams in parallel
    const [rawA, rawB] = await Promise.all([
      fetchTeamPlayers(gameSlug, match.team_a_id),
      fetchTeamPlayers(gameSlug, match.team_b_id),
    ]);

    const normalize = (raw) =>
      raw.map((p) => ({
        id: p.id,
        name: p.name || "?",
        first_name: p.first_name || "",
        last_name: p.last_name || "",
        role: formatRole(p.role),
        raw_role: p.role || "",
        image_url: p.image_url || null,
        nationality: p.nationality || "",
        slug: p.slug || "",
      }));

    return Response.json({
      team_a: {
        id: match.team_a_id,
        name: match.team_a_name,
        logo: match.team_a_logo,
        players: normalize(rawA),
      },
      team_b: {
        id: match.team_b_id,
        name: match.team_b_name,
        logo: match.team_b_logo,
        players: normalize(rawB),
      },
    });
  } catch (err) {
    console.error("[players GET]", err);
    return Response.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
