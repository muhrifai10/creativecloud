"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PROVIDER_META, formatBytes } from "@/lib/providers-meta";
import { ProviderLogo } from "@/components/provider-logo";
import { RingGauge } from "@/components/ring-gauge";
import { useDashboardTheme } from "@/components/dashboard-theme-provider";

export interface AccountDTO {
  id: string;
  provider: string;
  accountEmail: string;
  accountName: string | null;
  status: string;
  totalBytes: number;
  usedBytes: number;
  lastSyncedAt: string | null;
}

export function AccountRow({ account }: { account: AccountDTO }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const meta = PROVIDER_META[account.provider];
  const pct = account.totalBytes > 0 ? Math.min((account.usedBytes / account.totalBytes) * 100, 100) : 0;
  const { isDark } = useDashboardTheme();

  async function disconnect() {
    await fetch(`/api/accounts?id=${account.id}`, { method: "DELETE" });
    startTransition(() => router.refresh());
  }

  return (
    <li
      className={`card-hover flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border p-5 shadow-xs transition-all duration-200 ${
        isDark ? "border-white/10 bg-[#0D0F14] shadow-xl" : "border-line bg-card"
      }`}
    >
      {/* Left: Provider Icon & Identity */}
      <div className="flex items-center gap-3.5">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border p-2 shadow-xs ${
            isDark ? "border-white/10 bg-white/5" : "border-line bg-slate-50"
          }`}
        >
          <ProviderLogo provider={account.provider} size={28} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={`text-base font-bold ${isDark ? "text-white" : "text-ink"}`}>{meta?.label ?? account.provider}</h3>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                account.status === "active"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  account.status === "active" ? "bg-emerald-400" : "bg-amber-400"
                }`}
              />
              {account.status === "active" ? "Connected" : account.status}
            </span>
          </div>
          <p className={`truncate text-xs max-w-[220px] sm:max-w-xs ${isDark ? "text-slate-400" : "text-muted"}`}>
            {account.accountEmail}
          </p>
        </div>
      </div>

      {/* Middle & Right: Storage Bar + Circular Gauge + Action */}
      <div className="flex flex-wrap items-center gap-4 sm:gap-6">
        {/* Horizontal Storage Bar */}
        <div className="w-full sm:w-48">
          <div className="flex justify-between font-mono text-xs tabular-nums">
            <span className={`font-bold ${isDark ? "text-white" : "text-ink"}`}>{formatBytes(account.usedBytes)}</span>
            <span className={isDark ? "text-slate-500" : "text-muted"}>/ {formatBytes(account.totalBytes)}</span>
          </div>
          <div className={`mt-2 h-2 overflow-hidden rounded-full ${isDark ? "bg-white/10" : "bg-slate-100"}`}>
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${pct}%`,
                background: pct > 90 ? "#F43F5E" : pct > 80 ? "#F97316" : (meta?.color ?? "#3758F9"),
              }}
            />
          </div>
          <p className={`mt-1 text-right font-mono text-[10px] tabular-nums ${isDark ? "text-slate-400" : "text-muted"}`}>
            {pct.toFixed(1)}% terpakai
          </p>
        </div>

        {/* Circular Gauge */}
        <div className="hidden md:block">
          <RingGauge
            used={account.usedBytes}
            total={account.totalBytes}
            color={meta?.color ?? "#3758F9"}
            isDark={isDark}
            size={46}
          />
        </div>

        {/* Action Button */}
        <div>
          {confirming ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={disconnect}
                disabled={pending}
                className="rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50"
              >
                {pending ? "Memutuskan..." : "Ya, Putuskan"}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                  isDark ? "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10" : "border-line bg-card text-slate-600 hover:bg-slate-50"
                }`}
              >
                Batal
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className={`rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all ${
                isDark
                  ? "border-white/10 bg-white/5 text-slate-300 hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-400"
                  : "border-line bg-card text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
              }`}
            >
              Putuskan
            </button>
          )}
        </div>
      </div>
    </li>
  );
}
