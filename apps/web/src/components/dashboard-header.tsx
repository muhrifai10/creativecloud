"use client";

import { Calendar } from "lucide-react";
import { useDashboardTheme } from "@/components/dashboard-theme-provider";

export function DashboardPageHeader({ displayName: _displayName }: { displayName: string }) {
  const { isDark } = useDashboardTheme();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className={`text-2xl font-bold tracking-tight sm:text-3xl ${isDark ? "text-white" : "text-[#151B27]"}`}>
          Overview
        </h1>
        <p className={`mt-0.5 text-xs sm:text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          Pantau kapasitas, berkas, dan sinkronisasi seluruh cloud Anda secara real-time.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold shadow-2xs transition-colors ${
            isDark ? "border-white/10 bg-white/5 text-slate-300" : "border-line bg-card text-slate-600"
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Live Sync Active</span>
        </div>
        <div
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium shadow-2xs transition-colors ${
            isDark ? "border-white/10 bg-white/5 text-slate-300" : "border-line bg-card text-slate-600"
          }`}
        >
          <Calendar size={13} className={isDark ? "text-slate-400" : "text-slate-400"} />
          <span>Last 30 days</span>
        </div>
      </div>
    </div>
  );
}
