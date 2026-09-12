import { RingGauge } from "@/components/ring-gauge";
import { PROVIDER_META, formatBytes } from "@/lib/providers-meta";
import { ProviderLogo } from "@/components/provider-logo";
import { useDashboardTheme } from "@/components/dashboard-theme-provider";
import type { SummaryAccount } from "@/lib/api";

export function StorageCard({
  account,
  isHighlighted = false,
}: {
  account: SummaryAccount;
  isHighlighted?: boolean;
}) {
  const meta = PROVIDER_META[account.provider];
  const pct = account.totalBytes > 0 ? (account.usedBytes / account.totalBytes) * 100 : 0;
  const { isDark } = useDashboardTheme();

  if (isHighlighted) {
    return (
      <div className="card-hover group relative overflow-hidden rounded-2xl border border-primary/50 bg-gradient-to-br from-primary to-blue-600 p-5 text-white shadow-md shadow-primary/20">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white p-2 shadow-md">
              <ProviderLogo provider={account.provider} size={26} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold tracking-tight text-white">{meta?.label ?? account.provider}</p>
              <p className="truncate text-xs text-blue-100 max-w-[130px]">{account.accountEmail ?? account.provider}</p>
            </div>
          </div>
          <RingGauge used={account.usedBytes} total={account.totalBytes} color="#ffffff" isWhite size={48} />
        </div>

        <div className="mt-5">
          <div className="flex items-baseline justify-between">
            <p className="font-mono text-sm font-bold tabular-nums text-white">
              {formatBytes(account.usedBytes)}{" "}
              <span className="text-xs font-normal text-blue-100">/ {formatBytes(account.totalBytes)}</span>
            </p>
            <p className="font-mono text-xs tabular-nums text-blue-100 font-semibold">{pct.toFixed(0)}%</p>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-white transition-all duration-500 ease-out"
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] text-blue-100 border-t border-white/20 pt-2.5">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-white/30" />
            Connected
          </span>
          <span className="text-[10px] font-mono">Sync OK</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`card-hover group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-5 shadow-2xs transition-all duration-200 ${
        isDark
          ? "border-white/10 bg-[#0D0F14] shadow-xl"
          : "border-line bg-card shadow-xs"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border p-2 shadow-2xs transition ${
              isDark ? "border-white/10 bg-white/5 group-hover:bg-white/10" : "border-line bg-slate-50 group-hover:bg-white"
            }`}
          >
            <ProviderLogo provider={account.provider} size={26} />
          </div>
          <div className="min-w-0">
            <p className={`text-sm font-bold tracking-tight ${isDark ? "text-white" : "text-ink"}`}>
              {meta?.label ?? account.provider}
            </p>
            <p className={`truncate text-xs max-w-[130px] ${isDark ? "text-slate-400" : "text-muted"}`}>
              {account.accountEmail ?? account.provider}
            </p>
          </div>
        </div>
        <RingGauge used={account.usedBytes} total={account.totalBytes} color={meta?.color ?? "#3758F9"} isDark={isDark} size={48} />
      </div>

      <div className="mt-5">
        <div className="flex items-baseline justify-between">
          <p className={`font-mono text-sm font-bold tabular-nums ${isDark ? "text-white" : "text-ink"}`}>
            {formatBytes(account.usedBytes)}{" "}
            <span className={`text-xs font-normal ${isDark ? "text-slate-400" : "text-muted"}`}>/ {formatBytes(account.totalBytes)}</span>
          </p>
          <p className={`font-mono text-xs tabular-nums font-semibold ${isDark ? "text-slate-300" : "text-slate-500"}`}>{pct.toFixed(0)}%</p>
        </div>
        <div className={`mt-2 h-1.5 overflow-hidden rounded-full ${isDark ? "bg-white/10" : "bg-slate-100"}`}>
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${Math.min(pct, 100)}%`,
              background: pct > 90 ? "#F43F5E" : pct > 80 ? "#F97316" : (meta?.color ?? "#3758F9"),
            }}
          />
        </div>
      </div>

      <div className={`mt-3 flex items-center justify-between text-[11px] border-t pt-2.5 ${isDark ? "text-slate-400 border-white/5" : "text-muted border-line/60"}`}>
        <span className={`inline-flex items-center gap-1.5 font-medium ${isDark ? "text-slate-300" : "text-slate-600"}`}>
          <span
            className={`h-2 w-2 rounded-full ${
              account.status === "active" ? "bg-emerald-400" : "bg-amber-400"
            }`}
          />
          {account.status === "active" ? "Connected" : account.status}
        </span>
        <span className="text-[10px] font-mono">Sync OK</span>
      </div>
    </div>
  );
}
