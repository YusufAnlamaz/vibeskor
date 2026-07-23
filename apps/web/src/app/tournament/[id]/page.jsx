"use client";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Trophy,
  Users,
  ChevronRight,
  Swords,
  Calendar,
} from "lucide-react";

/* ── Constants ─────────────────────────────────────────────────────────── */
const GAME_COLORS = {
  valorant: "#ff4655",
  lol: "#C8AA6E",
  cs2: "#F4941D",
  pubgm: "#F5A623",
};
const GAME_NAMES = {
  valorant: "Valorant",
  lol: "League of Legends",
  cs2: "CS2",
  pubgm: "PUBG Mobile",
};

/* ── Small helpers ──────────────────────────────────────────────────────── */
function ShieldPlaceholder({ name, size = 28 }) {
  const initial = name?.[0]?.toUpperCase() || "?";
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
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

function TeamLogoSm({ src, name }) {
  if (!src) return <ShieldPlaceholder name={name} size={28} />;
  return (
    <img
      src={src}
      alt={name}
      className="h-7 w-7 object-contain rounded"
      onError={(e) => {
        e.target.style.display = "none";
      }}
    />
  );
}

/* ── Match mini-card ─────────────────────────────────────────────────────── */
function MatchCard({ m }) {
  const statusStyle =
    m.status === "live"
      ? "text-red-400 bg-red-500/10 border border-red-500/20"
      : m.status === "finished"
        ? "text-gray-500 bg-gray-800 border border-gray-700"
        : "text-purple-400 bg-purple-500/10 border border-purple-500/20";
  const statusLabel =
    m.status === "live"
      ? "CANLI"
      : m.status === "finished"
        ? "BİTTİ"
        : "YAKINDA";

  return (
    <a
      href={`/match/${m.id}`}
      className="flex items-center gap-3 rounded-xl bg-[#262626] border border-gray-800 px-4 py-3 transition-all hover:border-gray-700"
    >
      {/* Team A */}
      <div className="flex flex-1 items-center gap-2 min-w-0 justify-end">
        <span
          className="text-xs font-bold text-gray-200 truncate text-right"
          translate="no"
        >
          {m.team_a_name}
        </span>
        <TeamLogoSm src={m.team_a_logo} name={m.team_a_name} />
      </div>

      {/* Score/vs */}
      <div className="shrink-0 min-w-[56px] text-center">
        {m.status === "finished" || m.status === "live" ? (
          <span
            className={`text-sm font-black tabular-nums ${m.status === "live" ? "text-white" : "text-gray-400"}`}
          >
            {m.score_a}–{m.score_b}
          </span>
        ) : (
          <span className="text-xs font-bold text-gray-500">
            {new Date(m.start_time).toLocaleTimeString("tr-TR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>

      {/* Team B */}
      <div className="flex flex-1 items-center gap-2 min-w-0">
        <TeamLogoSm src={m.team_b_logo} name={m.team_b_name} />
        <span
          className="text-xs font-bold text-gray-200 truncate"
          translate="no"
        >
          {m.team_b_name}
        </span>
      </div>

      {/* Status */}
      <span
        className={`shrink-0 rounded px-2 py-0.5 text-[9px] font-black ${statusStyle}`}
      >
        {statusLabel}
      </span>
    </a>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   Tournament Profile Page
══════════════════════════════════════════════════════════════════════════ */
export default function TournamentPage({ params }) {
  const { id } = params;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["tournament", id],
    queryFn: async () => {
      const res = await fetch(`/api/tournaments/${id}`);
      if (!res.ok) throw new Error("Turnuva yüklenemedi");
      return res.json();
    },
    staleTime: 60000,
  });

  const tournament = data?.tournament;
  const standings = data?.standings || [];
  const teams = data?.teams || [];
  const matches = data?.matches || [];

  const gameColor = GAME_COLORS[tournament?.game] || "#8b5cf6";
  const gameName = GAME_NAMES[tournament?.game] || tournament?.game || "";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <Trophy size={32} className="text-purple-500 spin-icon" />
        <style
          jsx
          global
        >{`@keyframes spin{to{transform:rotate(360deg)}}.spin-icon{animation:spin 1s linear infinite}`}</style>
      </div>
    );
  }

  if (isError || !tournament) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center gap-4 text-white">
        <Trophy size={48} className="text-gray-700 opacity-30" />
        <p className="text-gray-400">Turnuva bulunamadı.</p>
        <a
          href="/"
          className="rounded-xl bg-purple-600 px-6 py-2 text-sm font-medium hover:bg-purple-700 transition-all"
        >
          Ana Sayfaya Dön
        </a>
      </div>
    );
  }

  const hasStandings = standings.length > 0;
  const liveMatches = matches.filter((m) => m.status === "live");
  const upcomingMatches = matches.filter((m) => m.status === "upcoming");
  const finishedMatches = matches.filter((m) => m.status === "finished");

  return (
    <div className="min-h-screen bg-[#121212] text-white" translate="no">
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden border-b border-gray-800"
        style={{
          background: `linear-gradient(135deg, ${gameColor}18 0%, #121212 70%)`,
        }}
      >
        {/* Decorative orb */}
        <div
          className="absolute -right-16 -top-16 h-72 w-72 rounded-full opacity-[0.06]"
          style={{
            background: `radial-gradient(circle, ${gameColor}, transparent 70%)`,
          }}
        />

        <div className="mx-auto max-w-5xl px-4 py-10 md:px-8">
          <a
            href="/"
            className="mb-6 inline-flex items-center gap-2 rounded-lg bg-gray-800/60 px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={14} /> Ana Sayfa
          </a>

          {/* Trophy icon + name */}
          <div className="flex items-start gap-5">
            <div
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-gray-800 bg-[#1a1a1a]"
              style={{ boxShadow: `0 0 32px ${gameColor}20` }}
            >
              <Trophy size={36} style={{ color: gameColor }} />
            </div>
            <div>
              {/* Game badge */}
              <span
                className="mb-1.5 inline-block rounded-full px-3 py-0.5 text-xs font-black"
                style={{
                  backgroundColor: `${gameColor}18`,
                  color: gameColor,
                  border: `1px solid ${gameColor}30`,
                }}
              >
                {gameName}
              </span>

              {/* League / serie breadcrumb */}
              {tournament.league_name && (
                <p className="text-xs text-gray-500 mb-0.5" translate="no">
                  {tournament.league_name}
                </p>
              )}
              {tournament.serie_name &&
                tournament.serie_name !== tournament.league_name && (
                  <p className="text-xs text-gray-500 mb-0.5" translate="no">
                    → {tournament.serie_name}
                  </p>
                )}

              <h1
                className="text-2xl font-black text-white md:text-3xl"
                translate="no"
              >
                {tournament.full_name || tournament.name}
              </h1>

              {/* Meta row */}
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                {tournament.begin_at && (
                  <span className="flex items-center gap-1">
                    <Calendar size={12} className="text-gray-600" />
                    {new Date(tournament.begin_at).toLocaleDateString("tr-TR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                    {tournament.end_at && (
                      <>
                        {" "}
                        →{" "}
                        {new Date(tournament.end_at).toLocaleDateString(
                          "tr-TR",
                          { day: "2-digit", month: "long" },
                        )}
                      </>
                    )}
                  </span>
                )}
                {tournament.prizepool && (
                  <span className="flex items-center gap-1">
                    <Trophy size={12} className="text-yellow-500" />
                    {tournament.prizepool}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Users size={12} className="text-gray-600" />
                  {teams.length} takım
                </span>
                {liveMatches.length > 0 && (
                  <span className="flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-black text-red-400 ring-1 ring-red-500/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-400 live-dot" />
                    {liveMatches.length} CANLI
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-5xl px-4 py-8 md:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* ── LEFT: Standings + Matches ── */}
          <div className="lg:col-span-2 space-y-8">
            {/* Standings */}
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-white">
                <Trophy size={18} style={{ color: gameColor }} />
                Puan Durumu
              </h2>

              {hasStandings ? (
                <div className="rounded-2xl border border-gray-800 bg-[#1E1E1E] overflow-hidden">
                  {/* Table header */}
                  <div className="grid grid-cols-[2rem_1fr_3rem_3rem_3rem_3rem] gap-x-3 border-b border-gray-800 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    <span>#</span>
                    <span>Takım</span>
                    <span className="text-right">O</span>
                    <span className="text-right text-green-500">G</span>
                    <span className="text-right text-red-500">M</span>
                    <span className="text-right" style={{ color: gameColor }}>
                      P
                    </span>
                  </div>

                  {standings.map((row, idx) => {
                    const isTop3 = idx < 3;
                    const medalEmoji =
                      idx === 0
                        ? "🥇"
                        : idx === 1
                          ? "🥈"
                          : idx === 2
                            ? "🥉"
                            : null;
                    return (
                      <div
                        key={row.team_id || idx}
                        className={`grid grid-cols-[2rem_1fr_3rem_3rem_3rem_3rem] gap-x-3 items-center px-4 py-3 transition-colors hover:bg-[#262626] ${isTop3 ? "border-l-2" : "border-l-2 border-transparent"}`}
                        style={isTop3 ? { borderColor: gameColor } : {}}
                      >
                        {/* Rank */}
                        <span className="text-xs font-black text-gray-400">
                          {medalEmoji || row.rank}
                        </span>

                        {/* Team */}
                        <div className="flex items-center gap-2 min-w-0">
                          {row.team_logo ? (
                            <img
                              src={row.team_logo}
                              alt={row.team_name}
                              className="h-6 w-6 object-contain rounded shrink-0"
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                          ) : (
                            <ShieldPlaceholder name={row.team_name} size={24} />
                          )}
                          {row.team_id ? (
                            <a
                              href={`/team/${row.team_id}`}
                              className="text-sm font-bold text-white hover:text-purple-300 transition-colors truncate"
                              translate="no"
                            >
                              {row.team_name}
                            </a>
                          ) : (
                            <span
                              className="text-sm font-bold text-white truncate"
                              translate="no"
                            >
                              {row.team_name}
                            </span>
                          )}
                        </div>

                        <span className="text-right text-xs font-semibold text-gray-400 tabular-nums">
                          {row.played}
                        </span>
                        <span className="text-right text-xs font-bold text-green-400 tabular-nums">
                          {row.wins}
                        </span>
                        <span className="text-right text-xs font-bold text-red-400 tabular-nums">
                          {row.losses}
                        </span>
                        <span
                          className="text-right text-sm font-black tabular-nums"
                          style={{ color: gameColor }}
                        >
                          {row.points}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-800 bg-[#1E1E1E] py-12 text-gray-600">
                  <Trophy size={36} className="mb-3 opacity-15" />
                  <p className="text-sm text-gray-500">
                    Puan durumu henüz mevcut değil.
                  </p>
                  <p className="mt-1 text-xs text-gray-700">
                    Turnuva ilerledikçe burası güncellenecek.
                  </p>
                </div>
              )}
            </section>

            {/* Live Matches */}
            {liveMatches.length > 0 && (
              <section>
                <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-white">
                  <span className="h-2 w-2 rounded-full bg-red-400 live-dot" />
                  Canlı Maçlar
                </h2>
                <div className="space-y-2">
                  {liveMatches.map((m) => (
                    <MatchCard key={m.id} m={m} />
                  ))}
                </div>
              </section>
            )}

            {/* Upcoming Matches */}
            {upcomingMatches.length > 0 && (
              <section>
                <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-white">
                  <Calendar size={18} className="text-purple-400" />
                  Yaklaşan Maçlar
                </h2>
                <div className="space-y-2">
                  {upcomingMatches.map((m) => (
                    <MatchCard key={m.id} m={m} />
                  ))}
                </div>
              </section>
            )}

            {/* Finished Matches */}
            {finishedMatches.length > 0 && (
              <section>
                <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-400">
                  <Swords size={16} className="text-gray-600" />
                  Geçmiş Maçlar
                </h2>
                <div className="space-y-2">
                  {finishedMatches.slice(0, 10).map((m) => (
                    <MatchCard key={m.id} m={m} />
                  ))}
                  {finishedMatches.length > 10 && (
                    <p className="text-center text-xs text-gray-600 pt-2">
                      +{finishedMatches.length - 10} maç daha
                    </p>
                  )}
                </div>
              </section>
            )}
          </div>

          {/* ── RIGHT: Participating Teams ── */}
          <div>
            <div className="sticky top-20">
              <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-white">
                <Users size={18} style={{ color: gameColor }} />
                Katılımcı Takımlar
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-bold"
                  style={{
                    backgroundColor: `${gameColor}15`,
                    color: gameColor,
                  }}
                >
                  {teams.length}
                </span>
              </h2>

              <div className="rounded-2xl border border-gray-800 bg-[#1E1E1E] overflow-hidden">
                {teams.length > 0 ? (
                  teams.map((team, idx) => (
                    <a
                      key={team.id || idx}
                      href={`/team/${team.id}`}
                      className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 last:border-0 hover:bg-[#262626] transition-colors"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1A1A1A] border border-gray-800 overflow-hidden">
                        {team.logo ? (
                          <img
                            src={team.logo}
                            alt={team.name}
                            className="h-7 w-7 object-contain"
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        ) : (
                          <ShieldPlaceholder name={team.name} size={28} />
                        )}
                      </div>
                      <span
                        className="flex-1 text-sm font-semibold text-gray-200 truncate"
                        translate="no"
                      >
                        {team.name}
                      </span>
                      <ChevronRight
                        size={14}
                        className="shrink-0 text-gray-700"
                      />
                    </a>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-600">
                    <Users size={28} className="mb-2 opacity-15" />
                    <p className="text-xs">Takım listesi mevcut değil.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin-icon { animation: spin 1s linear infinite; }
        @keyframes livePulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        .live-dot { animation: livePulse 1.5s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
