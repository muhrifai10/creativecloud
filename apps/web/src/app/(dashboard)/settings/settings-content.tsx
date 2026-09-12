"use client";

import { useDashboardTheme } from "@/components/dashboard-theme-provider";
import { SyncManager } from "@/components/sync-manager";

export function SettingsContent({ accounts }: { accounts: { id: string; provider: string; label: string }[] }) {
  const { isDark } = useDashboardTheme();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className={`text-2xl font-bold tracking-tight sm:text-[28px] ${isDark ? "text-white" : "text-[#151B27]"}`}>
          Pengaturan
        </h1>
        <p className={`mt-1 text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Preferensi akun, keamanan, dan penjadwalan mirror cloud.</p>
      </div>
      <section
        className={`rounded-2xl border p-6 shadow-xs transition-colors duration-200 ${
          isDark ? "border-white/10 bg-[#0D0F14] shadow-xl" : "border-line bg-card"
        }`}
      >
        <h2 className={`text-sm font-bold ${isDark ? "text-white" : "text-ink"}`}>Akun & Keamanan</h2>
        <p className={`mt-1 text-xs ${isDark ? "text-slate-400" : "text-muted"}`}>Ubah password dan manajemen sesi terenkripsi vault.</p>
      </section>
      <div>
        <SyncManager accounts={accounts} />
      </div>
    </div>
  );
}
