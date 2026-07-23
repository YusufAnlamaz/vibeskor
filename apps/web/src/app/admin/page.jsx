import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Gamepad2,
  Trophy,
  BarChart2,
  CheckCircle,
  XCircle,
  Activity,
  Zap,
} from "lucide-react";
import useUser from "@/utils/useUser";

const GAME_COLORS = {
  valorant: "text-red-400 bg-red-500/10 border-red-500/20",
  cs2: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  lol: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  pubgm: "text-amber-400 bg-amber-500/10 border-amber-500/20",
};
const GAME_NAMES = {
  valorant: "Valorant",
  cs2: "CS2",
  lol: "LoL",
  pubgm: "PUBG M",
};
const STATUS_STYLE = {
  live: "bg-red-500/10 text-red-400 border-red-500/20",
  upcoming: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  finished: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};
const STATUS_LABEL = { live: "CANLI", upcoming: "YAKINDA", finished: "BİTTİ" };

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "text-purple-400",
}) {
  return (
    <div className="rounded-2xl bg-[#1E1E1E] border border-gray-800 p-5 flex items-center gap-4">
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#262626] ${color}`}
      >
        <Icon size={22} />
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
          {label}
        </p>
        <p className="text-2xl font-black text-white tabular-nums">
          {value ?? "—"}
        </p>
        {sub && <p className="text-[10px] text-gray-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { data: user, loading } = useUser();

  const {
    data: stats,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error("Yetkisiz veya hata");
      return res.json();
    },
    refetchInterval: 30000,
  });

  if (loading)
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center text-gray-500">
        Yükleniyor...
      </div>
    );

  if (!user)
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center gap-4 text-white">
        <XCircle size={48} className="text-red-500 opacity-60" />
        <p className="text-gray-400">
          Bu sayfayı görüntülemek için giriş yapmalısınız.
        </p>
        <a
          href="/account/signin"
          className="rounded-xl bg-purple-600 px-6 py-2 text-sm font-semibold hover:bg-purple-700 transition-all"
        >
          Giriş Yap
        </a>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#121212] font-inter text-white">
      <main className="mx-auto max-w-7xl p-4 py-8 md:p-8">
        {/* Page header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <Zap size={22} className="text-yellow-400" />
              Admin Dashboard
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              VibeSkor sistem durumu ve istatistikler
            </p>
          </div>
          <div className="flex items-center gap-2">
            {stats?.api_connected ? (
              <span className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1.5 text-xs font-bold text-green-400 border border-green-500/20">
                <CheckCircle size={12} />
                PandaScore Bağlı
              </span>
            ) : (
              <span className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-400 border border-red-500/20">
                <XCircle size={12} />
                PandaScore Bağlı Değil
              </span>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array(8)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className="h-24 rounded-2xl bg-[#1E1E1E] loading-shimmer"
                />
              ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl bg-red-900/20 border border-red-500/20 p-6 text-center text-red-400">
            İstatistikler yüklenemedi: {error.message}
          </div>
        ) : (
          <>
            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard
                icon={Users}
                label="Toplam Kullanıcı"
                value={stats.users}
                color="text-purple-400"
              />
              <StatCard
                icon={Gamepad2}
                label="Toplam Maç"
                value={stats.matches}
                color="text-blue-400"
                sub={`${stats.live_matches} canlı`}
              />
              <StatCard
                icon={Activity}
                label="Toplam Tahmin"
                value={stats.predictions}
                color="text-pink-400"
                sub={`%${stats.accuracy} doğruluk`}
              />
              <StatCard
                icon={Trophy}
                label="Dağıtılan Puan"
                value={stats.points_awarded}
                color="text-yellow-400"
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* ── Top Users ── */}
              <div className="rounded-2xl bg-[#1E1E1E] border border-gray-800 overflow-hidden">
                <div className="flex items-center gap-2 border-b border-gray-800 px-5 py-4">
                  <Trophy size={16} className="text-yellow-500" />
                  <h2 className="text-sm font-bold text-white">
                    Top 5 Kullanıcı
                  </h2>
                </div>
                <div className="divide-y divide-gray-800/50">
                  {(stats.top_users || []).map((u, i) => (
                    <div
                      key={u.email}
                      className="flex items-center gap-4 px-5 py-3"
                    >
                      <span
                        className={`w-6 text-center text-sm font-black ${i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-300" : i === 2 ? "text-amber-600" : "text-gray-600"}`}
                      >
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-200 truncate">
                          {u.name || u.email}
                        </p>
                        <p className="text-[10px] text-gray-600 truncate">
                          {u.email}
                        </p>
                      </div>
                      <span className="text-sm font-black text-white tabular-nums">
                        {u.points}
                      </span>
                    </div>
                  ))}
                  {!stats.top_users?.length && (
                    <p className="px-5 py-6 text-center text-sm text-gray-600">
                      Henüz puanlı kullanıcı yok.
                    </p>
                  )}
                </div>
              </div>

              {/* ── Games Distribution ── */}
              <div className="rounded-2xl bg-[#1E1E1E] border border-gray-800 overflow-hidden">
                <div className="flex items-center gap-2 border-b border-gray-800 px-5 py-4">
                  <BarChart2 size={16} className="text-blue-400" />
                  <h2 className="text-sm font-bold text-white">
                    Oyuna Göre Maçlar
                  </h2>
                </div>
                <div className="p-5 space-y-3">
                  {(stats.by_game || []).map((g) => {
                    const pct =
                      stats.matches > 0
                        ? Math.round((g.total / stats.matches) * 100)
                        : 0;
                    return (
                      <div key={g.game}>
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`text-xs font-bold rounded px-2 py-0.5 border ${GAME_COLORS[g.game] || "text-gray-400 bg-gray-800 border-gray-700"}`}
                          >
                            {GAME_NAMES[g.game] || g.game}
                          </span>
                          <span className="text-xs text-gray-500 tabular-nums">
                            {g.total} maç · %{pct}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-purple-500/60 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Recent Matches ── */}
              <div className="rounded-2xl bg-[#1E1E1E] border border-gray-800 overflow-hidden lg:col-span-2">
                <div className="flex items-center gap-2 border-b border-gray-800 px-5 py-4">
                  <Activity size={16} className="text-purple-400" />
                  <h2 className="text-sm font-bold text-white">Son Maçlar</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-[10px] font-bold text-gray-600 uppercase tracking-widest border-b border-gray-800">
                        <th className="px-5 py-3">Maç</th>
                        <th className="px-3 py-3">Oyun</th>
                        <th className="px-3 py-3">Skor</th>
                        <th className="px-3 py-3">Durum</th>
                        <th className="px-5 py-3 text-right">Tarih</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/50">
                      {(stats.recent_matches || []).map((m, i) => (
                        <tr
                          key={i}
                          className="hover:bg-gray-800/30 transition-colors"
                        >
                          <td className="px-5 py-3">
                            <span className="font-semibold text-gray-200">
                              {m.team_a_name}
                            </span>
                            <span className="text-gray-600 mx-1">vs</span>
                            <span className="font-semibold text-gray-200">
                              {m.team_b_name}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-bold border ${GAME_COLORS[m.game] || "text-gray-500 bg-gray-800 border-gray-700"}`}
                            >
                              {GAME_NAMES[m.game] || m.game}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-gray-400 tabular-nums">
                            {m.score_a} - {m.score_b}
                          </td>
                          <td className="px-3 py-3">
                            <span
                              className={`rounded border px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLE[m.status] || "text-gray-500 bg-gray-800 border-gray-700"}`}
                            >
                              {STATUS_LABEL[m.status] || m.status}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right text-[10px] text-gray-600">
                            {new Date(m.start_time).toLocaleString("tr-TR", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      <style jsx global>{`
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        .loading-shimmer{background:linear-gradient(90deg,#1E1E1E 25%,#2a2a2a 50%,#1E1E1E 75%);background-size:200% 100%;animation:shimmer 1.5s infinite}
      `}</style>
    </div>
  );
}
