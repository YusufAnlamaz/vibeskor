/**
 * PandaScore API Utility — VibeSkor
 * Docs: https://developers.pandascore.co/reference
 */

const BASE = "https://api.pandascore.co";

export const GAME_SLUG_MAP = {
  valorant: "valorant",
  cs2: "csgo",
  lol: "lol",
  pubgm: "pubg-mobile",
};

function getApiKey() {
  const key = process.env.PANDASCORE_API_KEY;
  if (!key) throw new Error("PANDASCORE_API_KEY eksik!");
  return key;
}

const TWITCH_PARENT = "vibeskor-e-spor-ma-takip-p-47.created.app";

/**
 * Core fetch helper — handles auth, pagination, error logging.
 */
export async function ps(path, params = {}) {
  const url = new URL(`${BASE}${path}`);
  if (!params["page[size]"]) url.searchParams.set("page[size]", "20");
  for (const [k, v] of Object.entries(params)) {
    if (v != null) url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      Accept: "application/json",
    },
    // 8 second timeout via AbortController
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`PandaScore [${res.status}] ${path}: ${txt.slice(0, 200)}`);
  }
  return res.json();
}

/* ─────────────────────────────────────────────────────────────
   Normalisation
───────────────────────────────────────────────────────────── */
function normalizeStatus(s) {
  if (s === "running") return "live";
  if (s === "finished") return "finished";
  if (s === "canceled" || s === "cancelled" || s === "postponed")
    return "cancelled";
  return "upcoming";
}

export function normalizeMatch(raw, game) {
  const opponents = Array.isArray(raw.opponents) ? raw.opponents : [];
  const results = Array.isArray(raw.results) ? raw.results : [];
  const streams = Array.isArray(raw.streams_list) ? raw.streams_list : [];

  // Best stream: prefer TR, then EN, then any
  const stream =
    streams.find((s) => s.language === "tr") ||
    streams.find((s) => s.language === "en") ||
    streams[0];

  let streamUrl = null;
  if (stream) {
    const rawStreamUrl = stream.embed_url || stream.raw_url || "";

    if (rawStreamUrl.includes("twitch.tv")) {
      // Extract channel name robustly
      const channelMatch = rawStreamUrl.match(
        /twitch\.tv\/(?:videos\/\d+|[^/?#]+)/i,
      );
      const channel = channelMatch
        ? channelMatch[0].replace(/twitch\.tv\//i, "").split(/[/?#]/)[0]
        : rawStreamUrl.split("/").pop().split("?")[0];

      // Build with URLSearchParams — no string concatenation
      const params = new URLSearchParams({
        channel,
        parent: TWITCH_PARENT,
        autoplay: "false",
        muted: "false",
      });
      streamUrl = `https://player.twitch.tv/?${params.toString()}`;
    } else if (
      rawStreamUrl.includes("youtube.com") ||
      rawStreamUrl.includes("youtu.be")
    ) {
      // YouTube embed
      let videoId = null;
      try {
        if (rawStreamUrl.includes("youtube.com/watch")) {
          videoId = new URL(rawStreamUrl).searchParams.get("v");
        } else if (rawStreamUrl.includes("youtu.be/")) {
          videoId = rawStreamUrl.split("youtu.be/")[1].split("?")[0];
        }
      } catch {}
      streamUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    } else {
      streamUrl = rawStreamUrl || null;
    }
  }

  // Winner
  let winnerTeam = null;
  if (raw.winner_id) {
    const idA = opponents[0]?.opponent?.id;
    const idB = opponents[1]?.opponent?.id;
    if (raw.winner_id === idA) winnerTeam = "team_a";
    else if (raw.winner_id === idB) winnerTeam = "team_b";
  }

  return {
    pandascore_id: String(raw.id),
    game,
    tournament:
      raw.league?.name ||
      raw.serie?.full_name ||
      raw.tournament?.name ||
      "Bilinmiyor",
    // Team A
    team_a_name: opponents[0]?.opponent?.name || "TBD",
    team_a_logo: opponents[0]?.opponent?.image_url || null,
    team_a_id:
      opponents[0]?.opponent?.id != null
        ? String(opponents[0].opponent.id)
        : null,
    // Team B
    team_b_name: opponents[1]?.opponent?.name || "TBD",
    team_b_logo: opponents[1]?.opponent?.image_url || null,
    team_b_id:
      opponents[1]?.opponent?.id != null
        ? String(opponents[1].opponent.id)
        : null,
    // Tournament
    pandascore_tournament_id:
      raw.tournament?.id != null ? String(raw.tournament.id) : null,
    // Match state
    status: normalizeStatus(raw.status),
    score_a: results[0]?.score ?? 0,
    score_b: results[1]?.score ?? 0,
    start_time: raw.begin_at || raw.scheduled_at || new Date().toISOString(),
    stream_url: streamUrl,
    winner_team: winnerTeam,
  };
}

/* ─────────────────────────────────────────────────────────────
   Public helpers used by route handlers
───────────────────────────────────────────────────────────── */

/**
 * Matches for the current Turkish day + recent past (timezone-safe).
 *
 * Turkey = UTC+3. Using a midnight-to-midnight UTC window causes:
 *   • 23:00-00:00 Turkey = 20:00-21:00 UTC → OK
 *   • 00:00-03:00 Turkey = 21:00-00:00 UTC PREVIOUS DAY → MISSED
 *
 * Fix: use a 36-hour sliding window centred around NOW(), so every
 * match that's "today" in any UTC±3 zone is included.
 * Window: [now - 12h, now + 24h]
 */
export async function fetchTodayMatches(game = null) {
  const now = new Date();
  const start = new Date(now.getTime() - 12 * 60 * 60 * 1000); // 12h ago
  const end = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h from now

  const games = game && game !== "hepsi" ? [game] : Object.keys(GAME_SLUG_MAP);

  const all = [];

  await Promise.allSettled(
    games.map(async (g) => {
      const slug = GAME_SLUG_MAP[g];
      if (!slug) return;

      // 1. Currently running
      try {
        const running = await ps(`/${slug}/matches/running`, {
          sort: "begin_at",
          "page[size]": "10",
        });
        all.push(...running.map((m) => normalizeMatch(m, g)));
      } catch (e) {
        console.error(`[PS] ${g} running:`, e.message);
      }

      // 2. Upcoming in [now, now+24h]
      try {
        const upcoming = await ps(`/${slug}/matches/upcoming`, {
          sort: "begin_at",
          "range[begin_at]": `${now.toISOString()},${end.toISOString()}`,
          "page[size]": "20",
        });
        all.push(...upcoming.map((m) => normalizeMatch(m, g)));
      } catch (e) {
        console.error(`[PS] ${g} upcoming:`, e.message);
      }

      // 3. Recently finished (last 12h) — for live-score fallback
      try {
        const past = await ps(`/${slug}/matches/past`, {
          sort: "-begin_at",
          "range[begin_at]": `${start.toISOString()},${now.toISOString()}`,
          "page[size]": "10",
        });
        all.push(...past.map((m) => normalizeMatch(m, g)));
      } catch (e) {
        console.error(`[PS] ${g} past:`, e.message);
      }
    }),
  );

  // Deduplicate by pandascore_id — keep the first occurrence
  const seen = new Set();
  return all.filter((m) => {
    if (seen.has(m.pandascore_id)) return false;
    seen.add(m.pandascore_id);
    return true;
  });
}

/**
 * Currently running matches only (for live-score polling).
 */
export async function fetchRunningMatches() {
  const all = [];

  await Promise.allSettled(
    Object.entries(GAME_SLUG_MAP).map(async ([game, slug]) => {
      try {
        const running = await ps(`/${slug}/matches/running`, {
          sort: "begin_at",
          "page[size]": "10",
        });
        all.push(...running.map((m) => normalizeMatch(m, game)));
      } catch (e) {
        console.error(`[PS] ${game} running:`, e.message);
      }
    }),
  );

  return all;
}

/**
 * Matches that finished in the last 3 hours (for settling predictions).
 */
export async function fetchRecentlyFinishedMatches() {
  const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
  const now = new Date();
  const all = [];

  await Promise.allSettled(
    Object.entries(GAME_SLUG_MAP).map(async ([game, slug]) => {
      try {
        const past = await ps(`/${slug}/matches/past`, {
          sort: "-begin_at",
          "range[end_at]": `${threeHoursAgo.toISOString()},${now.toISOString()}`,
          "page[size]": "10",
        });
        all.push(...past.map((m) => normalizeMatch(m, game)));
      } catch (e) {
        console.error(`[PS] ${game} past:`, e.message);
      }
    }),
  );

  return all;
}

/**
 * Try to pull standings for a well-known tournament slug.
 * Falls back gracefully if the slug doesn't exist yet this season.
 */
const STANDINGS_TARGETS = [
  {
    slug: "valorant-champions-tour-2025-emea-stage-1",
    league: "VCT EMEA 2025",
  },
  {
    slug: "valorant-champions-tour-2025-pacific-stage-1",
    league: "VCT Pacific 2025",
  },
  { slug: "lol-lec-2025-spring", league: "LEC 2025 Spring" },
  { slug: "lol-lck-2025-spring", league: "LCK 2025 Spring" },
  { slug: "cs-go-pgl-cs2-major-2025", league: "PGL Major CS2 2025" },
];

export async function fetchStandings() {
  const rows = [];

  await Promise.allSettled(
    STANDINGS_TARGETS.map(async ({ slug, league }) => {
      try {
        const data = await ps(`/tournaments/${slug}/standings`, {
          "page[size]": "20",
        });
        if (!Array.isArray(data)) return;
        for (const entry of data) {
          const team = entry.team || {};
          rows.push({
            league,
            team_name: team.name || "Bilinmiyor",
            played: (entry.wins || 0) + (entry.losses || 0),
            won: entry.wins || 0,
            lost: entry.losses || 0,
            points: entry.total_points ?? (entry.wins || 0) * 3,
          });
        }
      } catch {
        /* skip unavailable tournament */
      }
    }),
  );

  return rows;
}
