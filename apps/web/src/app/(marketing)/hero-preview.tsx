"use client";

import { motion, useReducedMotion } from "motion/react";
import { RingGauge } from "@/components/ring-gauge";
import { ProviderLogo } from "@/components/provider-logo";
import { formatBytes } from "@/lib/providers-meta";
import { FileIcon, ArrowRight, ShieldCheck } from "lucide-react";
import { useLandingTheme } from "./theme-context";

const CARDS = [
  { provider: "dropbox", label: "Dropbox", used: 67 * 1024 ** 3, total: 128 * 1024 ** 3, color: "#0061FE" },
  { provider: "google_drive", label: "Google Drive", used: 83 * 1024 ** 3, total: 512 * 1024 ** 3, color: "#0F9D58" },
  { provider: "mega", label: "MEGA", used: 12 * 1024 ** 3, total: 50 * 1024 ** 3, color: "#D9272E" },
];

const RECENT_FILES = [
  { name: "Brand-Identity-2026.pdf", provider: "google_drive", size: 4_800_000, tag: "PDF" },
  { name: "Cinematic-Reel-4K.mov", provider: "dropbox", size: 1_850_000_000, tag: "Video" },
  { name: "Master-Podcast-Ep14.wav", provider: "mega", size: 56_000_000, tag: "Audio" },
];

export function HeroPreview() {
  const reduce = useReducedMotion();
  const { theme } = useLandingTheme();
  const isDark = theme === "dark";

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className={`relative overflow-hidden rounded-3xl border p-5 sm:p-6 transition-colors duration-300 ${
        isDark
          ? "border-white/10 bg-[#0C0E12] shadow-2xl shadow-blue-500/10 text-white"
          : "border-line bg-card shadow-xl shadow-slate-200/50 text-ink"
      }`}
    >
      {/* Ambient gradient */}
      <div
        className={`pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full blur-3xl transition-opacity ${
          isDark ? "bg-blue-500/10 opacity-100" : "bg-blue-500/5 opacity-60"
        }`}
      />

      {/* Top Bar / Status */}
      <div
        className={`relative z-10 flex items-center justify-between border-b pb-4 ${
          isDark ? "border-white/5" : "border-line"
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold">Live Cloud Engine</span>
        </div>
        <div
          className={`flex items-center gap-1.5 text-[11px] font-mono ${
            isDark ? "text-slate-400" : "text-slate-500"
          }`}
        >
          <ShieldCheck size={13} className="text-emerald-500" />
          <span>AES-256-GCM Vault Active</span>
        </div>
      </div>

      {/* Storage Cards Row */}
      <div className="relative z-10 mt-4 grid grid-cols-3 gap-2.5 sm:gap-3">
        {CARDS.map((c, i) => {
          const pct = Math.round((c.used / c.total) * 100);
          return (
            <motion.div
              key={c.provider}
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.08, duration: 0.4 }}
              className={`rounded-2xl border p-3 sm:p-3.5 transition-all ${
                isDark
                  ? "border-white/10 bg-black/50 hover:border-white/20"
                  : "border-line bg-canvas/80 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-xl p-1 border shadow-xs ${
                    isDark ? "bg-white/5 border-white/10" : "bg-white border-line"
                  }`}
                >
                  <ProviderLogo provider={c.provider} size={15} />
                </div>
                <span className="font-mono text-[10px] font-bold tabular-nums text-slate-400">
                  {pct}%
                </span>
              </div>
              <p className="mt-2.5 truncate text-[11px] font-bold">{c.label}</p>
              <p className="font-mono text-[10px] text-slate-400 tabular-nums">
                {formatBytes(c.used)}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Aggregate Storage Gauge Banner */}
      <div
        className={`relative z-10 mt-4 flex items-center gap-4 rounded-2xl border p-4 transition-colors ${
          isDark ? "border-white/10 bg-black/60" : "border-line bg-slate-50/80"
        }`}
      >
        <div className="relative h-14 w-14 shrink-0">
          <RingGauge used={162 * 1024 ** 3} total={690 * 1024 ** 3} color="#3b82f6" isDark={isDark} size={56} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-400">Kapasitas Gabungan Terpadu</p>
            <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-blue-500">
              3 Accounts
            </span>
          </div>
          <p className="mt-0.5 font-mono text-xl font-bold tracking-tight tabular-nums">
            162 GB <span className="text-xs font-normal text-slate-400">/ 690 GB</span>
          </p>
          <p className="text-[11px] text-slate-400">528 GB ruang kosong tersisa lintas cloud</p>
        </div>
      </div>

      {/* Live File Transfer Demonstration */}
      <div
        className={`relative z-10 mt-4 rounded-2xl border p-3.5 ${
          isDark
            ? "border-blue-500/30 bg-blue-950/20 text-blue-300"
            : "border-blue-100 bg-blue-50/60 text-primary"
        }`}
      >
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="font-bold">Stream-to-Stream Direct Pipe</span>
          </div>
          <span className="font-mono text-[11px] font-bold tabular-nums">78% • 14.2 MB/s</span>
        </div>
        <div
          className={`mt-2 flex items-center justify-between text-xs ${
            isDark ? "text-slate-300" : "text-slate-700"
          }`}
        >
          <div className="flex items-center gap-1.5 truncate">
            <FileIcon size={13} className="text-slate-400" />
            <span className="truncate max-w-[140px] font-medium">Reel-Proyek-Final.mov</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-400 shrink-0 font-mono">
            <span>Dropbox</span>
            <ArrowRight size={10} className="text-blue-500" />
            <span>Google Drive</span>
          </div>
        </div>
        <div
          className={`mt-2.5 h-1.5 overflow-hidden rounded-full ${
            isDark ? "bg-white/10" : "bg-blue-100"
          }`}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300"
            style={{ width: "78%" }}
          />
        </div>
      </div>

      {/* Recent Files Preview */}
      <div
        className={`relative z-10 mt-4 overflow-hidden rounded-2xl border ${
          isDark ? "border-white/10 bg-black/40" : "border-line bg-white"
        }`}
      >
        <div
          className={`border-b px-4 py-2 text-[10px] font-mono uppercase tracking-wider ${
            isDark ? "border-white/5 text-slate-400 bg-white/[0.02]" : "border-line text-slate-400 bg-slate-50"
          }`}
        >
          Recent Cloud Index
        </div>
        <ul className={`divide-y text-xs ${isDark ? "divide-white/5" : "divide-line"}`}>
          {RECENT_FILES.map((r) => (
            <li
              key={r.name}
              className={`flex items-center gap-3 px-4 py-2.5 transition ${
                isDark ? "hover:bg-white/[0.03]" : "hover:bg-slate-50"
              }`}
            >
              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border ${
                  isDark ? "bg-white/5 border-white/10" : "bg-slate-50 border-line"
                }`}
              >
                <ProviderLogo provider={r.provider} size={14} />
              </div>
              <span className="min-w-0 flex-1 truncate font-medium">{r.name}</span>
              <span
                className={`rounded-md px-1.5 py-0.5 text-[10px] font-mono ${
                  isDark ? "bg-white/5 text-slate-400" : "bg-slate-100 text-slate-500"
                }`}
              >
                {r.tag}
              </span>
              <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                {formatBytes(r.size)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}
