"use client";
import { useState, useEffect, useRef } from "react";
import {
  Trophy,
  LogIn,
  LogOut,
  Menu,
  X,
  Shield,
  Search,
  Gamepad2,
} from "lucide-react";
import useUser from "@/utils/useUser";

const GAME_SHORT = {
  valorant: "Valorant",
  cs2: "CS2",
  lol: "LoL",
  pubgm: "PUBG M",
};
const STATUS_STYLE = {
  live: "text-red-400 bg-red-500/10 border border-red-500/20",
  upcoming: "text-blue-400 bg-blue-500/10 border border-blue-500/20",
  finished: "text-gray-500 bg-gray-800 border border-gray-700",
};
const STATUS_LABEL = { live: "CANLI", upcoming: "YAKINDA", finished: "BİTTİ" };

/* ── Search Dropdown ─────────────────────────────────────────────────────── */
function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const timerRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function onClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    clearTimeout(timerRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query.trim())}`,
        );
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 280);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  // Navigate to search results page
  const goToSearch = () => {
    const q = query.trim();
    if (!q) return;
    window.location.href = `/search?q=${encodeURIComponent(q)}`;
  };

  // Enter key → full search page
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      goToSearch();
    }
  };

  return (
    <div ref={containerRef} className="relative hidden md:block">
      {/* Input */}
      <div
        className={`flex items-center gap-2 rounded-xl border px-3 py-2 transition-all w-52 focus-within:w-72 ${
          open
            ? "border-purple-500 bg-[#1E1E1E]"
            : "border-gray-800 bg-[#1A1A1A]"
        }`}
        style={{ transition: "width 0.25s ease" }}
      >
        {/* Search icon — clickable to navigate */}
        <button
          type="button"
          onClick={goToSearch}
          title="Aramaya git"
          className={`shrink-0 transition-colors ${query.trim() ? "text-purple-400 hover:text-purple-300 cursor-pointer" : "text-gray-500 cursor-default"}`}
        >
          <Search size={14} />
        </button>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Maç veya takım ara…"
          className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-gray-600"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setResults([]);
            }}
            className="shrink-0 text-gray-600 hover:text-white"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Dropdown — z-[9999] ensures it renders above Giriş Yap button and all other fixed elements */}
      {open && query.trim().length >= 2 && (
        <div
          className="absolute left-0 top-full mt-2 w-80 rounded-2xl border border-gray-800 bg-[#1A1A1A] shadow-2xl shadow-black/50 overflow-hidden"
          style={{ zIndex: 9999 }}
        >
          {loading ? (
            <div className="flex items-center justify-center py-6 text-xs text-gray-600">
              Aranıyor…
            </div>
          ) : results.length > 0 ? (
            <div className="divide-y divide-gray-800/60">
              {/* "See all results" row at top */}
              <button
                type="button"
                onClick={goToSearch}
                className="flex w-full items-center gap-2 px-4 py-2.5 hover:bg-[#262626] transition-colors text-left"
              >
                <Search size={12} className="text-purple-400 shrink-0" />
                <span className="text-xs font-semibold text-purple-400">
                  "{query}" için tüm sonuçlar →
                </span>
              </button>
              {results.map((match) => {
                const statusStyle =
                  STATUS_STYLE[match.status] || STATUS_STYLE.upcoming;
                const statusLabel = STATUS_LABEL[match.status] || match.status;
                return (
                  <a
                    key={match.id}
                    href={`/match/${match.id}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[#262626] transition-colors"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#262626] border border-gray-800">
                      <Gamepad2 size={14} className="text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs font-bold text-white truncate"
                        translate="no"
                      >
                        {match.team_a_name}{" "}
                        <span className="text-gray-600">vs</span>{" "}
                        {match.team_b_name}
                      </p>
                      <p
                        className="text-[10px] text-gray-500 truncate"
                        translate="no"
                      >
                        {match.tournament} ·{" "}
                        {GAME_SHORT[match.game] || match.game}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-black ${statusStyle}`}
                    >
                      {statusLabel}
                    </span>
                  </a>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-6 text-xs text-gray-600">
              <Search size={20} className="opacity-30" />
              <span>"{query}" için sonuç bulunamadı</span>
              <button
                type="button"
                onClick={goToSearch}
                className="mt-1 rounded-lg bg-[#262626] px-3 py-1.5 text-[10px] font-semibold text-gray-400 hover:text-white transition-colors"
              >
                Yine de aramayı görüntüle →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   Navbar
══════════════════════════════════════════════════════════════════════════ */
export default function Navbar() {
  const { data: user } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);

  const navLinks = [
    { href: "/", label: "Ana Sayfa" },
    { href: "/standings", label: "Puan Durumu" },
    { href: "/leaderboard", label: "Liderlik" },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-800 bg-[#121212]/95 backdrop-blur-md">
      {/* ── Main bar ── */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8">
        {/* Logo */}
        <a href="/" className="flex shrink-0 items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 shadow-lg shadow-purple-500/20">
            <Trophy size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Vibe<span className="text-purple-500">Skor</span>
          </span>
        </a>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-5 md:flex">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-gray-400 transition-colors hover:text-purple-400"
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* Desktop search + auth */}
        <div className="flex items-center gap-3">
          <SearchBar />

          {user ? (
            <>
              <div className="hidden flex-col items-end md:flex">
                <span className="text-sm font-semibold text-white">
                  {user.name || user.email}
                </span>
                <span className="text-xs font-bold text-purple-400">
                  {user.points || 0} Puan
                </span>
              </div>
              <a
                href="/admin"
                className="rounded-full bg-yellow-600/20 p-2 text-yellow-400 hover:bg-yellow-600/30 transition-all"
                title="Admin Panel"
              >
                <Shield size={16} />
              </a>
              <a
                href="/account/logout"
                className="rounded-full bg-gray-800 p-2 text-gray-400 hover:bg-gray-700 hover:text-white transition-all"
              >
                <LogOut size={18} />
              </a>
            </>
          ) : (
            <a
              href="/account/signin"
              className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-purple-700 shadow-lg shadow-purple-500/20"
            >
              <LogIn size={16} />
              Giriş Yap
            </a>
          )}

          {/* Mobile: search toggle */}
          <button
            onClick={() => setMobileSearch((v) => !v)}
            className="rounded-lg bg-gray-800 p-2 text-gray-400 hover:text-white md:hidden transition-all"
          >
            <Search size={18} />
          </button>

          {/* Mobile: hamburger */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="rounded-lg bg-gray-800 p-2 text-gray-400 hover:text-white md:hidden transition-all"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* ── Mobile search bar ── */}
      {mobileSearch && (
        <div className="border-t border-gray-800 bg-[#121212] px-4 py-3 md:hidden">
          <MobileSearch onClose={() => setMobileSearch(false)} />
        </div>
      )}

      {/* ── Mobile menu ── */}
      {mobileOpen && (
        <div className="border-t border-gray-800 bg-[#121212] px-4 pb-4 pt-2 md:hidden">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              className="block py-3 text-sm font-medium text-gray-300 hover:text-purple-400 transition-colors border-b border-gray-800/50 last:border-0"
            >
              {l.label}
            </a>
          ))}
          {user && (
            <div className="mt-3 flex items-center gap-3 rounded-xl bg-gray-800/50 p-3">
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">
                  {user.name || user.email}
                </p>
                <p className="text-xs text-purple-400">
                  {user.points || 0} Puan
                </p>
              </div>
              <a
                href="/account/logout"
                className="text-xs text-gray-500 hover:text-red-400 transition-colors"
              >
                Çıkış
              </a>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

/* ── Mobile search — full-width ── */
function MobileSearch({ onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query.trim())}`,
        );
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  const goToSearch = () => {
    const q = query.trim();
    if (!q) return;
    onClose();
    window.location.href = `/search?q=${encodeURIComponent(q)}`;
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      goToSearch();
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 rounded-xl border border-gray-700 bg-[#1E1E1E] px-3 py-2">
        <button
          type="button"
          onClick={goToSearch}
          className={`shrink-0 transition-colors ${query.trim() ? "text-purple-400" : "text-gray-500"}`}
        >
          <Search size={14} />
        </button>
        <input
          autoFocus
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Maç veya takım ara… (Enter ile git)"
          className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-gray-600"
        />
        <button onClick={onClose} className="text-gray-500 hover:text-white">
          <X size={14} />
        </button>
      </div>
      {loading && (
        <p className="mt-2 text-center text-[11px] text-gray-600">Aranıyor…</p>
      )}
      {results.length > 0 && (
        <div className="mt-2 rounded-xl border border-gray-800 bg-[#1A1A1A] overflow-hidden">
          <button
            type="button"
            onClick={goToSearch}
            className="flex w-full items-center gap-2 px-4 py-2.5 hover:bg-[#262626] transition-colors border-b border-gray-800"
          >
            <Search size={11} className="text-purple-400 shrink-0" />
            <span className="text-[11px] font-semibold text-purple-400">
              "{query}" için tüm sonuçlar →
            </span>
          </button>
          {results.map((match) => (
            <a
              key={match.id}
              href={`/match/${match.id}`}
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 hover:bg-[#262626] border-b border-gray-800/50 last:border-0 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p
                  className="text-xs font-bold text-white truncate"
                  translate="no"
                >
                  {match.team_a_name} vs {match.team_b_name}
                </p>
                <p
                  className="text-[10px] text-gray-500 truncate"
                  translate="no"
                >
                  {match.tournament}
                </p>
              </div>
              <span
                className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-black ${STATUS_STYLE[match.status] || STATUS_STYLE.upcoming}`}
              >
                {STATUS_LABEL[match.status] || match.status}
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
