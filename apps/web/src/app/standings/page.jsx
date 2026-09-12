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
      { id: "emea-masters", name: "EMEA Masters" },
    ],
  },
  {
    key: "cs2",
    label: "CS2",
    color: "#F4941D",
    colorLight: "rgba(244,148,29,0.08)",
    borderColor: "#F4941D",
    leagues: [
      { id: "iem", name: "IEM" },
      { id: "esea", name: "ESEA" },
      { id: "cct-europe", name: "CCT Europe" },
      { id: "european-pro-league", name: "European Pro League" },
      { id: "united21", name: "United21" },
    ],
  },
  {
    key: "valorant",
    label: "Valorant",
    color: "#ff4655",
    colorLight: "rgba(255,70,85,0.08)",
    borderColor: "#ff4655",
    leagues: [
      { id: "vct", name: "VCT" },
      { id: "vcl", name: "VCL" },
      { id: "esports-world-cup", name: "Esports World Cup" },
      { id: "the-pokal", name: "THE POKAL" },
      { id: "china-evolution-series", name: "China Evolution Series" },
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

function StageTabs({ stages, activeStageId, onSelect, accentColor }) {
  if (!stages || stages.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 px-4 md:px-6 py-3 border-b border-gray-800 bg-gray-950/60">
      {stages.map((stage) => {
        const active = stage.stageId === activeStageId;
        return (
          <button
            key={stage.stageId}
            onClick={() => onSelect(stage.stageId)}
            className="flex flex-col items-start gap-0.5 rounded-lg px-3 py-1.5 text-left transition-colors"
            style={{
              color: active ? accentColor : "#9CA3AF",
              background: active ? `${accentColor}1A` : "#1f2937",
              border: `1px solid ${active ? accentColor : "transparent"}`,
            }}
          >
            {stage.serieName && (
              <span className="text-[9px] uppercase tracking-wider text-gray-500">
                {stage.serieName}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-xs font-semibold">
              {stage.name}
              {stage.hasBracket && (
                <span className="text-[9px] uppercase tracking-wider text-gray-500">
                  Ağaç
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function BracketMatchCard({ match, accentColor }) {
  const aWin = match.winner && match.winner === match.team_a;
  const bWin = match.winner && match.winner === match.team_b;
  return (
    <div className="w-56 rounded-lg border border-gray-800 bg-gray-900 overflow-hidden">
      <div
        className={`flex items-center justify-between px-3 py-2 text-xs ${aWin ? "font-bold text-white" : "text-gray-400"}`}
        style={{ background: aWin ? `${accentColor}15` : "transparent" }}
      >
        <span className="truncate" translate="no">
          {match.team_a ?? "TBD"}
        </span>
        <span className="tabular-nums">{match.score_a ?? "-"}</span>
      </div>
      <div className="h-px bg-gray-800" />
      <div
        className={`flex items-center justify-between px-3 py-2 text-xs ${bWin ? "font-bold text-white" : "text-gray-400"}`}
        style={{ background: bWin ? `${accentColor}15` : "transparent" }}
      >
        <span className="truncate" translate="no">
          {match.team_b ?? "TBD"}
        </span>
        <span className="tabular-nums">{match.score_b ?? "-"}</span>
      </div>
    </div>
  );
}

function BracketView({ rounds, accentColor }) {
  if (!rounds || rounds.length === 0) {
    return (
      <div className="px-4 py-16 text-center text-sm text-gray-500">
        Bu aşama için ağaç verisi bulunamadı.
      </div>
    );
  }
  return (
    <div className="flex gap-6 overflow-x-auto px-4 md:px-6 py-6">
      {rounds.map((round) => (
        <div key={round.round} className="flex flex-col gap-4 shrink-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
            {round.label}
          </p>
          <div className="flex flex-1 flex-col justify-around gap-6">
            {round.matches.map((m) => (
              <BracketMatchCard
                key={m.slot_id}
                match={m}
                accentColor={accentColor}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
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

  const [stages, setStages] = useState([]);
  const [stagesLoading, setStagesLoading] = useState(false);
  const [activeStageId, setActiveStageId] = useState(null);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [bracketData, setBracketData] = useState(null);
  const [bracketLoading, setBracketLoading] = useState(false);
  const [bracketError, setBracketError] = useState(null);

  const gameConfig = GAMES.find((g) => g.key === activeGame) ?? GAMES[0];
  const activeStage = stages.find((s) => s.stageId === activeStageId) ?? null;

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
  }, []);

  useEffect(() => {
    let cancelled = false;
    setStagesLoading(true);
    setStages([]);
    setActiveStageId(null);
    setData(null);

    fetch(`/api/tournament-stages?game=${activeGame}&leagueId=${activeLeague}`)
      .then((r) => (r.ok ? r.json() : { stages: [] }))
      .then((json) => {
        if (cancelled) return;
        const list = json.stages || [];
        setStages(list);
        setActiveStageId(list.length > 0 ? list[0].stageId : null);
        setStagesLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setStages([]);
          setActiveStageId(null);
          setStagesLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeGame, activeLeague]);

  useEffect(() => {
    if (stagesLoading) return;

    if (activeStage && activeStage.hasBracket) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);

    const stageParam = activeStage ? `&stageId=${activeStage.stageId}` : "";

    fetch(
      `/api/standings?game=${activeGame}&leagueId=${activeLeague}${stageParam}`,
    )
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
  }, [activeGame, activeLeague, activeStageId, stagesLoading]);

  useEffect(() => {
    if (!activeStage || !activeStage.hasBracket) {
      setBracketData(null);
      setBracketError(null);
      return;
    }

    let cancelled = false;
    setBracketLoading(true);
    setBracketError(null);
    setBracketData(null);

    fetch(`/api/bracket?stageId=${activeStage.stageId}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        if (!cancelled) {
          setBracketData(json);
          setBracketLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setBracketError(err.message);
          setBracketLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeStageId, activeStage]);

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
          {!stagesLoading && stages.length > 0 && (
            <StageTabs
              stages={stages}
              activeStageId={activeStageId}
              onSelect={setActiveStageId}
              accentColor={gameConfig.color}
            />
          )}

          <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-gray-800">
            <div>
              {activeStage ? (
                <h2 className="text-lg font-bold text-white">
                  {activeStage.name}
                </h2>
              ) : data ? (
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

          {activeStage && activeStage.hasBracket ? (
            bracketLoading ? (
              <div className="px-4 py-16 text-center text-sm text-gray-500">
                Ağaç yükleniyor...
              </div>
            ) : bracketError ? (
              <div className="m-4 rounded-lg border border-red-800 bg-red-950 px-4 py-3 text-sm text-red-400">
                Ağaç yüklenemedi: {bracketError}
              </div>
            ) : (
              <BracketView
                rounds={bracketData?.rounds}
                accentColor={gameConfig.color}
              />
            )
          ) : (
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
                  {(loading || stagesLoading) && <SkeletonRows count={8} />}

                  {!loading &&
                    !stagesLoading &&
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
                                  row.rank <= 3
                                    ? rankColor(row.rank)
                                    : "#9CA3AF",
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
                    !stagesLoading &&
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
          )}
        </main>
      </div>
    </div>
  );
}
