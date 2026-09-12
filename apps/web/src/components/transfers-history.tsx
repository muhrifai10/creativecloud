"use client";

import { useTransfers } from "@/lib/use-transfers";
import { PROVIDER_META, formatBytes } from "@/lib/providers-meta";
import { useDashboardTheme } from "@/components/dashboard-theme-provider";

const STATUS_STYLE_DARK: Record<string, string> = {
  completed: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  processing: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  pending: "bg-white/5 text-slate-400 border border-white/10",
  failed: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
  cancelled: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
};

const STATUS_STYLE_LIGHT: Record<string, string> = {
  completed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  processing: "bg-blue-50 text-blue-700 border border-blue-200",
  pending: "bg-slate-100 text-slate-600 border border-slate-200",
  failed: "bg-rose-50 text-rose-700 border border-rose-200",
  cancelled: "bg-amber-50 text-amber-700 border border-amber-200",
};

export function TransfersHistory() {
  const { items } = useTransfers(false, 5000);
  const { isDark } = useDashboardTheme();
  const STATUS_STYLE = isDark ? STATUS_STYLE_DARK : STATUS_STYLE_LIGHT;

  if (items.length === 0) {
    return (
      <div
        className={`rounded-2xl border border-dashed p-12 text-center transition-colors ${
          isDark ? "border-white/10 bg-[#0D0F14] text-white" : "border-line bg-card text-ink"
        }`}
      >
        <p className="text-sm font-medium">Belum ada aktivitas transfer</p>
        <p className={`mt-1 text-sm ${isDark ? "text-slate-400" : "text-muted"}`}>Kirim berkas lintas cloud lewat menu aksi di File Manager.</p>
      </div>
    );
  }

  return (
    <div
      className={`overflow-hidden rounded-2xl border shadow-xs transition-colors ${
        isDark ? "border-white/10 bg-[#0D0F14] text-white shadow-xl" : "border-line bg-card text-ink"
      }`}
    >
      <table className="w-full text-left text-sm">
        <thead>
          <tr
            className={`border-b text-xs uppercase tracking-wide ${
              isDark ? "border-white/10 bg-white/[0.02] text-slate-400" : "border-line bg-slate-50 text-slate-500"
            }`}
          >
            <th className="px-4 py-3 font-semibold">Berkas</th>
            <th className="px-4 py-3 font-semibold">Rute</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 text-right font-semibold">Ukuran</th>
          </tr>
        </thead>
        <tbody className={`divide-y ${isDark ? "divide-white/5" : "divide-line"}`}>
          {items.map((t) => (
            <tr key={t.id} className={`transition ${isDark ? "hover:bg-white/[0.03]" : "hover:bg-slate-50"}`}>
              <td className={`max-w-[220px] truncate px-4 py-3 font-medium ${isDark ? "text-white" : "text-ink"}`}>{t.sourceFileName}</td>
              <td className={`px-4 py-3 text-xs ${isDark ? "text-slate-400" : "text-muted"}`}>
                {PROVIDER_META[t.sourceProvider]?.label ?? t.sourceProvider} → {PROVIDER_META[t.targetProvider]?.label ?? t.targetProvider}
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[t.status] ?? ""}`}>
                  {t.status}
                  {(t.status === "processing" || t.status === "pending") && (
                    <span className="font-mono tabular-nums">{t.progressPercentage}%</span>
                  )}
                </span>
              </td>
              <td className={`px-4 py-3 text-right font-mono text-xs tabular-nums ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                {formatBytes(t.bytesTransferred || t.sourceFileSize)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
