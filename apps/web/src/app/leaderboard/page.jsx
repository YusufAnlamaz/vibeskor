import { useQuery } from "@tanstack/react-query";
import { Trophy, User, Crown } from "lucide-react";

export default function LeaderboardPage() {
  const { data: leaders = [], isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const res = await fetch("/api/leaderboard");
      return res.json();
    },
  });

  return (
    <div className="min-h-screen bg-[#121212] font-inter text-white">
      <main className="mx-auto max-w-3xl p-4 py-10 md:p-8">
        <div className="text-center mb-12">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/10 border border-yellow-500/20 mb-4 shadow-lg shadow-yellow-500/10">
            <Crown size={32} className="text-yellow-500" />
          </div>
          <h2 className="text-3xl font-bold mb-2">Haftalık Liderler</h2>
          <p className="text-gray-400">
            En çok doğru tahmin yapan gamerlar listeleniyor.
          </p>
        </div>

        <div className="rounded-3xl bg-[#1E1E1E] border border-gray-800 overflow-hidden shadow-2xl">
          <div className="grid grid-cols-12 px-6 py-4 border-b border-gray-800 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            <div className="col-span-2">Sıra</div>
            <div className="col-span-7">Kullanıcı</div>
            <div className="col-span-3 text-right">Puan</div>
          </div>

          <div className="divide-y divide-gray-800">
            {isLoading ? (
              Array(5)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={i}
                    className="h-16 w-full bg-[#262626]/50 loading-shimmer"
                  />
                ))
            ) : leaders.length > 0 ? (
              leaders.map((u, index) => (
                <div
                  key={u.id}
                  className="grid grid-cols-12 px-6 py-5 items-center transition-colors hover:bg-gray-800/50"
                >
                  <div className="col-span-2">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                        index === 0
                          ? "bg-yellow-500 text-black"
                          : index === 1
                            ? "bg-gray-300 text-black"
                            : index === 2
                              ? "bg-amber-600 text-white"
                              : "text-gray-500"
                      }`}
                    >
                      {index + 1}
                    </span>
                  </div>
                  <div className="col-span-7 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center">
                      <User size={20} className="text-gray-500" />
                    </div>
                    <span className="font-semibold text-gray-200">
                      {u.name}
                    </span>
                  </div>
                  <div className="col-span-3 text-right">
                    <span className="text-lg font-black text-white tabular-nums">
                      {u.points}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-gray-500">
                Henüz puanı olan kullanıcı yok.
              </div>
            )}
          </div>
        </div>
      </main>
      <style jsx global>{`
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        .loading-shimmer{background:linear-gradient(90deg,#262626 25%,#333 50%,#262626 75%);background-size:200% 100%;animation:shimmer 1.5s infinite}
      `}</style>
    </div>
  );
}
