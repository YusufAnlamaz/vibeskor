"use client";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Gamepad2, ArrowLeft, Trophy } from "lucide-react";

const STATUS_STYLE = {
  live: "text-red-400 bg-red-500/10 border border-red-500/20",
  upcoming: "text-blue-400 bg-blue-500/10 border border-blue-500/20",
  finished: "text-gray-500 bg-gray-800 border border-gray-700",
};
const STATUS_LABEL = { live: "CANLI", upcoming: "YAKINDA", finished: "BİTTİ" };
const GAME_SHORT = {
  valorant: "Valorant",
  cs2: "CS2",
  lol: "LoL",
  pubgm: "PUBG M",
};

/* Reads ?q= from the URL without importing Next.js router */
function useSearchQuery() {
  const [q, setQ] = useState("");
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQ((params.get("q") || "").trim());
  }, []);
  return q;
}

function ShieldPlaceholder({ name }) {
  const initial = name?.[0]?.toUpperCase() || "?";
  return (
    <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
      <path
        d="M18 2L32 8V20C32 27.5 25.5 33.5 18 35C10.5 33.5 4 27.5 4 20V8L18 2Z"
        fill="#2a2a2a"
        stroke="#3f3f46"
        strokeWidth="1.5"
      />
      <text
        x="18"
        y="24"
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

export default function SearchPage() {
  const initialQ = useSearchQuery();
  const [query, setQuery] = useState("");
  const [input, setInput] = useState("");

  /* Sync query from URL once on mount */
  useEffect(() => {
    if (initialQ) {
      setInput(initialQ);
      setQuery(initialQ);
    }
  }, [initialQ]);

  const { data: results = [], isLoading } = useQuery({
    queryKey: ["search", query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(query)}&limit=30`,
      );
      if (!res.ok) return [];
      return res.json();
    },
    enabled: query.length >= 2,
    staleTime: 15000,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = input.trim();
    if (!q) return;
    setQuery(q);
    // Update URL without full reload
    const url = new URL(window.location.href);
    url.searchParams.set("q", q);
    window.history.replaceState({}, "", url.toString());
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <main className="mx-auto max-w-4xl px-4 py-8 md:px-8">
        {/* Back + title */}
        <div className="mb-6 flex items-center gap-3">
          <a
            href="/"
            className="rounded-lg bg-gray-800 p-2 text-gray-400 hover:text-white transition-colors shrink-0"
          >
            <ArrowLeft size={18} />
          </a>
          <h1 className="text-xl font-bold text-white">Arama Sonuçları</h1>
        </div>

        {/* Search form */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex items-center gap-3 rounded-2xl border border-gray-800 bg-[#1E1E1E] px-4 py-3 focus-within:border-purple-500 transition-colors">
            <Search size={18} className="shrink-0 text-gray-500" />
            <input
              type="text"
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Maç, takım veya turnuva ara…"
              className="flex-1 bg-transparent text-base text-white outline-none placeholder:text-gray-600"
            />
            <button
              type="submit"
              className="shrink-0 rounded-xl bg-purple-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-purple-700 transition-all disabled:opacity-50"
              disabled={!input.trim()}
            >
              Ara
            </button>
          </div>
        </form>

        {/* Results header */}
        {query.length >= 2 && (
          <p className="mb-4 text-sm text-gray-500">
            {isLoading ? (
              "Aranıyor…"
            ) : (
              <>
                <span className="text-white font-semibold">"{query}"</span> için{" "}
                <span className="text-purple-400 font-semibold">
                  {results.length}
                </span>{" "}
                sonuç bulundu
              </>
            )}
          </p>
        )}

        {/* Loading shimmer */}
        {isLoading && (
          <div className="space-y-3">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className="h-20 rounded-2xl bg-[#1E1E1E] loading-shimmer"
                />
              ))}
          </div>
        )}

        {/* Results list */}
        {!isLoading && results.length > 0 && (
          <div className="space-y-3">
            {results.map((match) => {
              const isLive = match.status === "live";
              const statusStyle =
                STATUS_STYLE[match.status] || STATUS_STYLE.upcoming;
              const statusLabel = STATUS_LABEL[match.status] || match.status;

              return (
                <a
                  key={match.id}
                  href={`/match/${match.id}`}
                  className="group flex items-center gap-4 rounded-2xl bg-[#1E1E1E] border border-gray-800 px-4 py-4 transition-all hover:border-purple-500/50 hover:bg-[#262626]"
                >
                  {/* Game icon */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#262626] border border-gray-800">
                    <Gamepad2 size={16} className="text-gray-500" />
                  </div>

                  {/* Teams */}
                  <div className="flex flex-1 items-center gap-3 min-w-0">
                    {/* Team A */}
                    <div className="flex items-center gap-2 min-w-0">
                      {match.team_a_logo ? (
                        <img
                          src={match.team_a_logo}
                          alt={match.team_a_name}
                          className="h-7 w-7 object-contain rounded shrink-0"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      ) : (
                        <ShieldPlaceholder name={match.team_a_name} />
                      )}
                      <span
                        className="text-sm font-bold text-white truncate"
                        translate="no"
                      >
                        {match.team_a_name}
                      </span>
                    </div>

                    {/* Score / vs */}
                    <div className="shrink-0 px-2 text-center">
                      {match.status === "finished" ||
                      match.status === "live" ? (
                        <span
                          className={`text-base font-black tabular-nums ${isLive ? "text-white" : "text-gray-400"}`}
                        >
                          {match.score_a}–{match.score_b}
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-gray-600">
                          vs
                        </span>
                      )}
                    </div>

                    {/* Team B */}
                    <div className="flex items-center gap-2 min-w-0">
                      {match.team_b_logo ? (
                        <img
                          src={match.team_b_logo}
                          alt={match.team_b_name}
                          className="h-7 w-7 object-contain rounded shrink-0"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      ) : (
                        <ShieldPlaceholder name={match.team_b_name} />
                      )}
                      <span
                        className="text-sm font-bold text-white truncate"
                        translate="no"
                      >
                        {match.team_b_name}
                      </span>
                    </div>
                  </div>

                  {/* Right: tournament + status */}
                  <div className="hidden md:flex flex-col items-end gap-1 shrink-0 min-w-[130px]">
                    <span
                      className="text-[10px] text-gray-500 truncate max-w-[130px]"
                      translate="no"
                    >
                      {match.tournament}
                    </span>
                    <span
                      className="text-[10px] font-semibold text-gray-600"
                      translate="no"
                    >
                      {GAME_SHORT[match.game] || match.game}
                    </span>
                  </div>

                  {/* Status badge */}
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-black ${statusStyle}`}
                    >
                      {statusLabel}
                    </span>
                    {match.status === "upcoming" && (
                      <span className="text-[10px] text-gray-600">
                        {new Date(match.start_time).toLocaleTimeString(
                          "tr-TR",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </span>
                    )}
                  </div>
                </a>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && query.length >= 2 && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-gray-600">
            <Search size={48} className="mb-4 opacity-15" />
            <p className="text-lg font-semibold text-gray-400 mb-1">
              Sonuç bulunamadı
            </p>
            <p className="text-sm text-gray-600">
              "<span translate="no">{query}</span>" ile eşleşen maç veya takım
              yok.
            </p>
            <p className="mt-2 text-xs text-gray-700">
              Farklı bir takım adı veya turnuva ismi deneyin.
            </p>
            <a
              href="/"
              className="mt-6 flex items-center gap-2 rounded-xl bg-purple-600/10 px-5 py-2.5 text-sm font-semibold text-purple-400 border border-purple-500/20 hover:bg-purple-600/20 transition-all"
            >
              <Trophy size={14} />
              Tüm Maçlara Dön
            </a>
          </div>
        )}

        {/* Initial state (no query yet) */}
        {query.length < 2 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-600">
            <Search size={40} className="mb-4 opacity-15" />
            <p className="text-sm">
              Arama yapmak için yukarıya bir kelime yazın.
            </p>
          </div>
        )}
      </main>

      <style jsx global>{`
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .loading-shimmer {
          background: linear-gradient(90deg, #1E1E1E 25%, #2a2a2a 50%, #1E1E1E 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
      `}</style>
    </div>
  );
}
