// Dosya: src/app/routes/standings.tsx
import { useEffect, useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";

const GAMES = [
  {
    key: "lol",
    label: "League of Legends",
    color: "#C8AA6E",
    colorLight: "rgba(200,170,110,0.08)",
    borderColor: "#C8AA6E",
    leagues: [
      { id: "lec", name: "LEC" },
      { id: "lcs", name: "LCS" },
      { id: "lck", name: "LCK" },
      { id: "lpl", name: "LPL" },
      { id: "worlds-2026", name: "Worlds 2026" },
    ],
  },
  {
    key: "cs2",
    label: "CS2",
    color: "#F4941D",
    colorLight: "rgba(244,148,29,0.08)",
    borderColor: "#F4941D",
    leagues: [
      { id: "esl-pro-league", name: "ESL Pro League" },
      { id: "blast-premier", name: "BLAST Premier" },
      { id: "pgl-major", name: "PGL Major" },
      { id: "iem-cologne", name: "IEM Cologne" },
    ],
  },
  {
    key: "valorant",
    label: "Valorant",
    color: "#ff4655",
    colorLight: "rgba(255,70,85,0.08)",
    borderColor: "#ff4655",
    leagues: [
      { id: "vct-emea", name: "VCT EMEA" },
      { id: "vct-americas", name: "VCT Americas" },
      { id: "vct-pacific", name: "VCT Pacific" },
      { id: "vct-masters", name: "VCT Masters" },
      { id: "vct-champions", name: "VCT Champions" },
    ],
  },
  {
    key: "pubg",
    label: "PUBG Mobile",
    color: "#F5A623",
    colorLight: "rgba(245,166,35,0.08)",
    borderColor: "#F5A623",
    leagues: [
      { id: "pmgc", name: "PMGC" },
      { id: "pmpl-emea", name: "PMPL EMEA" },
      { id: "pmpl-sea", name: "PMPL SEA" },
      { id: "pmpl-sa", name: "PMPL SA" },
    ],
  },
];

function rankColor(rank) {
  if (rank === 1) return "#FFD700";
  if (rank === 2) return "#C0C0C0";
  if (rank === 3) return "#CD7F32";
  return "#4B5563";
}

function FormDots({ form }) {
  const safeForm = form ?? [];
  return (
    <div className="flex items-center gap-1" translate="no">
      {safeForm.map((result, i) => (
        <span
          key={i}
          title={result === "W" ? "Galibiyet" : "Mağlubiyet"}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 22,
            height: 22,
            borderRadius: "50%",
            fontSize: 10,
            fontWeight: 700,
            backgroundColor: result === "W" ? "#16a34a" : "#dc2626",
            color: "#fff",
            flexShrink: 0,
          }}
        >
          {result === "W" ? "G" : "M"}
        </span>
      ))}
      {Array.from({ length: Math.max(0, 5 - safeForm.length) }).map((_, i) => (
        <span
          key={`empty-${i}`}
          style={{
            display: "inline-block",
            width: 22,
            height: 22,
            borderRadius: "50%",
            backgroundColor: "#374151",
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  );
}

function SkeletonRows({ count = 8 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <tr key={i} className="border-b border-gray-800">
          {[40, 200, 60, 80, 100].map((w, j) => (
            <td key={j} className="px-4 py-3">
              <div
                className="rounded animate-pulse bg-gray-800"
                style={{ width: w, height: 16 }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export default function StandingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialGame = searchParams.get("game") ?? "valorant";
  const gameCandidate = GAMES.find((g) => g.key === initialGame) ?? GAMES[0];
  const initialLeague =
    searchParams.get("league") ?? gameCandidate.leagues[0].id;

  const [activeGame, setActiveGame] = useState(initialGame);
  const [activeLeague, setActiveLeague] = useState(initialLeague);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const gameConfig = GAMES.find((g) => g.key === activeGame) ?? GAMES[0];

  useEffect(() => {
    setSearchParams(
      { game: activeGame, league: activeLeague },
      { replace: true },
    );
  }, [activeGame, activeLeague, setSearchParams]);

  const handleGameChange = useCallback((key) => {
    const cfg = GAMES.find((g) => g.key === key) ?? GAMES[0];
    setActiveGame(key);
    setActiveLeague(cfg.leagues[0].id);
    setData(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null); // Yeni lige geçerken eski tabloyu temizle

    fetch(`/api/standings?game=${activeGame}&leagueId=${activeLeague}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeGame, activeLeague]); // Hem oyun hem lig değiştiğinde tetiklenir

  return (
    <div
      translate="no"
      className="min-h-screen bg-gray-950 text-gray-100 font-sans"
    >
      <div className="border-b border-gray-800 px-4 py-6 md:px-8">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Puan Durumu
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Güncel lig sıralamaları ve form tabloları
        </p>
      </div>

      <div
        className="flex overflow-x-auto border-b border-gray-800 px-4 md:px-8"
        style={{ scrollbarWidth: "none" }}
      >
        {GAMES.map((g) => {
          const active = g.key === activeGame;
          return (
            <button
              key={g.key}
              onClick={() => handleGameChange(g.key)}
              className="relative flex-shrink-0 px-5 py-4 text-sm font-semibold transition-colors focus:outline-none"
              style={{
                color: active ? g.color : "#9CA3AF",
                borderBottom: active
                  ? `2px solid ${g.color}`
                  : "2px solid transparent",
                background: active ? g.colorLight : "transparent",
              }}
            >
              {g.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col md:flex-row gap-0">
        <aside className="w-full md:w-56 shrink-0 border-b md:border-b-0 md:border-r border-gray-800 py-3">
          <p className="px-4 pb-2 text-xs font-semibold uppercase tracking-widest text-gray-500">
            Ligler
          </p>
          <ul>
            {gameConfig.leagues.map((lg) => {
              const isActive = lg.id === activeLeague;
              return (
                <li key={lg.id}>
                  <button
                    onClick={() => setActiveLeague(lg.id)}
                    className="w-full text-left px-4 py-2.5 text-sm transition-colors"
                    style={{
                      color: isActive ? gameConfig.color : "#D1D5DB",
                      background: isActive
                        ? gameConfig.colorLight
                        : "transparent",
                      borderLeft: isActive
                        ? `3px solid ${gameConfig.borderColor}`
                        : "3px solid transparent",
                      fontWeight: isActive ? 600 : 400,
                    }}
                  >
                    {lg.name}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <main className="flex-1 overflow-hidden">
          <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-gray-800">
            <div>
              {data ? (
                <h2 className="text-lg font-bold text-white">
                  {data.leagueName}
                </h2>
              ) : (
                <div className="h-5 w-40 rounded bg-gray-800 animate-pulse" />
              )}
              {data && data.updatedAt && (
                <p className="mt-0.5 text-xs text-gray-500">
                  Son güncelleme:{" "}
                  {new Date(data.updatedAt).toLocaleString("tr-TR", {
                    day: "numeric",
                    month: "long",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </div>
          </div>

          {error && (
            <div className="m-4 rounded-lg border border-red-800 bg-red-950 px-4 py-3 text-sm text-red-400">
              Veri yüklenemedi: {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3 text-left w-12">#</th>
                  <th className="px-4 py-3 text-left">Takım</th>
                  <th className="px-4 py-3 text-center w-14">O</th>
                  <th className="px-4 py-3 text-center w-20">G/M</th>
                  <th className="px-4 py-3 text-left w-36">Form</th>
                </tr>
              </thead>
              <tbody>
                {loading && <SkeletonRows count={8} />}

                {!loading &&
                  !error &&
                  data?.standings?.map((row) => (
                    <tr
                      key={row.teamId}
                      className="border-b border-gray-800/60 hover:bg-gray-900/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            style={{
                              width: 3,
                              height: 28,
                              borderRadius: 2,
                              background:
                                row.rank <= 3
                                  ? rankColor(row.rank)
                                  : "transparent",
                              flexShrink: 0,
                            }}
                          />
                          <span
                            className="font-bold tabular-nums"
                            style={{
                              color:
                                row.rank <= 3 ? rankColor(row.rank) : "#9CA3AF",
                              fontSize: row.rank <= 3 ? 15 : 13,
                            }}
                          >
                            {row.rank}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/team/${row.teamId}`}
                          className="flex items-center gap-2.5 group"
                          translate="no"
                        >
                          {row.teamLogo ? (
                            <img
                              src={row.teamLogo}
                              alt={row.teamName}
                              width={28}
                              height={28}
                              className="rounded object-contain"
                              style={{ background: "#1f2937" }}
                            />
                          ) : (
                            <div
                              className="rounded flex items-center justify-center text-xs font-bold text-gray-500"
                              style={{
                                width: 28,
                                height: 28,
                                background: "#1f2937",
                              }}
                            >
                              {(row.teamName ?? "").slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span className="font-semibold text-gray-100 group-hover:text-white transition-colors">
                            {row.teamName}
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-center tabular-nums text-gray-400">
                        {row.played}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="tabular-nums font-semibold text-green-400">
                          {row.wins}
                        </span>
                        <span className="text-gray-600 mx-0.5">/</span>
                        <span className="tabular-nums font-semibold text-red-400">
                          {row.losses}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <FormDots form={row.form} />
                      </td>
                    </tr>
                  ))}

                {!loading &&
                  !error &&
                  (!data?.standings || data.standings.length === 0) && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-12 text-center text-gray-500"
                      >
                        Bu lig için henüz tanımlı takım veya veri bulunmuyor.
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
