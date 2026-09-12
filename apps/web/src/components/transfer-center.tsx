"use client";

import { useState } from "react";
import {
  X,
  ChevronDown,
  ChevronUp,
  ArrowLeftRight,
  CheckCircle2,
  FileIcon,
  Loader2,
} from "lucide-react";
import { useTransfers, TRANSFERS_API, type TransferDTO } from "@/lib/use-transfers";
import { formatBytes } from "@/lib/providers-meta";
import { useDashboardTheme } from "@/components/dashboard-theme-provider";

function speedOf(t: TransferDTO): string | null {
  if (!t.startedAt || t.status !== "processing" || t.bytesTransferred <= 0) return null;
  const secs = (Date.now() - new Date(t.startedAt).getTime()) / 1000;
  if (secs < 1) return null;
  return `${formatBytes(t.bytesTransferred / secs)}/s`;
}

function etaOf(t: TransferDTO): string | null {
  if (!t.startedAt || t.status !== "processing" || t.progressPercentage <= 0) return null;
  const secs = (Date.now() - new Date(t.startedAt).getTime()) / 1000;
  const remaining = (secs / t.progressPercentage) * (100 - t.progressPercentage);
  return `${Math.max(Math.round(remaining), 1)}s`;
}

async function cancel(id: string) {
  await fetch(TRANSFERS_API.cancel, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id }),
  });
}

export function TransferCenter() {
  const { items } = useTransfers(true);
  const [open, setOpen] = useState(true);
  const { isDark } = useDashboardTheme();

  const active = items.filter((j) => j.status === "pending" || j.status === "processing");
  const done = items.filter((j) => j.status === "completed").slice(0, 3);
  const errors = items.filter((j) => j.status === "error");

  if (active.length === 0 && done.length === 0 && errors.length === 0) return null;

  const avgProgress =
    active.length > 0
      ? Math.round(active.reduce((acc, it) => acc + it.progressPercentage, 0) / active.length)
      : 100;

  return (
    <aside
      aria-label="Pusat Transfer"
      className={`fixed bottom-5 right-5 z-40 w-88 max-w-[calc(100vw-2.5rem)] overflow-hidden rounded-3xl border shadow-2xl transition-all duration-200 ${
        isDark ? "border-white/10 bg-[#0D0F14] text-white" : "border-line bg-card text-ink shadow-xs"
      }`}
    >
      {/* Widget Header */}
      <div className={`border-b px-4 py-3 ${isDark ? "border-white/10 bg-[#0D0F14]" : "border-line bg-card"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ArrowLeftRight size={14} />
            </span>
            <div>
              <p className={`text-xs font-bold ${isDark ? "text-white" : "text-ink"}`}>
                {active.length > 0 ? `Uploading ${active.length} items` : "Transfer Selesai"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-primary tabular-nums">
              {active.length > 0 ? `${avgProgress}%` : "100%"}
            </span>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className={`rounded-lg p-1 transition ${isDark ? "text-slate-400 hover:bg-white/10 hover:text-white" : "text-slate-400 hover:bg-slate-100 hover:text-ink"}`}
              aria-label={open ? "Tutup rincian transfer" : "Buka rincian transfer"}
            >
              {open ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
            </button>
          </div>
        </div>

        {/* Global Progress Bar */}
        {active.length > 0 && (
          <div className={`mt-2.5 h-1.5 overflow-hidden rounded-full ${isDark ? "bg-white/10" : "bg-slate-100"}`}>
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-blue-400 transition-all duration-300"
              style={{ width: `${avgProgress}%` }}
            />
          </div>
        )}
      </div>

      {/* Widget Body */}
      {open && (
        <ul className={`max-h-80 overflow-y-auto divide-y p-1 ${isDark ? "divide-white/5" : "divide-line"}`}>
          {items.slice(0, 6).map((t) => (
            <li key={t.id} className={`p-3 rounded-2xl transition-colors ${isDark ? "hover:bg-white/[0.03]" : "hover:bg-slate-50"}`}>
              <div className="flex items-center gap-2.5">
                <div
                  className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border text-slate-400 ${
                    isDark ? "bg-white/5 border-white/10" : "bg-slate-50 border-line"
                  }`}
                >
                  <FileIcon size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-xs font-semibold ${isDark ? "text-white" : "text-ink"}`}>{t.sourceFileName}</p>
                  <p className={`text-[10px] font-mono tabular-nums ${isDark ? "text-slate-400" : "text-muted"}`}>
                    {formatBytes(t.bytesTransferred)} / {formatBytes(t.sourceFileSize)}
                  </p>
                </div>

                {t.status === "completed" && (
                  <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
                )}
                {t.status === "error" && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-rose-500">Failed</span>
                    <button
                      type="button"
                      onClick={() => cancel(t.id)}
                      className={`rounded-md p-1 ${isDark ? "text-slate-400 hover:bg-white/10 hover:text-white" : "text-slate-400 hover:bg-slate-100 hover:text-ink"}`}
                      title="Tutup"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
                {(t.status === "processing" || t.status === "pending") && (
                  <div className="flex items-center gap-1.5">
                    <Loader2 size={14} className="animate-spin text-primary" />
                    <button
                      type="button"
                      onClick={() => cancel(t.id)}
                      className="rounded-md p-1 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400"
                      title="Batalkan"
                    >
                      <X size={13} />
                    </button>
                  </div>
                )}
              </div>

              {t.status === "processing" && (
                <div className="mt-2 pl-10.5">
                  <div className={`h-1 overflow-hidden rounded-full ${isDark ? "bg-white/10" : "bg-slate-100"}`}>
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${t.progressPercentage}%` }}
                    />
                  </div>
                  <div className={`mt-1 flex justify-between font-mono text-[10px] tabular-nums ${isDark ? "text-slate-400" : "text-muted"}`}>
                    <span>{t.progressPercentage}%</span>
                    {speedOf(t) && <span>{speedOf(t)}</span>}
                    {etaOf(t) && <span>sisa {etaOf(t)}</span>}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
