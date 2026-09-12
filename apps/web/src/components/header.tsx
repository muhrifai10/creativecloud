"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bell, Search, Menu, Upload } from "lucide-react";
import { signOut } from "next-auth/react";
import { useSidebar } from "@/components/sidebar-provider";
import { useDashboardTheme, DashboardThemeToggle } from "@/components/dashboard-theme-provider";

export function Header({ email, name = "User" }: { email: string; name?: string }) {
  const router = useRouter();
  const { toggle } = useSidebar();
  const { isDark } = useDashboardTheme();
  const [q, setQ] = useState("");
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => {
      const term = q.trim();
      if (term) router.push(`/explorer?q=${encodeURIComponent(term)}`);
    }, 300);
    return () => clearTimeout(t);
  }, [q, router]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (term) router.push(`/explorer?q=${encodeURIComponent(term)}`);
  }

  const initial = (name || email).trim().charAt(0).toUpperCase() || "U";

  return (
    <header
      className={`sticky top-0 z-30 flex h-16 items-center justify-between border-b px-4 sm:px-6 lg:px-8 backdrop-blur-md transition-colors duration-200 ${
        isDark
          ? "border-white/10 bg-[#0D0F14]/95 text-white"
          : "border-line bg-card/95 text-ink shadow-2xs"
      }`}
    >
      {/* Left: Mobile hamburger & Search Bar */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-xl">
        <button
          type="button"
          onClick={toggle}
          className={`rounded-xl p-2 transition lg:hidden shrink-0 ${
            isDark ? "text-slate-400 hover:bg-white/10 hover:text-white" : "text-slate-500 hover:bg-slate-100 hover:text-ink"
          }`}
          aria-label="Buka navigasi"
        >
          <Menu size={18} />
        </button>

        {/* Tailgrids Search Input */}
        <form onSubmit={submit} className="relative w-full" role="search">
          <Search
            size={15}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search Files, doc, image..."
            aria-label="Cari berkas atau folder"
            className={`w-full rounded-xl border py-2 pl-9 pr-12 text-xs outline-none transition placeholder:text-slate-500 ${
              isDark
                ? "border-white/10 bg-white/5 text-white focus:border-primary/50 focus:bg-white/10 focus:ring-2 focus:ring-primary/20"
                : "border-line bg-slate-50/70 text-ink focus:border-primary/40 focus:bg-white focus:ring-2 focus:ring-primary/10"
            }`}
          />
          <kbd
            className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md border px-1.5 py-0.5 font-mono text-[10px] shadow-2xs ${
              isDark ? "border-white/10 bg-white/10 text-slate-400" : "border-line bg-white text-slate-400"
            }`}
          >
            ⌘K
          </kbd>
        </form>
      </div>

      {/* Right: Theme Toggle, Notifications, Primary CTA Button, Avatar */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 pl-4">
        {/* Dark / Light Mode Toggle Button */}
        <DashboardThemeToggle />

        {/* Notification Bell */}
        <button
          type="button"
          aria-label="Notifikasi"
          className={`relative rounded-xl border p-2 transition shadow-2xs ${
            isDark
              ? "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
              : "border-line bg-card text-slate-500 hover:bg-slate-50 hover:text-ink"
          }`}
        >
          <Bell size={16} aria-hidden />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
        </button>

        {/* Tailgrids Signature Primary Action: "+ Upload File" */}
        <button
          type="button"
          onClick={() => router.push("/explorer")}
          className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-blue-600 active:scale-95"
        >
          <Upload size={14} strokeWidth={2.4} />
          <span>Upload File</span>
        </button>

        {/* User Initial Avatar Dropdown */}
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          title={`Keluar (${email})`}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition ${
            isDark
              ? "bg-white/10 border-white/10 text-white hover:bg-white/20"
              : "bg-slate-100 border-line text-slate-700 hover:bg-slate-200"
          }`}
        >
          {initial}
        </button>
      </div>
    </header>
  );
}
