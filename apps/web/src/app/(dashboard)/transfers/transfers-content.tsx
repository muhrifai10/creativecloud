"use client";

import { useDashboardTheme } from "@/components/dashboard-theme-provider";
import { TransfersHistory } from "@/components/transfers-history";
import { SyncManager } from "@/components/sync-manager";

export function TransfersContent({ accounts }: { accounts: { id: string; provider: string; label: string }[] }) {
  const { isDark } = useDashboardTheme();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className={`text-2xl font-bold tracking-tight sm:text-[28px] ${isDark ? "text-white" : "text-[#151B27]"}`}>
          Pusat Aktivitas
        </h1>
        <p className={`mt-1 text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Riwayat pemindahan lintas cloud dan jadwal sinkronisasi.</p>
      </div>
      <TransfersHistory />
      <SyncManager accounts={accounts} />
    </div>
  );
}
