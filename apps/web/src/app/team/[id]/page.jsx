"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Trophy,
  Users,
  Calendar,
  User,
  ChevronRight,
  Swords,
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

const FLAG_EMOJI = {
  TR: "🇹🇷",
  US: "🇺🇸",
  BR: "🇧🇷",
  RU: "🇷🇺",
  UA: "🇺🇦",
  DE: "🇩🇪",
  FR: "🇫🇷",
  ES: "🇪🇸",
  SE: "🇸🇪",
  DK: "🇩🇰",
  FI: "🇫🇮",
  KR: "🇰🇷",
  CN: "🇨🇳",
  JP: "🇯🇵",
  AU: "🇦🇺",
  PL: "🇵🇱",
  GB: "🇬🇧",
  UK: "🇬🇧",
  PT: "🇵🇹",
  NL: "🇳🇱",
  IT: "🇮🇹",
  CA: "🇨🇦",
  AR: "🇦🇷",
  CL: "🇨🇱",
  MX: "🇲🇽",
};

/* ── Helpers ────────────────────────────────────────────────────────────── */
function ShieldPlaceholder({ name, size = 36 }) {
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

function TeamLogo({ src, name, size = "h-24 w-24" }) {
  if (src) {
    return (
      <div
        className={`${size} flex items-center justify-center rounded-2xl bg-[#1a1a1a] border border-gray-800 overflow-hidden p-2`}
      >
        <img
          src={src}
          alt={name}
          className="h-full w-full object-contain"
          onError={(e) => {
            e.target.style.display = "none";
            e.target.nextSibling.style.display = "flex";
          }}
        />
        <div
          style={{ display: "none" }}
          className="h-full w-full items-center justify-center"
        >
          <ShieldPlaceholder name={name} size={64} />
        </div>
      </div>
    );
  }
  return (
    <div
      className={`${size} flex items-center justify-center rounded-2xl bg-[#1a1a1a] border border-gray-800`}
    >
      <ShieldPlaceholder name={name} size={64} />
    </div>
  );
}

/* ── Player Card ────────────────────────────────────────────────────────── */
function PlayerCard({ player, gameColor }) {
  const flag = FLAG_EMOJI[player.nationality?.toUpperCase()] || "";
  const bg = `${gameColor}12`;
  const border = `${gameColor}25`;

  return (
    <div
      className="flex items-center gap-3 rounded-xl border bg-[#262626] p-3 transition-all hover:border-gray-700"
      style={{ borderColor: border }}
    >
      {/* Avatar */}
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1A1A1A] border border-gray-800 overflow-hidden">
        {player.image_url ? (
          <>
            <img
              src={player.image_url}
              alt={player.name}
              className="h-full w-full object-cover"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "flex";
              }}
            />
            <div
              style={{ display: "none" }}
              className="h-full w-full items-center justify-center"
            >
              <User size={20} className="text-gray-600" />
            </div>
          </>
        ) : (
          <User size={20} className="text-gray-600" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className="text-sm font-bold text-white truncate"
            translate="no"
          >
            {player.name}
          </span>
          {flag && <span className="text-sm">{flag}</span>}
        </div>
        {(player.first_name || player.last_name) && (
          <p className="text-[10px] text-gray-500 truncate" translate="no">
            {[player.first_name, player.last_name].filter(Boolean).join(" ")}
          </p>
        )}
        {player.age && (
          <p className="text-[10px] text-gray-600">{player.age} yaş</p>
        )}
      </div>

      {/* Role badge */}
      {player.role && (
        <span
          className="shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-bold"
          style={{
            backgroundColor: bg,
            color: gameColor,
            border: `1px solid ${border}`,
          }}
        >
          {player.role}
        </span>
      )}
    </div>
  );
}

/* ── Match Row ──────────────────────────────────────────────────────────── */
function MatchRow({ m }) {
  const isWin = m.result === "win";
  const isLoss = m.result === "loss";
  const isLive = m.status === "live";
  const isUpcoming = m.status === "upcoming";

  const resultStyle = isWin
    ? "bg-green-500/10 text-green-400 border-green-500/20"
    : isLoss
      ? "bg-red-500/10 text-red-400 border-red-500/20"
      : isLive
        ? "bg-red-500/10 text-red-400 border-red-500/20"
        : "bg-purple-500/10 text-purple-400 border-purple-500/20";

  const resultLabel = isWin
    ? "G"
    : isLoss
      ? "M"
      : isLive
        ? "●"
        : isUpcoming
          ? "⏳"
          : "–";

  return (
    <a
      href={`/match/${m.id}`}
      className="flex items-center gap-3 rounded-xl bg-[#262626] border border-gray-800 px-4 py-3 transition-all hover:border-gray-700 hover:bg-[#2e2e2e]"
    >
      {/* Result pill */}
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-[11px] font-black ${resultStyle}`}
      >
        {resultLabel}
      </span>

      {/* Opponent */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {m.opponent_logo ? (
          <img
            src={m.opponent_logo}
            alt={m.opponent_name}
            className="h-6 w-6 object-contain rounded shrink-0"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        ) : (
          <div className="h-6 w-6 shrink-0 flex items-center justify-center rounded bg-[#1a1a1a] border border-gray-800">
            <Swords size={12} className="text-gray-600" />
          </div>
        )}
        <div className="min-w-0">
          {m.opponent_id ? (
            <a
              href={`/team/${m.opponent_id}`}
              onClick={(e) => e.stopPropagation()}
              className="text-xs font-bold text-white hover:text-purple-300 transition-colors truncate block"
              translate="no"
            >
              {m.opponent_name}
            </a>
          ) : (
            <span
              className="text-xs font-bold text-white truncate block"
              translate="no"
            >
              {m.opponent_name}
            </span>
          )}
          {m.tournament && (
            <p className="text-[10px] text-gray-600 truncate" translate="no">
              {m.tournament}
            </p>
          )}
        </div>
      </div>

      {/* Score */}
      <div className="shrink-0 text-right">
        {m.status === "finished" || m.status === "live" ? (
          <span
            className={`text-sm font-black tabular-nums ${isWin ? "text-green-400" : isLoss ? "text-red-400" : "text-white"}`}
          >
            {m.team_score}–{m.opponent_score}
          </span>
        ) : (
          <span className="text-[10px] text-gray-500">
            {new Date(m.start_time).toLocaleTimeString("tr-TR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
        <p className="text-[10px] text-gray-600">
          {new Date(m.start_time).toLocaleDateString("tr-TR", {
            day: "2-digit",
            month: "short",
          })}
        </p>
      </div>

      <ChevronRight size={14} className="shrink-0 text-gray-700" />
    </a>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   Team Profile Page
══════════════════════════════════════════════════════════════════════════ */
export default function TeamPage({ params }) {
  const { id } = params;
  const [activeTab, setActiveTab] = useState("roster");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["team", id],
    queryFn: async () => {
      const res = await fetch(`/api/teams/${id}`);
      if (!res.ok) throw new Error("Takım yüklenemedi");
      return res.json();
    },
    staleTime: 60000,
  });

  const team = data?.team;
  const players = data?.players || [];
  const matches = data?.matches || [];
  const gameColor = GAME_COLORS[team?.game] || "#8b5cf6";
  const gameName = GAME_NAMES[team?.game] || team?.game || "";

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

  if (isError || !team) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center gap-4 text-white">
        <Swords size={48} className="text-gray-700 opacity-30" />
        <p className="text-gray-400">Takım bulunamadı.</p>
        <a
          href="/"
          className="rounded-xl bg-purple-600 px-6 py-2 text-sm font-medium hover:bg-purple-700 transition-all"
        >
          Ana Sayfaya Dön
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white" translate="no">
      {/* ── Hero Header ──────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden border-b border-gray-800"
        style={{
          background: `linear-gradient(135deg, ${gameColor}18 0%, #121212 60%)`,
        }}
      >
        {/* Watermark circle */}
        <div
          className="absolute right-0 top-0 h-64 w-64 rounded-full opacity-[0.04]"
          style={{
            background: `radial-gradient(circle, ${gameColor}, transparent 70%)`,
            transform: "translate(30%, -30%)",
          }}
        />

        <div className="mx-auto max-w-5xl px-4 py-10 md:px-8">
          <a
            href="/"
            className="mb-6 inline-flex items-center gap-2 rounded-lg bg-gray-800/60 px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={14} /> Ana Sayfa
          </a>

          <div className="flex flex-col gap-6 md:flex-row md:items-end">
            {/* Logo */}
            <TeamLogo
              src={team.logo}
              name={team.name}
              size="h-28 w-28 md:h-36 md:w-36"
            />

            {/* Info */}
            <div className="flex-1">
              {/* Game badge */}
              <span
                className="mb-2 inline-block rounded-full px-3 py-1 text-xs font-black"
                style={{
                  backgroundColor: `${gameColor}18`,
                  color: gameColor,
                  border: `1px solid ${gameColor}30`,
                }}
              >
                {gameName}
              </span>

              <h1
                className="text-3xl font-black text-white md:text-4xl"
                translate="no"
              >
                {team.name}
                {team.acronym && team.acronym !== team.name && (
                  <span className="ml-3 text-xl font-bold text-gray-500">
                    ({team.acronym})
                  </span>
                )}
              </h1>

              {team.location && (
                <p className="mt-1 text-sm text-gray-400 flex items-center gap-1">
                  <span>📍</span> {team.location}
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Users size={14} className="text-gray-600" />
                  {players.length} oyuncu
                </span>
                <span className="flex items-center gap-1">
                  <Calendar size={14} className="text-gray-600" />
                  {matches.length} maç geçmişi
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="sticky top-16 z-30 border-b border-gray-800 bg-[#121212]/95 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-4 md:px-8">
          <div className="flex gap-1">
            {[
              { id: "roster", label: "Kadro", icon: <Users size={15} /> },
              {
                id: "history",
                label: "Maç Geçmişi",
                icon: <Calendar size={15} />,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 border-b-2 px-5 py-3.5 text-sm font-semibold transition-all ${
                  activeTab === tab.id
                    ? "border-current text-white"
                    : "border-transparent text-gray-500 hover:text-gray-300"
                }`}
                style={
                  activeTab === tab.id
                    ? { borderColor: gameColor, color: gameColor }
                    : {}
                }
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-5xl px-4 py-8 md:px-8">
        {/* Roster Tab */}
        {activeTab === "roster" && (
          <div>
            <h2 className="mb-5 flex items-center gap-2 text-base font-bold text-white">
              <Users size={18} style={{ color: gameColor }} />
              Oyuncu Kadrosu
              <span
                className="rounded-full px-2 py-0.5 text-xs font-bold"
                style={{ backgroundColor: `${gameColor}15`, color: gameColor }}
              >
                {players.length} oyuncu
              </span>
            </h2>

            {players.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {players.map((p) => (
                  <PlayerCard key={p.id} player={p} gameColor={gameColor} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-gray-600">
                <Users size={40} className="mb-4 opacity-15" />
                <p className="text-sm text-gray-500">
                  Kadro verisi henüz mevcut değil.
                </p>
                <p className="mt-1 text-xs text-gray-700">
                  PandaScore'da bu takım için oyuncu bilgisi bulunmuyor.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Match History Tab */}
        {activeTab === "history" && (
          <div>
            <h2 className="mb-5 flex items-center gap-2 text-base font-bold text-white">
              <Calendar size={18} style={{ color: gameColor }} />
              Maç Geçmişi
            </h2>

            {/* Win/loss summary */}
            {matches.filter((m) => m.status === "finished").length > 0 && (
              <div className="mb-6 flex items-center gap-4 rounded-2xl bg-[#1E1E1E] border border-gray-800 px-6 py-4">
                {(() => {
                  const finished = matches.filter(
                    (m) => m.status === "finished",
                  );
                  const wins = finished.filter(
                    (m) => m.result === "win",
                  ).length;
                  const losses = finished.filter(
                    (m) => m.result === "loss",
                  ).length;
                  const winRate =
                    finished.length > 0
                      ? Math.round((wins / finished.length) * 100)
                      : 0;
                  return (
                    <>
                      <div className="text-center">
                        <div className="text-2xl font-black text-green-400">
                          {wins}
                        </div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase">
                          Galibiyet
                        </div>
                      </div>
                      <div className="h-8 w-px bg-gray-800" />
                      <div className="text-center">
                        <div className="text-2xl font-black text-red-400">
                          {losses}
                        </div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase">
                          Mağlubiyet
                        </div>
                      </div>
                      <div className="h-8 w-px bg-gray-800" />
                      <div className="text-center">
                        <div
                          className="text-2xl font-black"
                          style={{ color: gameColor }}
                        >
                          {winRate}%
                        </div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase">
                          Kazanma Oranı
                        </div>
                      </div>
                      {/* Win rate bar */}
                      <div className="flex-1 hidden md:block">
                        <div className="mb-1 flex justify-between text-[10px] text-gray-600">
                          <span>Kazanma Oranı</span>
                          <span>{winRate}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-[#262626] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${winRate}%`,
                              backgroundColor: gameColor,
                            }}
                          />
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {matches.length > 0 ? (
              <div className="space-y-2">
                {matches.map((m) => (
                  <MatchRow key={m.id} m={m} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-gray-600">
                <Calendar size={40} className="mb-4 opacity-15" />
                <p className="text-sm text-gray-500">
                  Bu takıma ait maç kaydı bulunamadı.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin-icon { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
