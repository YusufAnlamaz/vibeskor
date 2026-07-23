"use client";
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Trophy,
  MessageSquare,
  Send,
  ChevronLeft,
  Info,
  CheckCircle,
  Clock,
  Swords,
  Users,
  GitBranch,
  Tv,
  Flag,
  User,
} from "lucide-react";
import useUser from "@/utils/useUser";

/* ── Game name map — translate="no" applied at render time ── */
const GAME_NAMES = {
  valorant: "Valorant",
  cs2: "CS2",
  lol: "League of Legends",
  pubgm: "PUBG Mobile",
};

/* ── Shield / logo fallback ─────────────────────────────── */
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

function TeamLogo({ src, name, size = "h-10 w-10" }) {
  const [broken, setBroken] = useState(false);
  if (src && !broken) {
    return (
      <img
        src={src}
        alt={name}
        className={`${size} object-contain rounded`}
        onError={() => setBroken(true)}
      />
    );
  }
  return (
    <ShieldPlaceholder
      name={name}
      size={parseInt(size.split("h-")[1]) * 4 || 40}
    />
  );
}

/* ── Countdown timer ─────────────────────────────────────── */
function CountdownTimer({ targetTime }) {
  const calc = () => {
    const diff = new Date(targetTime) - new Date();
    if (diff <= 0) return null;
    const totalH = Math.floor(diff / 3600000);
    const d = Math.floor(totalH / 24);
    const h = totalH % 24;
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { d, h, m, s };
  };
  const [time, setTime] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, [targetTime]);

  if (!time)
    return (
      <div className="text-sm font-bold text-purple-400 uppercase tracking-widest">
        Maç Başlıyor...
      </div>
    );
  const pad = (n) => String(n).padStart(2, "0");
  return (
    <div className="flex items-center gap-3">
      {time.d > 0 && (
        <div className="flex flex-col items-center">
          <span className="countdown-num">{time.d}</span>
          <span className="countdown-label">GÜN</span>
        </div>
      )}
      <div className="flex flex-col items-center">
        <span className="countdown-num">{pad(time.h)}</span>
        <span className="countdown-label">SAAT</span>
      </div>
      <div className="countdown-sep">:</div>
      <div className="flex flex-col items-center">
        <span className="countdown-num">{pad(time.m)}</span>
        <span className="countdown-label">DAK</span>
      </div>
      <div className="countdown-sep">:</div>
      <div className="flex flex-col items-center">
        <span className="countdown-num">{pad(time.s)}</span>
        <span className="countdown-label">SN</span>
      </div>
    </div>
  );
}

/* ── VS Screen ───────────────────────────────────────────── */
function VSScreen({ match }) {
  return (
    <div className="vs-screen relative flex h-full w-full flex-col items-center justify-center gap-6 overflow-hidden rounded-2xl bg-[#0d0d14] border border-gray-800">
      <div className="vs-glow-a" />
      <div className="vs-glow-b" />
      <div className="relative z-10 flex items-center gap-6 md:gap-12">
        <div className="flex flex-col items-center gap-3 team-a-enter">
          <div className="flex h-20 w-20 md:h-28 md:w-28 items-center justify-center rounded-2xl bg-[#1a1a2e] border border-purple-900/40 p-2 shadow-2xl shadow-purple-900/20">
            {match.team_a_logo ? (
              <img
                src={match.team_a_logo}
                alt={match.team_a_name}
                className="h-16 w-16 object-contain"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            ) : (
              <ShieldPlaceholder name={match.team_a_name} size={64} />
            )}
          </div>
          <span
            className="text-sm md:text-base font-bold text-white text-center max-w-[100px]"
            translate="no"
          >
            {match.team_a_name}
          </span>
        </div>
        <div className="flex flex-col items-center gap-2 vs-pulse-anim">
          <div className="flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-700 to-blue-700 shadow-xl shadow-purple-500/30">
            <span className="text-lg md:text-xl font-black text-white">VS</span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-3 team-b-enter">
          <div className="flex h-20 w-20 md:h-28 md:w-28 items-center justify-center rounded-2xl bg-[#1a2030] border border-blue-900/40 p-2 shadow-2xl shadow-blue-900/20">
            {match.team_b_logo ? (
              <img
                src={match.team_b_logo}
                alt={match.team_b_name}
                className="h-16 w-16 object-contain"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            ) : (
              <ShieldPlaceholder name={match.team_b_name} size={64} />
            )}
          </div>
          <span
            className="text-sm md:text-base font-bold text-white text-center max-w-[100px]"
            translate="no"
          >
            {match.team_b_name}
          </span>
        </div>
      </div>
      <div className="relative z-10 flex flex-col items-center gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">
          Maç Başlamasına
        </p>
        <CountdownTimer targetTime={match.start_time} />
        <p className="text-[11px] text-gray-600">
          {new Date(match.start_time).toLocaleString("tr-TR", {
            day: "2-digit",
            month: "long",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
      <div className="relative z-10 rounded-full border border-gray-800 bg-[#1a1a1a] px-4 py-1.5">
        <span
          className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest"
          translate="no"
        >
          {match.tournament}
        </span>
      </div>
    </div>
  );
}

/* ── Stream URL builder ──────────────────────────────────── */
const PARENT_DOMAIN = "vibeskor-e-spor-ma-takip-p-47.created.app";

function buildStreamUrl(rawUrl) {
  if (!rawUrl) return null;
  try {
    if (rawUrl.includes("youtube.com/watch")) {
      const vid = new URL(rawUrl).searchParams.get("v");
      return vid ? `https://www.youtube.com/embed/${vid}?autoplay=1` : null;
    }
    if (rawUrl.includes("youtu.be/")) {
      const vid = rawUrl.split("youtu.be/")[1].split("?")[0];
      return `https://www.youtube.com/embed/${vid}?autoplay=1`;
    }
    if (rawUrl.includes("twitch.tv")) {
      let channel = "";
      if (rawUrl.includes("player.twitch.tv")) {
        channel = new URL(rawUrl).searchParams.get("channel") || "";
      } else {
        channel = rawUrl
          .replace(/^https?:\/\/(www\.)?twitch\.tv\//, "")
          .split(/[/?#]/)[0];
      }
      if (!channel) return null;
      const params = new URLSearchParams();
      params.set("channel", channel);
      params.set("parent", PARENT_DOMAIN);
      params.set("autoplay", "false");
      params.set("muted", "false");
      return `https://player.twitch.tv/?${params.toString()}`;
    }
    return rawUrl;
  } catch {
    return rawUrl;
  }
}

/* ════════════════════════════════════════════════════════════
   PLAYERS TAB
═══════════════════════════════════════════════════════════ */
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
  UK: "🇬🇧",
  GB: "🇬🇧",
};

function PlayerCard({ player, accentColor = "purple" }) {
  const flagEmoji = FLAG_EMOJI[player.nationality?.toUpperCase()] || "";
  const colors = {
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  };
  return (
    <div className="flex items-center gap-3 rounded-xl bg-[#262626] border border-gray-800 p-3 hover:border-gray-700 transition-all">
      {/* Avatar */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1A1A1A] border border-gray-800 overflow-hidden">
        {player.image_url ? (
          <img
            src={player.image_url}
            alt={player.name}
            className="h-full w-full object-cover"
            onError={(e) => {
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "flex";
            }}
          />
        ) : null}
        <div
          className={`${player.image_url ? "hidden" : "flex"} h-full w-full items-center justify-center`}
        >
          <User size={18} className="text-gray-600" />
        </div>
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
          {flagEmoji && <span className="text-xs">{flagEmoji}</span>}
        </div>
        {(player.first_name || player.last_name) && (
          <p className="text-[10px] text-gray-500 truncate" translate="no">
            {[player.first_name, player.last_name].filter(Boolean).join(" ")}
          </p>
        )}
      </div>
      {/* Role badge */}
      {player.role && (
        <span
          className={`shrink-0 rounded-lg border px-2 py-0.5 text-[10px] font-bold ${colors[accentColor]}`}
        >
          {player.role}
        </span>
      )}
    </div>
  );
}

function PlayersTab({ matchId }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["players", matchId],
    queryFn: async () => {
      const res = await fetch(`/api/players?matchId=${matchId}`);
      if (!res.ok) throw new Error("Oyuncular yüklenemedi");
      return res.json();
    },
    staleTime: 60000,
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Array(10)
          .fill(0)
          .map((_, i) => (
            <div
              key={i}
              className="h-16 rounded-xl bg-[#1E1E1E] loading-shimmer"
            />
          ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500">
        <Users size={36} className="mb-3 opacity-20" />
        <p className="text-sm">Oyuncu verisi yüklenemedi.</p>
      </div>
    );
  }

  const { team_a, team_b } = data;
  const hasPlayers =
    (team_a?.players?.length || 0) + (team_b?.players?.length || 0) > 0;

  if (!hasPlayers) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500">
        <Users size={36} className="mb-3 opacity-20" />
        <p className="text-sm">Oyuncu kadrosu henüz mevcut değil.</p>
        <p className="mt-1 text-xs text-gray-600">
          Bu oyun veya turnuva için PandaScore'da kadro verisi yok.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      {/* Team A */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          {team_a?.logo && (
            <img
              src={team_a.logo}
              alt={team_a.name}
              className="h-6 w-6 object-contain rounded"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          )}
          <h3 className="text-sm font-bold text-white" translate="no">
            {team_a?.name}
          </h3>
          <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-400">
            {team_a?.players?.length || 0} oyuncu
          </span>
        </div>
        <div className="space-y-2">
          {(team_a?.players || []).length > 0 ? (
            team_a.players.map((p) => (
              <PlayerCard key={p.id} player={p} accentColor="purple" />
            ))
          ) : (
            <p className="text-xs text-gray-600 italic py-2">
              Kadro verisi yok.
            </p>
          )}
        </div>
      </div>

      {/* Team B */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          {team_b?.logo && (
            <img
              src={team_b.logo}
              alt={team_b.name}
              className="h-6 w-6 object-contain rounded"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          )}
          <h3 className="text-sm font-bold text-white" translate="no">
            {team_b?.name}
          </h3>
          <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-400">
            {team_b?.players?.length || 0} oyuncu
          </span>
        </div>
        <div className="space-y-2">
          {(team_b?.players || []).length > 0 ? (
            team_b.players.map((p) => (
              <PlayerCard key={p.id} player={p} accentColor="blue" />
            ))
          ) : (
            <p className="text-xs text-gray-600 italic py-2">
              Kadro verisi yok.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   BRACKET TAB
═══════════════════════════════════════════════════════════ */
function BracketMatchCard({ bm }) {
  const statusBorder =
    bm.status === "live"
      ? "border-red-500/40 bg-red-900/10"
      : bm.status === "finished"
        ? "border-gray-700 bg-[#1A1A1A]"
        : "border-gray-800 bg-[#1E1E1E]";

  const isFinished = bm.status === "finished";

  return (
    <div
      className={`w-44 rounded-xl border ${statusBorder} overflow-hidden shadow-lg`}
    >
      {/* Team A row */}
      <div
        className={`flex items-center justify-between px-3 py-2 border-b border-gray-800 ${bm.winner === bm.team_a ? "bg-green-900/20" : ""}`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          {bm.team_a_logo && (
            <img
              src={bm.team_a_logo}
              alt={bm.team_a}
              className="h-4 w-4 object-contain rounded shrink-0"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          )}
          <span
            className={`text-[11px] font-semibold truncate ${bm.winner === bm.team_a ? "text-green-400" : "text-gray-200"}`}
            translate="no"
          >
            {bm.team_a || "TBD"}
          </span>
        </div>
        {isFinished && (
          <span
            className={`text-[11px] font-black ml-1 ${bm.winner === bm.team_a ? "text-green-400" : "text-gray-500"}`}
          >
            {bm.score_a}
          </span>
        )}
      </div>
      {/* Team B row */}
      <div
        className={`flex items-center justify-between px-3 py-2 ${bm.winner === bm.team_b ? "bg-green-900/20" : ""}`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          {bm.team_b_logo && (
            <img
              src={bm.team_b_logo}
              alt={bm.team_b}
              className="h-4 w-4 object-contain rounded shrink-0"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          )}
          <span
            className={`text-[11px] font-semibold truncate ${bm.winner === bm.team_b ? "text-green-400" : "text-gray-200"}`}
            translate="no"
          >
            {bm.team_b || "TBD"}
          </span>
        </div>
        {isFinished && (
          <span
            className={`text-[11px] font-black ml-1 ${bm.winner === bm.team_b ? "text-green-400" : "text-gray-500"}`}
          >
            {bm.score_b}
          </span>
        )}
      </div>
      {/* Status chip */}
      {bm.status === "live" && (
        <div className="bg-red-900/20 px-3 py-0.5 text-center">
          <span className="text-[9px] font-black text-red-400">● CANLI</span>
        </div>
      )}
    </div>
  );
}

function BracketTab({ matchId }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["bracket", matchId],
    queryFn: async () => {
      const res = await fetch(`/api/bracket?matchId=${matchId}`);
      if (!res.ok) throw new Error("Bracket yüklenemedi");
      return res.json();
    },
    staleTime: 120000,
  });

  if (isLoading) {
    return (
      <div className="flex gap-6 overflow-x-auto pb-4">
        {Array(3)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="flex flex-col gap-4 shrink-0">
              <div className="h-5 w-28 rounded bg-[#262626] loading-shimmer mb-2" />
              {Array(4 - i)
                .fill(0)
                .map((__, j) => (
                  <div
                    key={j}
                    className="h-20 w-44 rounded-xl bg-[#1E1E1E] loading-shimmer"
                  />
                ))}
            </div>
          ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500">
        <GitBranch size={36} className="mb-3 opacity-20" />
        <p className="text-sm">Turnuva ağacı yüklenemedi.</p>
      </div>
    );
  }

  const { rounds = [], tournament } = data;

  if (rounds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500">
        <GitBranch size={36} className="mb-3 opacity-20" />
        <p className="text-sm">
          Bu turnuva için bracket verisi henüz mevcut değil.
        </p>
        <p className="mt-1 text-xs text-gray-600">
          Turnuva ilerledikçe eşleşmeler burada görünecek.
        </p>
      </div>
    );
  }

  return (
    <div>
      {tournament && (
        <p
          className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-500"
          translate="no"
        >
          {tournament} — Turnuva Ağacı
        </p>
      )}
      {/* Horizontal scrollable bracket */}
      <div className="overflow-x-auto pb-6">
        <div className="flex gap-8 min-w-max">
          {rounds.map((round, roundIdx) => (
            <div key={round.round} className="flex flex-col">
              {/* Round label */}
              <div className="mb-4 text-center">
                <span
                  className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                    roundIdx === rounds.length - 1
                      ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/20"
                      : "bg-[#262626] text-gray-400 border border-gray-800"
                  }`}
                >
                  {round.label}
                </span>
              </div>
              {/* Matches — vertically centred in their slot */}
              <div
                className="flex flex-1 flex-col"
                style={{
                  gap: `${Math.max(24, 64 / (round.matches.length || 1))}px`,
                }}
              >
                {round.matches.map((bm) => (
                  <BracketMatchCard key={bm.slot_id} bm={bm} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════ */
export default function MatchDetailPage({ params }) {
  const { id: matchId } = params;
  const { data: user } = useUser();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [activeLeftTab, setActiveLeftTab] = useState("yayin");
  const chatEndRef = useRef(null);

  const { data: match, isLoading: matchLoading } = useQuery({
    queryKey: ["match", matchId],
    queryFn: async () => {
      const res = await fetch(`/api/matches/${matchId}`);
      if (!res.ok) return null;
      return res.json();
    },
    refetchInterval: (data) => (data?.status === "live" ? 30000 : false),
  });

  const { data: myPrediction } = useQuery({
    queryKey: ["my-prediction", matchId],
    queryFn: async () => {
      const res = await fetch(`/api/predictions?matchId=${matchId}`);
      if (!res.ok) return null;
      const rows = await res.json();
      return rows?.[0] || null;
    },
    enabled: !!user,
  });

  const { data: chatMessages = [] } = useQuery({
    queryKey: ["chat", matchId],
    queryFn: async () => {
      const res = await fetch(`/api/chat?matchId=${matchId}`);
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 3000,
    enabled: match?.status === "live" || match?.status === "finished",
  });

  const chatMutation = useMutation({
    mutationFn: async (text) => {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, message: text }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat", matchId] });
      setMessage("");
    },
  });

  const predictionMutation = useMutation({
    mutationFn: async (predictedTeam) => {
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, predictedTeam }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Tahmin yapılamadı");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-prediction", matchId] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
    onError: (err) => alert(err.message),
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || chatMutation.isLoading) return;
    chatMutation.mutate(message);
  };

  /* ── Loading ── */
  if (matchLoading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <Trophy size={32} className="spin-icon text-purple-500" />
        <style
          jsx
          global
        >{`@keyframes spin{to{transform:rotate(360deg)}}.spin-icon{animation:spin 1s linear infinite}`}</style>
      </div>
    );
  }

  /* ── Not found ── */
  if (!match || match.error) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center gap-4 text-white">
        <Swords size={48} className="text-gray-700 opacity-30" />
        <p className="text-gray-400">Maç bulunamadı.</p>
        <a
          href="/"
          className="rounded-xl bg-purple-600 px-6 py-2 text-sm font-medium hover:bg-purple-700 transition-all"
        >
          Ana Sayfaya Dön
        </a>
      </div>
    );
  }

  const isUpcoming = match.status === "upcoming";
  const isLive = match.status === "live";
  const isFinished = match.status === "finished";
  const streamUrl = buildStreamUrl(match.stream_url);
  const gameName = GAME_NAMES[match.game] || match.game;

  const predTeamName =
    myPrediction?.predicted_team === "team_a"
      ? match.team_a_name
      : myPrediction?.predicted_team === "team_b"
        ? match.team_b_name
        : null;

  /* Tab definitions */
  const LEFT_TABS = [
    { id: "yayin", label: "Yayın & Tahmin", icon: <Tv size={14} /> },
    { id: "oyuncu", label: "Oyuncular", icon: <Users size={14} /> },
    { id: "bracket", label: "Turnuva Ağacı", icon: <GitBranch size={14} /> },
  ];

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <main className="mx-auto max-w-7xl p-4 md:p-8">
        {/* ── Back + match header ── */}
        <div className="mb-6 flex items-center gap-3">
          <a
            href="/"
            className="rounded-lg bg-gray-800 p-2 text-gray-400 hover:text-white transition-colors shrink-0"
          >
            <ChevronLeft size={20} />
          </a>
          <div className="flex-1 min-w-0">
            <h1
              className="text-base font-bold text-white truncate"
              translate="no"
            >
              {match.team_a_id ? (
                <a
                  href={`/team/${match.team_a_id}`}
                  className="hover:text-purple-300 transition-colors"
                >
                  {match.team_a_name}
                </a>
              ) : (
                match.team_a_name
              )}
              {" vs "}
              {match.team_b_id ? (
                <a
                  href={`/team/${match.team_b_id}`}
                  className="hover:text-purple-300 transition-colors"
                >
                  {match.team_b_name}
                </a>
              ) : (
                match.team_b_name
              )}
            </h1>
            <p
              className="text-[10px] font-medium text-gray-500 uppercase tracking-widest truncate"
              translate="no"
            >
              {match.pandascore_tournament_id ? (
                <a
                  href={`/tournament/${match.pandascore_tournament_id}`}
                  className="hover:text-purple-400 transition-colors"
                >
                  {match.tournament}
                </a>
              ) : (
                match.tournament
              )}
              {" · "}
              {gameName}
            </p>
          </div>
          {isLive && (
            <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-[10px] font-bold text-red-500 ring-1 ring-red-500/20">
              <span className="live-blink h-1.5 w-1.5 rounded-full bg-red-500" />
              CANLI
            </div>
          )}
          {isFinished && (
            <span className="shrink-0 rounded-full bg-gray-800 px-3 py-1 text-[10px] font-bold text-gray-500">
              BİTTİ
            </span>
          )}
          {isUpcoming && (
            <span className="shrink-0 rounded-full bg-purple-900/30 px-3 py-1 text-[10px] font-bold text-purple-400 border border-purple-900/40">
              YAKINDA
            </span>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* ── Left column ── */}
          <div className="lg:col-span-8">
            {/* ── Tab navigation ── */}
            <div className="mb-6 flex items-center gap-1 rounded-2xl bg-[#1A1A1A] p-1 border border-gray-800">
              {LEFT_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveLeftTab(tab.id)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
                    activeLeftTab === tab.id
                      ? "bg-[#262626] text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* ── Tab: Yayın & Tahmin ── */}
            {activeLeftTab === "yayin" && (
              <div>
                {/* Score banners */}
                {isLive && (
                  <div className="mb-4 flex items-center justify-between rounded-2xl bg-gradient-to-r from-red-900/30 to-orange-900/20 border border-red-500/20 p-4">
                    {match.team_a_id ? (
                      <a
                        href={`/team/${match.team_a_id}`}
                        className="text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
                        translate="no"
                      >
                        {match.team_a_name}
                      </a>
                    ) : (
                      <span
                        className="text-sm font-medium text-red-400"
                        translate="no"
                      >
                        {match.team_a_name}
                      </span>
                    )}
                    <div className="text-center">
                      <div className="text-3xl font-black tabular-nums text-white">
                        {match.score_a} <span className="text-gray-600">–</span>{" "}
                        {match.score_b}
                      </div>
                      <p className="text-[10px] text-red-400 font-bold mt-0.5">
                        CANLI SKOR
                      </p>
                    </div>
                    {match.team_b_id ? (
                      <a
                        href={`/team/${match.team_b_id}`}
                        className="text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
                        translate="no"
                      >
                        {match.team_b_name}
                      </a>
                    ) : (
                      <span
                        className="text-sm font-medium text-red-400"
                        translate="no"
                      >
                        {match.team_b_name}
                      </span>
                    )}
                  </div>
                )}
                {isFinished && (
                  <div className="mb-4 flex items-center justify-between rounded-2xl bg-[#1a1a1a] border border-gray-800 p-4">
                    {match.team_a_id ? (
                      <a
                        href={`/team/${match.team_a_id}`}
                        className={`text-sm font-bold hover:opacity-80 transition-opacity ${match.winner_team === "team_a" ? "text-green-400" : "text-gray-500"}`}
                        translate="no"
                      >
                        {match.team_a_name}
                      </a>
                    ) : (
                      <span
                        className={`text-sm font-bold ${match.winner_team === "team_a" ? "text-green-400" : "text-gray-500"}`}
                        translate="no"
                      >
                        {match.team_a_name}
                      </span>
                    )}
                    <div className="text-center">
                      <div className="text-3xl font-black tabular-nums text-white">
                        {match.score_a} <span className="text-gray-600">–</span>{" "}
                        {match.score_b}
                      </div>
                      <p className="text-[10px] text-gray-500 font-bold mt-0.5">
                        FİNAL SKOR
                      </p>
                    </div>
                    {match.team_b_id ? (
                      <a
                        href={`/team/${match.team_b_id}`}
                        className={`text-sm font-bold hover:opacity-80 transition-opacity ${match.winner_team === "team_b" ? "text-green-400" : "text-gray-500"}`}
                        translate="no"
                      >
                        {match.team_b_name}
                      </a>
                    ) : (
                      <span
                        className={`text-sm font-bold ${match.winner_team === "team_b" ? "text-green-400" : "text-gray-500"}`}
                        translate="no"
                      >
                        {match.team_b_name}
                      </span>
                    )}
                  </div>
                )}

                {/* Stream / VS screen */}
                <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-gray-800 shadow-2xl">
                  {isUpcoming ? (
                    <VSScreen match={match} />
                  ) : isLive && streamUrl ? (
                    <iframe
                      src={streamUrl}
                      className="h-full w-full bg-black"
                      frameBorder="0"
                      allowFullScreen
                      scrolling="no"
                    />
                  ) : isLive && !streamUrl ? (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-[#1A1A1A]">
                      <div className="text-4xl">📡</div>
                      <p className="text-sm font-bold text-white">
                        Maç Devam Ediyor
                      </p>
                      <p className="text-xs text-gray-500">
                        Canlı yayın linki henüz eklenmedi.
                      </p>
                      <div className="flex gap-3">
                        <a
                          href="https://www.twitch.tv"
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl bg-purple-700 px-4 py-2 text-xs font-bold text-white hover:bg-purple-600 transition-all"
                        >
                          Twitch
                        </a>
                        <a
                          href="https://www.youtube.com"
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl bg-red-700 px-4 py-2 text-xs font-bold text-white hover:bg-red-600 transition-all"
                        >
                          YouTube
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[#1A1A1A]">
                      <Trophy
                        size={40}
                        className="text-yellow-500 opacity-60"
                      />
                      <p className="text-sm font-bold text-gray-400">
                        Maç Sona Erdi
                      </p>
                      {match.winner_team && (
                        <p className="text-xs text-gray-600" translate="no">
                          Kazanan:{" "}
                          {match.winner_team === "team_a"
                            ? match.team_a_name
                            : match.team_b_name}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Prediction */}
                <div className="mt-8 rounded-2xl bg-[#1E1E1E] p-6 border border-gray-800">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-white">
                        Gamer Tahmin
                      </h2>
                      <p className="text-xs text-gray-400">
                        Kazananı tahmin et, 50 puan kazan!
                      </p>
                    </div>
                    <div className="rounded-full bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-400 border border-purple-500/20">
                      ÖDÜL: 50 PUAN
                    </div>
                  </div>

                  {myPrediction ? (
                    <div
                      className={`flex items-center gap-3 rounded-xl p-4 border ${
                        myPrediction.status === "won"
                          ? "bg-green-900/20 border-green-500/30 text-green-400"
                          : myPrediction.status === "lost"
                            ? "bg-red-900/20 border-red-500/30 text-red-400"
                            : "bg-blue-900/20 border-blue-500/30 text-blue-400"
                      }`}
                    >
                      {myPrediction.status === "won" ? (
                        <CheckCircle size={20} />
                      ) : myPrediction.status === "lost" ? (
                        <Trophy size={20} />
                      ) : (
                        <Clock size={20} />
                      )}
                      <div>
                        <p className="text-sm font-bold">
                          {myPrediction.status === "won"
                            ? `✅ Doğru! +${myPrediction.points_awarded} puan kazandın.`
                            : myPrediction.status === "lost"
                              ? "❌ Maalesef yanlış tahmin yaptın."
                              : `⏳ Tahminiz alındı: ${predTeamName} kazanır`}
                        </p>
                        <p className="text-xs opacity-70">
                          {myPrediction.status === "pending"
                            ? "Maç bitiminde puan hesaplanacak."
                            : `Tahmin: ${predTeamName}`}
                        </p>
                      </div>
                    </div>
                  ) : isFinished ? (
                    <p className="text-center text-sm text-gray-500 py-4">
                      Bu maç sona erdi.
                    </p>
                  ) : !user ? (
                    <a
                      href="/account/signin"
                      className="block w-full rounded-xl bg-gray-800 py-3 text-center text-sm font-medium text-gray-400 hover:text-white transition-all"
                    >
                      Tahmin yapmak için giriş yap
                    </a>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => predictionMutation.mutate("team_a")}
                        disabled={predictionMutation.isLoading}
                        className="flex flex-col items-center gap-3 rounded-xl bg-[#262626] p-4 border border-gray-800 transition-all hover:border-purple-500 hover:bg-[#2A2A2A] disabled:opacity-50"
                      >
                        <TeamLogo
                          src={match.team_a_logo}
                          name={match.team_a_name}
                          size="h-12 w-12"
                        />
                        <span
                          className="text-sm font-bold text-white"
                          translate="no"
                        >
                          {match.team_a_name}
                        </span>
                        <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">
                          KAZANIR
                        </span>
                      </button>
                      <button
                        onClick={() => predictionMutation.mutate("team_b")}
                        disabled={predictionMutation.isLoading}
                        className="flex flex-col items-center gap-3 rounded-xl bg-[#262626] p-4 border border-gray-800 transition-all hover:border-blue-500 hover:bg-[#2A2A2A] disabled:opacity-50"
                      >
                        <TeamLogo
                          src={match.team_b_logo}
                          name={match.team_b_name}
                          size="h-12 w-12"
                        />
                        <span
                          className="text-sm font-bold text-white"
                          translate="no"
                        >
                          {match.team_b_name}
                        </span>
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                          KAZANIR
                        </span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Match info */}
                <div className="mt-6 rounded-2xl bg-[#1E1E1E] p-6 border border-gray-800">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-white">
                    <Info size={16} className="text-blue-500" />
                    Maç Bilgileri
                  </h3>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-bold">
                        Oyun
                      </p>
                      <p
                        className="text-sm font-medium text-gray-300"
                        translate="no"
                      >
                        {gameName}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-bold">
                        Format
                      </p>
                      <p className="text-sm font-medium text-gray-300">
                        Best of 3
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-bold">
                        Turnuva
                      </p>
                      {match.pandascore_tournament_id ? (
                        <a
                          href={`/tournament/${match.pandascore_tournament_id}`}
                          className="text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors"
                          translate="no"
                        >
                          {match.tournament}
                        </a>
                      ) : (
                        <p
                          className="text-sm font-medium text-gray-300"
                          translate="no"
                        >
                          {match.tournament}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-bold">
                        Saat
                      </p>
                      <p className="text-sm font-medium text-gray-300">
                        {new Date(match.start_time).toLocaleTimeString(
                          "tr-TR",
                          { hour: "2-digit", minute: "2-digit" },
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Tab: Oyuncular ── */}
            {activeLeftTab === "oyuncu" && (
              <div className="rounded-2xl bg-[#1E1E1E] p-6 border border-gray-800">
                <h2 className="mb-6 flex items-center gap-2 text-base font-bold text-white">
                  <Users size={18} className="text-purple-500" />
                  Oyuncu Kadroları
                </h2>
                <PlayersTab matchId={matchId} />
              </div>
            )}

            {/* ── Tab: Turnuva Ağacı ── */}
            {activeLeftTab === "bracket" && (
              <div className="rounded-2xl bg-[#1E1E1E] p-6 border border-gray-800">
                <h2 className="mb-6 flex items-center gap-2 text-base font-bold text-white">
                  <GitBranch size={18} className="text-blue-500" />
                  Turnuva Ağacı
                </h2>
                <BracketTab matchId={matchId} />
              </div>
            )}
          </div>

          {/* ── Right column: Chat ── */}
          <div className="lg:col-span-4">
            <div className="sticky top-4">
              <div className="flex flex-col rounded-2xl bg-[#1E1E1E] border border-gray-800 overflow-hidden">
                <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={18} className="text-purple-500" />
                    <span className="text-sm font-bold">Canlı Chat</span>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 text-[10px] font-bold ${isLive ? "text-green-500" : "text-gray-600"}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${isLive ? "bg-green-500" : "bg-gray-700"}`}
                    />
                    {isLive ? "ONLINE" : "KAPALI"}
                  </div>
                </div>

                {isUpcoming && (
                  <div className="m-3 flex items-center gap-2 rounded-xl border border-purple-900/40 bg-purple-900/20 px-4 py-3">
                    <Clock size={16} className="shrink-0 text-purple-400" />
                    <p className="text-xs text-purple-300">
                      Maç başladığında canlı sohbet açılacaktır.
                    </p>
                  </div>
                )}

                <div className="h-[400px] overflow-y-auto p-4 space-y-4">
                  {isUpcoming ? (
                    <div className="flex h-full flex-col items-center justify-center text-gray-600 gap-2">
                      <MessageSquare size={32} className="opacity-10" />
                      <p className="text-xs text-center">
                        Sohbet maç başladığında
                        <br />
                        aktifleşecek.
                      </p>
                    </div>
                  ) : chatMessages.length > 0 ? (
                    chatMessages.map((msg) => (
                      <div key={msg.id} className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-purple-400">
                            {msg.username}
                          </span>
                          <span className="text-[10px] text-gray-600">
                            {new Date(msg.created_at).toLocaleTimeString(
                              "tr-TR",
                              { hour: "2-digit", minute: "2-digit" },
                            )}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 break-words">
                          {msg.message}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center text-gray-600">
                      <MessageSquare size={32} className="mb-2 opacity-10" />
                      <p className="text-xs">Henüz mesaj yok.</p>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="p-4 border-t border-gray-800">
                  {isUpcoming ? (
                    <div className="flex items-center justify-center rounded-xl bg-[#262626] py-2.5 text-xs text-gray-600">
                      Maç başladığında mesaj gönderebilirsin
                    </div>
                  ) : user ? (
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Mesaj gönder..."
                        className="flex-1 rounded-xl bg-[#262626] px-4 py-2 text-sm text-white border border-gray-800 focus:border-purple-500 outline-none"
                      />
                      <button
                        type="submit"
                        disabled={!message.trim() || chatMutation.isLoading}
                        className="rounded-xl bg-purple-600 p-2 text-white hover:bg-purple-700 disabled:opacity-50 transition-all"
                      >
                        <Send size={18} />
                      </button>
                    </form>
                  ) : (
                    <a
                      href="/account/signin"
                      className="block w-full rounded-xl bg-gray-800 py-2 text-center text-xs font-medium text-gray-400 hover:text-white transition-all"
                    >
                      Mesaj yazmak için giriş yap
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar{display:none}
        .scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}
        @keyframes spin{to{transform:rotate(360deg)}}
        .spin-icon{animation:spin 1s linear infinite}
        @keyframes liveBlink{0%,100%{opacity:1}50%{opacity:0.3}}
        .live-blink{animation:liveBlink 1.5s ease-in-out infinite}

        /* VS Screen animations */
        @keyframes glowA{0%,100%{opacity:0.35;transform:scale(1)}50%{opacity:0.6;transform:scale(1.15)}}
        @keyframes glowB{0%,100%{opacity:0.3;transform:scale(1)}50%{opacity:0.5;transform:scale(1.1)}}
        .vs-glow-a{position:absolute;left:15%;top:50%;transform:translateY(-50%);width:220px;height:220px;border-radius:50%;background:radial-gradient(circle,rgba(139,92,246,0.25),transparent 70%);animation:glowA 3s ease-in-out infinite;pointer-events:none}
        .vs-glow-b{position:absolute;right:15%;top:50%;transform:translateY(-50%);width:220px;height:220px;border-radius:50%;background:radial-gradient(circle,rgba(59,130,246,0.2),transparent 70%);animation:glowB 3s ease-in-out infinite 1.5s;pointer-events:none}
        @keyframes slideInLeft{from{opacity:0;transform:translateX(-40px)}to{opacity:1;transform:translateX(0)}}
        @keyframes slideInRight{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}
        @keyframes pulseBig{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}
        .team-a-enter{animation:slideInLeft 0.5s ease-out both}
        .team-b-enter{animation:slideInRight 0.5s ease-out 0.1s both}
        .vs-pulse-anim{animation:pulseBig 2s ease-in-out infinite}

        /* Countdown */
        .countdown-num{font-size:2rem;font-weight:900;color:#fff;font-variant-numeric:tabular-nums;line-height:1}
        .countdown-label{font-size:0.6rem;font-weight:700;color:#6b7280;letter-spacing:0.15em;text-transform:uppercase}
        .countdown-sep{font-size:1.8rem;font-weight:900;color:#4b5563;align-self:flex-start;margin-top:2px}

        /* shimmer */
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        .loading-shimmer{background:linear-gradient(90deg,#1E1E1E 25%,#2a2a2a 50%,#1E1E1E 75%);background-size:200% 100%;animation:shimmer 1.5s infinite}
      `}</style>
    </div>
  );
}
