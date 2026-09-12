"use client";

import { useDashboardTheme } from "@/components/dashboard-theme-provider";
import { ConnectPanel } from "./connect-panel";
import { AccountRow } from "./account-row";
import type { AccountDTO } from "./account-row";

export function AccountsContent({ accounts }: { accounts: AccountDTO[] }) {
  const { isDark } = useDashboardTheme();

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Header */}
      <div>
        <h1 className={`text-2xl font-bold tracking-tight sm:text-3xl ${isDark ? "text-white" : "text-[#151B27]"}`}>
          Akun Cloud
        </h1>
        <p className={`mt-1 text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          Hubungkan dan sinkronisasikan berbagai penyedia penyimpanan cloud dalam satu kendali aman.
        </p>
      </div>

      {/* Connect New Provider */}
      <section
        className={`rounded-2xl border p-6 shadow-xs sm:p-7 transition-colors duration-200 ${
          isDark ? "border-white/10 bg-[#0D0F14] shadow-xl" : "border-line bg-card"
        }`}
      >
        <div className="mb-2">
          <h2 className={`text-lg font-bold tracking-tight ${isDark ? "text-white" : "text-ink"}`}>Hubungkan Akun Baru</h2>
          <p className={`text-xs ${isDark ? "text-slate-400" : "text-muted"}`}>Pilih penyedia cloud untuk otorisasi OAuth atau kredensial API</p>
        </div>
        <ConnectPanel />
      </section>

      {/* Connected Accounts */}
      <section className="space-y-4">
        <div>
          <h2 className={`text-lg font-bold tracking-tight ${isDark ? "text-white" : "text-ink"}`}>Akun Terhubung</h2>
          <p className={`text-xs ${isDark ? "text-slate-400" : "text-muted"}`}>Daftar penyimpanan yang saat ini aktif dan tersinkronisasi</p>
        </div>

        {accounts.length === 0 ? (
          <div
            className={`rounded-2xl border border-dashed p-10 text-center transition-colors ${
              isDark ? "border-white/10 bg-[#0D0F14]/60" : "border-line bg-card/60"
            }`}
          >
            <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-ink"}`}>Belum ada akun cloud yang terhubung</p>
            <p className={`mt-1 text-xs ${isDark ? "text-slate-400" : "text-muted"}`}>
              Pilih salah satu penyedia di atas untuk mulai menghubungkan drive Anda.
            </p>
          </div>
        ) : (
          <ul className="space-y-3.5">
            {accounts.map((acc) => (
              <AccountRow key={acc.id} account={acc} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
