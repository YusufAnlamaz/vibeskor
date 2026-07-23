"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trophy, Gamepad2, Calendar, Star } from "lucide-react";
import useUser from "@/utils/useUser";

/* ── Game icons ────────────────────────────────────────────────── */
function ValIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <polygon points="2,3 13,3 22,12 13,15" fill="#FF4655" />
      <polygon points="2,3 13,15 2,21" fill="#FF4655" opacity="0.55" />
    </svg>
  );
}
function CS2Icon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="1" y="1" width="22" height="22" rx="4" fill="#F4941D" />
      <text
        x="12"
        y="16.5"
        textAnchor="middle"
        fontSize="9"
        fontWeight="900"
        fill="white"
        fontFamily="Arial"
      >
        CS2
      </text>
    </svg>
  );
}
function LolIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 1L22 6V13C22 18 17.5 22.5 12 23C6.5 22.5 2 18 2 13V6L12 1Z"
        fill="#C8AA6E"
      />
      <path
        d="M12 4L19 8V13C19 17 15.9 20.3 12 21C8.1 20.3 5 17 5 13V8L12 4Z"
        fill="#0A1428"
      />
      <text
        x="12"
        y="16"
        textAnchor="middle"
        fontSize="7.5"
        fontWeight="900"
        fill="#C8AA6E"
        fontFamily="Arial"
      >
        LoL
      </text>
    </svg>
  );
}
function PubgIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="11" fill="#F5A623" />
      <circle cx="12" cy="12" r="6.5" fill="#1A1A1A" />
      <circle cx="12" cy="12" r="2" fill="#F5A623" />
      <line
        x1="12"
        y1="1"
        x2="12"
        y2="5.5"
        stroke="#F5A623"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="12"
        y1="18.5"
        x2="12"
        y2="23"
        stroke="#F5A623"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="1"
        y1="12"
        x2="5.5"
        y2="12"
        stroke="#F5A623"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="18.5"
        y1="12"
        x2="23"
        y2="12"
        stroke="#F5A623"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

const GAME_TABS = [
  { id: "hepsi", name: "Hepsi", icon: <Gamepad2 size={18} /> },
  { id: "valorant", name: "Valorant", icon: <ValIcon /> },
  { id: "cs2", name: "CS2", icon: <CS2Icon /> },
  { id: "lol", name: "League of Legends", icon: <LolIcon /> },
  { id: "pubgm", name: "PUBG Mobile", icon: <PubgIcon /> },
];

/* display names protected from auto-translation */
const GAME_SHORT = {
  valorant: "Valorant",
  cs2: "CS2",
  lol: "LoL",
  pubgm: "PUBG M",
};

/* Game color palette — used for left border & badge */
const GAME_COLORS = {
  valorant: "#ff4655",
  lol: "#C8AA6E",
  cs2: "#F4941D",
  pubgm: "#F5A623",
};

/* ── Shared UI helpers ──────────────────────────────────────────── */
function ShieldPlaceholder({ name }) {
  const initial = name?.[0]?.toUpperCase() || "?";
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <path
        d="M18 2L32 8V20C32 27.5 25.5 33.5 18 35C10.5 33.5 4 27.5 4 20V8L18 2Z"
        fill="#2a2a2a"
        stroke="#3f3f46"
        strokeWidth="1.5"
      />
      <text
        x="18"
        y="23"
        textAnchor="middle"
        fontSize="13"
        fontWeight="700"
        fill="#71717a"
        fontFamily="Arial"
      >
        {initial}
      </text>
    </svg>
  );
}

/* ── Game watermark (background, opacity 0.05) ─────────────────── */
function GameWatermark({ game }) {
  const s = {
    position: "absolute",
    right: "-6px",
    top: "50%",
    transform: "translateY(-50%)",
    opacity: 0.05,
    pointerEvents: "none",
    zIndex: 0,
  };
  if (game === "valorant") {
    return (
      <svg style={s} width="130" height="130" viewBox="0 0 24 24" fill="none">
        <polygon points="2,3 13,3 22,12 13,15" fill="#FF4655" />
        <polygon points="2,3 13,15 2,21" fill="#FF4655" />
      </svg>
    );
  }
  if (game === "cs2") {
    return (
      <svg style={s} width="130" height="130" viewBox="0 0 24 24" fill="none">
        <rect x="1" y="1" width="22" height="22" rx="4" fill="#F4941D" />
        <text
          x="12"
          y="16.5"
          textAnchor="middle"
          fontSize="9"
          fontWeight="900"
          fill="white"
          fontFamily="Arial"
        >
          CS2
        </text>
      </svg>
    );
  }
  if (game === "lol") {
    return (
      <svg style={s} width="130" height="130" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 1L22 6V13C22 18 17.5 22.5 12 23C6.5 22.5 2 18 2 13V6L12 1Z"
          fill="#C8AA6E"
        />
        <path
          d="M12 4L19 8V13C19 17 15.9 20.3 12 21C8.1 20.3 5 17 5 13V8L12 4Z"
          fill="#0A1428"
        />
      </svg>
    );
  }
  if (game === "pubgm") {
    return (
      <svg style={s} width="130" height="130" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="11" fill="#F5A623" />
        <circle cx="12" cy="12" r="6.5" fill="#1A1A1A" />
        <circle cx="12" cy="12" r="2" fill="#F5A623" />
        <line
          x1="12"
          y1="1"
          x2="12"
          y2="5.5"
          stroke="#F5A623"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="12"
          y1="18.5"
          x2="12"
          y2="23"
          stroke="#F5A623"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="1"
          y1="12"
          x2="5.5"
          y2="12"
          stroke="#F5A623"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="18.5"
          y1="12"
          x2="23"
          y2="12"
          stroke="#F5A623"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return null;
}

function TeamLogo({ src, name, size = "h-12 w-12" }) {
  if (src) {
    return (
      <div
        className={`${size} flex items-center justify-center rounded-xl bg-[#262626] border border-gray-800 overflow-hidden`}
      >
        <img
          src={src}
          alt={name}
          className="h-10 w-10 object-contain"
          onError={(e) => {
            e.target.style.display = "none";
            e.target.nextSibling.style.display = "flex";
          }}
        />
        <div
          style={{ display: "none" }}
          className="h-full w-full items-center justify-center"
        >
          <ShieldPlaceholder name={name} />
        </div>
      </div>
    );
  }
  return (
    <div
      className={`${size} flex items-center justify-center rounded-xl bg-[#1A1A1A] border border-gray-800`}
    >
      <ShieldPlaceholder name={name} />
    </div>
  );
}

/* ── Star / Favourite toggle ──────────────────────────────────── */
function StarButton({
  teamId,
  teamName,
  teamLogo,
  game,
  favoriteIds,
  onToggle,
  mutLoading,
}) {
  if (!teamId) return null;
  const isFav = favoriteIds.has(String(teamId));
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle({ teamId: String(teamId), teamName, teamLogo, game, isFav });
      }}
      disabled={mutLoading}
      title={isFav ? "Favoriden çıkar" : "Favoriye ekle"}
      className={`p-1 rounded-lg transition-all focus:outline-none ${isFav ? "text-yellow-400 hover:text-yellow-300" : "text-gray-600 hover:text-yellow-500"} disabled:opacity-40`}
    >
      <Star size={13} fill={isFav ? "currentColor" : "none"} strokeWidth={2} />
    </button>
  );
}

/* ── Popular Leagues sidebar ────────────────────────────────────── */
const LEAGUES = [
  {
    name: "VCT EMEA",
    leagueId: "vct-emea",
    game: "valorant",
    region: "EMEA",
    flag: "🌍",
    tier: "S",
  },
  {
    name: "VCT Americas",
    leagueId: "vct-americas",
    game: "valorant",
    region: "Americas",
    flag: "🌎",
    tier: "S",
  },
  {
    name: "VCT Pacific",
    leagueId: "vct-pacific",
    game: "valorant",
    region: "Pacific",
    flag: "🌏",
    tier: "A",
  },
  {
    name: "LEC",
    leagueId: "lec",
    game: "lol",
    region: "EMEA",
    flag: "🌍",
    tier: "S",
  },
  {
    name: "LCK",
    leagueId: "lck",
    game: "lol",
    region: "Korea",
    flag: "🇰🇷",
    tier: "S",
  },
  {
    name: "LPL",
    leagueId: "lpl",
    game: "lol",
    region: "China",
    flag: "🇨🇳",
    tier: "S",
  },
  {
    name: "PGL Major CS2",
    leagueId: "pgl-major",
    game: "cs2",
    region: "Global",
    flag: "🌐",
    tier: "S",
  },
  {
    name: "BLAST Premier",
    leagueId: "blast-premier",
    game: "cs2",
    region: "Global",
    flag: "🌐",
    tier: "A",
  },
  {
    name: "PUBG Mobile World",
    leagueId: "pmgc",
    game: "pubg",
    region: "Global",
    flag: "🌐",
    tier: "A",
  },
];
const TIER_ORDER = { S: 0, A: 1, B: 2 };
const TIER_STYLE = {
  S: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
  A: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  B: "bg-gray-500/10 text-gray-400 border border-gray-500/20",
};

function PopularLeagues({ matches }) {
  const liveGames = new Set(
    (matches || []).filter((m) => m.status === "live").map((m) => m.game),
  );
  const sorted = [...LEAGUES].sort((a, b) => {
    const diff =
      (liveGames.has(a.game) ? 0 : 1) - (liveGames.has(b.game) ? 0 : 1);
    return diff !== 0
      ? diff
      : (TIER_ORDER[a.tier] || 9) - (TIER_ORDER[b.tier] || 9);
  });
  return (
    <div className="rounded-2xl bg-[#1E1E1E] p-5 border border-gray-800">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
        <Trophy size={16} className="text-yellow-500" />
        Popüler Ligler
      </h3>
      <div className="space-y-2">
        {sorted.slice(0, 6).map((lg) => {
          const hasLive = liveGames.has(lg.game);
          return (
            <a
              key={lg.name}
              href={`/standings?game=${lg.game}&league=${lg.leagueId}`}
              className="flex items-center gap-3 rounded-xl bg-[#262626] p-3 transition-colors hover:bg-gray-800"
            >
              <span className="text-base leading-none">{lg.flag}</span>
              <div className="flex-1 min-w-0">
                <p
                  className="text-xs font-semibold text-gray-200 truncate"
                  translate="no"
                >
                  {lg.name}
                </p>
                <p className="text-[10px] text-gray-500">{lg.region}</p>
              </div>
              {hasLive ? (
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[9px] font-black text-red-400 ring-1 ring-red-500/20">
                  <span className="live-dot h-1 w-1 rounded-full bg-red-400" />
                  CANLI
                </span>
              ) : (
                <span
                  className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-black ${TIER_STYLE[lg.tier] || TIER_STYLE.B}`}
                >
                  {lg.tier}
                </span>
              )}
            </a>
          );
        })}
      </div>
      <a
        href="/standings"
        className="mt-4 block w-full rounded-xl border border-gray-800 py-2 text-center text-xs font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-all"
      >
        Tüm Puan Durumları →
      </a>
    </div>
  );
}

/* ── Favori Takımlar bölümü ─────────────────────────────────────── */
function FavoriteTeamsSection({
  favorites,
  allMatches,
  favoriteIds,
  onToggle,
  mutLoading,
}) {
  if (!favorites || favorites.length === 0) return null;
  const favSet = new Set(favorites.map((f) => String(f.team_id)));
  const favMatches = (allMatches || []).filter(
    (m) =>
      (m.team_a_id && favSet.has(String(m.team_a_id))) ||
      (m.team_b_id && favSet.has(String(m.team_b_id))),
  );

  return (
    <div className="mb-8 rounded-2xl bg-gradient-to-r from-yellow-900/20 to-orange-900/10 border border-yellow-500/20 p-5">
      <div className="mb-4 flex items-center gap-2">
        <Star size={16} className="text-yellow-400" fill="currentColor" />
        <h2 className="text-sm font-bold text-white">Takip Ettiğim Takımlar</h2>
        <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-[10px] font-bold text-yellow-400 border border-yellow-500/20">
          {favorites.length} takım
        </span>
      </div>

      {/* Favori takım pilleri */}
      <div className="mb-4 flex flex-wrap gap-2">
        {favorites.map((fav) => (
          <div
            key={fav.team_id}
            className="flex items-center gap-1.5 rounded-full bg-[#1E1E1E] border border-gray-800 pl-2 pr-1 py-1"
          >
            {fav.team_logo && (
              <img
                src={fav.team_logo}
                alt={fav.team_name}
                className="h-4 w-4 object-contain rounded"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            )}
            <span
              className="text-xs font-semibold text-gray-200"
              translate="no"
            >
              {fav.team_name}
            </span>
            <button
              onClick={() =>
                onToggle({
                  teamId: fav.team_id,
                  teamName: fav.team_name,
                  teamLogo: fav.team_logo,
                  isFav: true,
                })
              }
              disabled={mutLoading}
              className="ml-0.5 rounded-full p-0.5 text-yellow-500 hover:text-gray-500 transition-colors disabled:opacity-40"
              title="Favoriden çıkar"
            >
              <Star size={11} fill="currentColor" />
            </button>
          </div>
        ))}
      </div>

      {/* Favori takımların güncel maçları */}
      {favMatches.length > 0 ? (
        <div className="space-y-2">
          {favMatches.slice(0, 5).map((m) => {
            const aFav = m.team_a_id && favSet.has(String(m.team_a_id));
            const bFav = m.team_b_id && favSet.has(String(m.team_b_id));
            return (
              <a
                key={m.id}
                href={`/match/${m.id}`}
                className="flex items-center gap-3 rounded-xl bg-[#1A1A1A] border border-gray-800 px-4 py-2.5 hover:border-yellow-500/30 transition-all"
              >
                <div className="flex flex-1 items-center gap-2 min-w-0">
                  {m.team_a_logo && (
                    <img
                      src={m.team_a_logo}
                      alt={m.team_a_name}
                      className="h-5 w-5 object-contain rounded"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  )}
                  <span
                    className={`text-xs font-bold truncate ${aFav ? "text-yellow-300" : "text-gray-300"}`}
                    translate="no"
                  >
                    {m.team_a_name}
                  </span>
                </div>
                <div className="shrink-0 text-center min-w-[60px]">
                  {m.status === "live" && (
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="text-sm font-black text-white tabular-nums">
                        {m.score_a}–{m.score_b}
                      </span>
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500 live-dot" />
                    </div>
                  )}
                  {m.status === "finished" && (
                    <span className="text-sm font-black text-gray-500 tabular-nums">
                      {m.score_a}–{m.score_b}
                    </span>
                  )}
                  {m.status === "upcoming" && (
                    <span className="text-xs font-bold text-purple-400">
                      {new Date(m.start_time).toLocaleTimeString("tr-TR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>
                <div className="flex flex-1 items-center justify-end gap-2 min-w-0">
                  <span
                    className={`text-xs font-bold truncate ${bFav ? "text-yellow-300" : "text-gray-300"}`}
                    translate="no"
                  >
                    {m.team_b_name}
                  </span>
                  {m.team_b_logo && (
                    <img
                      src={m.team_b_logo}
                      alt={m.team_b_name}
                      className="h-5 w-5 object-contain rounded"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  )}
                </div>
                {m.status === "live" && (
                  <span className="shrink-0 rounded-full bg-red-500/10 px-2 py-0.5 text-[9px] font-black text-red-400 ring-1 ring-red-500/20">
                    CANLI
                  </span>
                )}
                {m.status === "upcoming" && (
                  <span className="shrink-0 rounded-full bg-purple-900/20 px-2 py-0.5 text-[9px] font-black text-purple-400 border border-purple-900/30">
                    YAKINDA
                  </span>
                )}
              </a>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-gray-500 italic mt-1">
          Favori takımların şu an aktif maç oynamıyor. Yeni maçlar listeye
          eklendiğinde burada görünecek.
        </p>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   Home Page
══════════════════════════════════════════════════════════════════════════ */
export default function HomePage() {
  const [activeTab, setActiveTab] = useState("hepsi");
  const { data: user } = useUser();
  const queryClient = useQueryClient();

  /* ── All matches ── */
  const { data: matches = [], isLoading } = useQuery({
    queryKey: ["matches", activeTab],
    queryFn: async () => {
      const res = await fetch(`/api/matches?game=${activeTab}`);
      if (!res.ok) throw new Error("Maçlar yüklenemedi");
      return res.json();
    },
    refetchInterval: 30000,
  });

  /* ── Favorites (only when logged in) ── */
  const { data: favorites = [] } = useQuery({
    queryKey: ["favorites"],
    queryFn: async () => {
      const res = await fetch("/api/favorites");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user,
    staleTime: 30000,
  });

  const favoriteIds = new Set((favorites || []).map((f) => String(f.team_id)));

  /* ── Toggle favourite (optimistic) ── */
  const toggleFav = useMutation({
    mutationFn: async ({ teamId, teamName, teamLogo, game, isFav }) => {
      if (isFav) {
        const res = await fetch(
          `/api/favorites?team_id=${encodeURIComponent(teamId)}`,
          { method: "DELETE" },
        );
        if (!res.ok) throw new Error("Favoriden çıkarılamadı");
      } else {
        const res = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            team_id: teamId,
            team_name: teamName,
            team_logo: teamLogo,
            game,
          }),
        });
        if (!res.ok) throw new Error("Favoriye eklenemedi");
      }
    },
    onMutate: async ({ teamId, teamName, teamLogo, game, isFav }) => {
      await queryClient.cancelQueries({ queryKey: ["favorites"] });
      const prev = queryClient.getQueryData(["favorites"]);
      queryClient.setQueryData(["favorites"], (old = []) =>
        isFav
          ? old.filter((f) => String(f.team_id) !== String(teamId))
          : [
              ...old,
              {
                team_id: teamId,
                team_name: teamName,
                team_logo: teamLogo,
                game,
              },
            ],
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["favorites"], ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["favorites"] }),
  });

  return (
    <div className="min-h-screen bg-[#121212]">
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        {/* ── Favori Takımlar bölümü ── */}
        {user && favorites.length > 0 && (
          <FavoriteTeamsSection
            favorites={favorites}
            allMatches={matches}
            favoriteIds={favoriteIds}
            onToggle={(args) => toggleFav.mutate(args)}
            mutLoading={toggleFav.isLoading}
          />
        )}

        {/* ── Game Tabs ── */}
        <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {GAME_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-5 py-2.5 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-500/25"
                  : "bg-[#1E1E1E] text-gray-400 hover:bg-[#262626] hover:text-white border border-gray-800"
              }`}
            >
              <span
                className={activeTab === tab.id ? "opacity-100" : "opacity-70"}
              >
                {tab.icon}
              </span>
              <span translate="no">{tab.name}</span>
            </button>
          ))}
        </div>

        {/* ── Main Grid ── */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left: match cards */}
          <div className="lg:col-span-8">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <Calendar size={20} className="text-purple-500" />
              Günün Maçları
            </h2>

            <div className="space-y-4">
              {isLoading ? (
                Array(3)
                  .fill(0)
                  .map((_, i) => (
                    <div
                      key={i}
                      className="h-32 w-full rounded-2xl bg-[#1E1E1E] loading-shimmer"
                    />
                  ))
              ) : matches.length > 0 ? (
                matches.map((match, index) => {
                  const aFav =
                    match.team_a_id && favoriteIds.has(String(match.team_a_id));
                  const bFav =
                    match.team_b_id && favoriteIds.has(String(match.team_b_id));
                  const gameColor = GAME_COLORS[match.game] || "#6b7280";
                  return (
                    <div key={match.id}>
                      {/* ── Match Card ── */}
                      <div
                        className="group relative overflow-hidden rounded-2xl bg-[#1E1E1E] border border-gray-800 transition-all hover:border-gray-700 hover:bg-[#252525] cursor-pointer"
                        style={{ borderLeft: `4px solid ${gameColor}` }}
                        onClick={() => {
                          window.location.href = `/match/${match.id}`;
                        }}
                      >
                        {/* Background watermark */}
                        <GameWatermark game={match.game} />

                        {/* ── Tournament strip ── */}
                        <div className="relative z-10 flex items-center justify-between border-b border-gray-800/60 px-4 py-2.5 gap-2">
                          {/* Tournament name — links to tournament page */}
                          {match.pandascore_tournament_id ? (
                            <a
                              href={`/tournament/${match.pandascore_tournament_id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-sm font-bold text-white hover:text-purple-300 transition-colors truncate max-w-[55%]"
                              translate="no"
                            >
                              {match.tournament}
                            </a>
                          ) : (
                            <span
                              className="text-sm font-bold text-white truncate max-w-[55%]"
                              translate="no"
                            >
                              {match.tournament}
                            </span>
                          )}

                          {/* Right side: game badge + status */}
                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className="rounded-full px-2.5 py-0.5 text-[10px] font-black"
                              style={{
                                color: gameColor,
                                backgroundColor: `${gameColor}18`,
                                border: `1px solid ${gameColor}35`,
                              }}
                              translate="no"
                            >
                              {GAME_SHORT[match.game] || match.game}
                            </span>
                            {match.status === "live" && (
                              <div className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-1 text-[10px] font-bold text-red-500 ring-1 ring-red-500/20">
                                <span className="live-dot h-1.5 w-1.5 rounded-full bg-red-500" />
                                CANLI
                              </div>
                            )}
                            {match.status === "finished" && (
                              <span className="rounded-full bg-gray-800 px-2.5 py-1 text-[10px] font-bold text-gray-500">
                                BİTTİ
                              </span>
                            )}
                            {match.status === "upcoming" && (
                              <span className="rounded-full bg-purple-900/30 px-2.5 py-1 text-[10px] font-bold text-purple-400 border border-purple-900/40">
                                YAKINDA
                              </span>
                            )}
                          </div>
                        </div>

                        {/* ── Teams row ── */}
                        <div className="relative z-10 flex items-center justify-between px-2 py-4 md:px-6">
                          {/* Team A */}
                          <div className="flex w-2/5 flex-col items-center gap-2">
                            <div className="relative">
                              {match.team_a_id ? (
                                <a
                                  href={`/team/${match.team_a_id}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="block hover:opacity-80 transition-opacity"
                                >
                                  <TeamLogo
                                    src={match.team_a_logo}
                                    name={match.team_a_name}
                                  />
                                </a>
                              ) : (
                                <TeamLogo
                                  src={match.team_a_logo}
                                  name={match.team_a_name}
                                />
                              )}
                              {user && match.team_a_id && (
                                <div className="absolute -top-1.5 -right-1.5">
                                  <StarButton
                                    teamId={match.team_a_id}
                                    teamName={match.team_a_name}
                                    teamLogo={match.team_a_logo}
                                    game={match.game}
                                    favoriteIds={favoriteIds}
                                    onToggle={(a) => toggleFav.mutate(a)}
                                    mutLoading={toggleFav.isLoading}
                                  />
                                </div>
                              )}
                            </div>
                            {match.team_a_id ? (
                              <a
                                href={`/team/${match.team_a_id}`}
                                onClick={(e) => e.stopPropagation()}
                                className={`text-center text-sm font-bold hover:text-purple-300 transition-colors leading-tight ${aFav ? "text-yellow-300" : "text-white"}`}
                                translate="no"
                              >
                                {match.team_a_name}
                              </a>
                            ) : (
                              <span
                                className={`text-center text-sm font-medium leading-tight ${aFav ? "text-yellow-300" : "text-white"}`}
                                translate="no"
                              >
                                {match.team_a_name}
                              </span>
                            )}
                          </div>

                          {/* Score / Time */}
                          <div className="flex flex-col items-center gap-1">
                            {match.status === "live" ? (
                              <div className="text-2xl font-black text-white tabular-nums">
                                {match.score_a}{" "}
                                <span className="text-gray-600">-</span>{" "}
                                {match.score_b}
                              </div>
                            ) : match.status === "finished" ? (
                              <div className="text-2xl font-black text-gray-400 tabular-nums">
                                {match.score_a}{" "}
                                <span className="text-gray-700">-</span>{" "}
                                {match.score_b}
                              </div>
                            ) : (
                              <div className="text-lg font-bold text-gray-300">
                                {new Date(match.start_time).toLocaleTimeString(
                                  "tr-TR",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </div>
                            )}
                            <span className="text-[10px] font-medium text-gray-500 uppercase tracking-widest">
                              BO3
                            </span>
                          </div>

                          {/* Team B */}
                          <div className="flex w-2/5 flex-col items-center gap-2">
                            <div className="relative">
                              {match.team_b_id ? (
                                <a
                                  href={`/team/${match.team_b_id}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="block hover:opacity-80 transition-opacity"
                                >
                                  <TeamLogo
                                    src={match.team_b_logo}
                                    name={match.team_b_name}
                                  />
                                </a>
                              ) : (
                                <TeamLogo
                                  src={match.team_b_logo}
                                  name={match.team_b_name}
                                />
                              )}
                              {user && match.team_b_id && (
                                <div className="absolute -top-1.5 -right-1.5">
                                  <StarButton
                                    teamId={match.team_b_id}
                                    teamName={match.team_b_name}
                                    teamLogo={match.team_b_logo}
                                    game={match.game}
                                    favoriteIds={favoriteIds}
                                    onToggle={(a) => toggleFav.mutate(a)}
                                    mutLoading={toggleFav.isLoading}
                                  />
                                </div>
                              )}
                            </div>
                            {match.team_b_id ? (
                              <a
                                href={`/team/${match.team_b_id}`}
                                onClick={(e) => e.stopPropagation()}
                                className={`text-center text-sm font-bold hover:text-purple-300 transition-colors leading-tight ${bFav ? "text-yellow-300" : "text-white"}`}
                                translate="no"
                              >
                                {match.team_b_name}
                              </a>
                            ) : (
                              <span
                                className={`text-center text-sm font-medium leading-tight ${bFav ? "text-yellow-300" : "text-white"}`}
                                translate="no"
                              >
                                {match.team_b_name}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* ── View match link ── */}
                        <div className="relative z-10 flex items-center justify-end border-t border-gray-800/40 px-4 py-2">
                          <span className="text-[10px] font-semibold text-gray-600 group-hover:text-purple-400 transition-colors">
                            Maç Detayı →
                          </span>
                        </div>
                      </div>

                      {/* Ad placeholder every 2nd match */}
                      {(index + 1) % 2 === 0 && (
                        <div className="my-4 flex h-20 items-center justify-center rounded-2xl border-2 border-dashed border-gray-800 bg-[#1E1E1E]/30 text-xs font-medium text-gray-700">
                          REKLAM ALANI
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                  <Gamepad2 size={48} className="mb-4 opacity-20" />
                  <p>Bu kategoride maç bulunamadı.</p>
                  {!user && (
                    <p className="mt-3 text-xs text-gray-600">
                      <a
                        href="/account/signin"
                        className="text-purple-400 hover:underline"
                      >
                        Giriş yap
                      </a>{" "}
                      ve favori takımlarını takip et.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: sticky sidebar */}
          <div className="lg:col-span-4">
            <div className="sticky top-20 flex flex-col gap-6">
              <PopularLeagues matches={matches} />

              {/* Gamer Tahmin CTA */}
              <div className="rounded-2xl bg-gradient-to-br from-purple-900/40 to-blue-900/40 p-6 border border-purple-500/20">
                <h3 className="mb-2 text-md font-bold text-white">
                  Gamer Tahmin'e Katıl!
                </h3>
                <p className="mb-4 text-xs text-gray-400">
                  Maç sonuçlarını doğru tahmin et, puanları topla ve liderlik
                  tablosunda yerini al.
                </p>
                <a
                  href="/leaderboard"
                  className="block w-full rounded-xl bg-purple-600 py-2.5 text-center text-sm font-semibold text-white shadow-lg shadow-purple-500/20 hover:bg-purple-700 transition-all"
                >
                  Liderlik Tablosu
                </a>
              </div>

              {/* Favorites CTA for guests */}
              {!user && (
                <div className="rounded-2xl bg-[#1E1E1E] p-5 border border-yellow-500/10">
                  <div className="mb-3 flex items-center gap-2">
                    <Star
                      size={16}
                      className="text-yellow-400"
                      fill="currentColor"
                    />
                    <h3 className="text-sm font-bold text-white">
                      Takım Takibi
                    </h3>
                  </div>
                  <p className="mb-4 text-xs text-gray-400">
                    Favori takımlarını yıldızla, güncel maçlarını anında gör.
                  </p>
                  <a
                    href="/account/signin"
                    className="block w-full rounded-xl bg-yellow-500/10 py-2 text-center text-xs font-semibold text-yellow-400 hover:bg-yellow-500/20 transition-all border border-yellow-500/20"
                  >
                    Giriş Yap
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-gray-800 bg-[#1E1E1E] py-10">
        <div className="mx-auto max-w-7xl px-4 text-center text-gray-500 md:px-8">
          <p className="text-sm" translate="no">
            © 2026 VibeSkor. Tüm Hakları Saklıdır.
          </p>
          <p className="mt-1 text-xs">
            E-spor maç takip ve topluluk platformu.
          </p>
        </div>
      </footer>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes livePulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.3;
          }
        }
        .live-dot {
          animation: livePulse 1.5s ease-in-out infinite;
        }
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        .loading-shimmer {
          background: linear-gradient(
            90deg,
            #1e1e1e 25%,
            #2a2a2a 50%,
            #1e1e1e 75%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
      `}</style>
    </div>
  );
}
