"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ProviderLogo } from "@/components/provider-logo";
import { FileText, Image as ImageIcon, Video, Music, Archive } from "lucide-react";
import { useLandingTheme } from "./theme-context";

const TABS = [
  { id: "google_drive", label: "Google Drive" },
  { id: "dropbox", label: "Dropbox" },
  { id: "mega", label: "MEGA" },
  { id: "onedrive", label: "OneDrive" },
] as const;

interface DemoFile {
  name: string;
  type: string;
  size: string;
  icon: typeof FileText;
  iconColor: string;
  iconBg: string;
}

const FILES: Record<(typeof TABS)[number]["id"], DemoFile[]> = {
  google_drive: [
    { name: "Proposal-Proyek-Klien-2026.pdf", type: "PDF Document", size: "5.4 MB", icon: FileText, iconColor: "text-blue-500", iconBg: "bg-blue-500/10 border border-blue-500/20" },
    { name: "Brand-Logo-Vector-Asset.svg", type: "Vector Graphics", size: "420 KB", icon: ImageIcon, iconColor: "text-cyan-500", iconBg: "bg-cyan-500/10 border border-cyan-500/20" },
    { name: "Kontrak-Kerja-Freelance.docx", type: "Word Document", size: "94 KB", icon: FileText, iconColor: "text-blue-500", iconBg: "bg-blue-500/10 border border-blue-500/20" },
    { name: "Data-Inventaris-Asset.xlsx", type: "Spreadsheet", size: "180 KB", icon: FileText, iconColor: "text-emerald-500", iconBg: "bg-emerald-500/10 border border-emerald-500/20" },
  ],
  dropbox: [
    { name: "Commercial-Reel-4K-Final.mov", type: "Video 4K", size: "1.8 GB", icon: Video, iconColor: "text-rose-500", iconBg: "bg-rose-500/10 border border-rose-500/20" },
    { name: "Font-Typography-Bundle.zip", type: "Zip Archive", size: "48 MB", icon: Archive, iconColor: "text-slate-400", iconBg: "bg-slate-500/10 border border-slate-500/20" },
    { name: "Design-System-Exploration.fig", type: "Figma File", size: "14.2 MB", icon: ImageIcon, iconColor: "text-purple-500", iconBg: "bg-purple-500/10 border border-purple-500/20" },
    { name: "Rough-Cut-Teaser.mp4", type: "Video HD", size: "320 MB", icon: Video, iconColor: "text-rose-500", iconBg: "bg-rose-500/10 border border-rose-500/20" },
  ],
  mega: [
    { name: "Source-Code-Backup-Full.tar.gz", type: "Archive", size: "1.2 GB", icon: Archive, iconColor: "text-slate-400", iconBg: "bg-slate-500/10 border border-slate-500/20" },
    { name: "Master-Audio-Podcast-Ep18.wav", type: "Lossless Audio", size: "68 MB", icon: Music, iconColor: "text-amber-500", iconBg: "bg-amber-500/10 border border-amber-500/20" },
    { name: "RAW-Photo-Session-Bali.zip", type: "Zip Archive", size: "4.8 GB", icon: Archive, iconColor: "text-slate-400", iconBg: "bg-slate-500/10 border border-slate-500/20" },
    { name: "Voiceover-Track-Bahasa.mp3", type: "Audio File", size: "12 MB", icon: Music, iconColor: "text-amber-500", iconBg: "bg-amber-500/10 border border-amber-500/20" },
  ],
  onedrive: [
    { name: "Laporan-Keuangan-Q3.xlsx", type: "Excel Sheet", size: "45 KB", icon: FileText, iconColor: "text-emerald-500", iconBg: "bg-emerald-500/10 border border-emerald-500/20" },
    { name: "Pitch-Deck-Investor-2026.pptx", type: "Presentation", size: "18.5 MB", icon: FileText, iconColor: "text-orange-500", iconBg: "bg-orange-500/10 border border-orange-500/20" },
    { name: "Company-Profile-Booklet.pdf", type: "PDF Document", size: "8.2 MB", icon: FileText, iconColor: "text-blue-500", iconBg: "bg-blue-500/10 border border-blue-500/20" },
    { name: "Meeting-Recording-Product.mp4", type: "Video", size: "410 MB", icon: Video, iconColor: "text-rose-500", iconBg: "bg-rose-500/10 border border-rose-500/20" },
  ],
};

export function ExplorerDemo() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["id"]>("google_drive");
  const reduce = useReducedMotion();
  const { theme } = useLandingTheme();
  const isDark = theme === "dark";

  return (
    <div
      className={`overflow-hidden rounded-3xl border shadow-2xl transition-colors duration-300 ${
        isDark ? "border-white/10 bg-[#0C0E12] text-white" : "border-line bg-card text-ink shadow-slate-200/50"
      }`}
    >
      {/* Top Cloud Selector Tabs */}
      <div
        className={`flex flex-wrap items-center gap-1.5 border-b p-2.5 sm:gap-2 sm:p-3 transition-colors ${
          isDark ? "border-white/10 bg-black/60" : "border-line bg-slate-50/80"
        }`}
      >
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 rounded-2xl px-3.5 py-2 text-xs font-semibold transition-all ${
                active
                  ? isDark
                    ? "text-white shadow-xs"
                    : "text-ink shadow-xs"
                  : isDark
                  ? "text-slate-400 hover:text-white hover:bg-white/5"
                  : "text-slate-500 hover:text-ink hover:bg-slate-100"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="demo-tab-indicator-unified"
                  className={`absolute inset-0 rounded-2xl border ${
                    isDark ? "bg-white/10 border-white/15" : "bg-white border-line shadow-xs"
                  }`}
                  transition={{ type: "spring", stiffness: 450, damping: 35 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <ProviderLogo provider={tab.id} size={16} />
                <span>{tab.label}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Content: Files List */}
      <div className="p-3 sm:p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="space-y-1"
          >
            {FILES[activeTab].map((file) => {
              const Icon = file.icon;
              return (
                <div
                  key={file.name}
                  className={`group flex items-center justify-between gap-3 rounded-2xl p-3 transition-colors ${
                    isDark ? "hover:bg-white/[0.04]" : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${file.iconBg} ${file.iconColor}`}>
                      <Icon size={17} strokeWidth={1.8} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold sm:text-sm">{file.name}</p>
                      <p className="text-[11px] text-muted">{file.type}</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="font-mono text-xs font-semibold text-muted tabular-nums">{file.size}</span>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Status Bar */}
      <div
        className={`flex items-center justify-between border-t px-5 py-3 text-[11px] transition-colors ${
          isDark ? "border-white/5 bg-black/40 text-slate-400" : "border-line bg-slate-50 text-slate-500"
        }`}
      >
        <span className="font-mono">4 items indexed</span>
        <span className="flex items-center gap-1.5 font-medium text-emerald-500">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Synchronized real-time
        </span>
      </div>
    </div>
  );
}
