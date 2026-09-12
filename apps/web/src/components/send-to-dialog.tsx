"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeftRight, X } from "lucide-react";
import { PROVIDER_META, formatBytes } from "@/lib/providers-meta";
import { useDashboardTheme } from "@/components/dashboard-theme-provider";
import type { BrowseItem } from "@/components/explorer";

export function SendToDialog({
  item,
  accounts,
  onClose,
}: {
  item: BrowseItem;
  accounts: { id: string; provider: string; label: string }[];
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const { isDark } = useDashboardTheme();
  const others = accounts.filter((a) => a.id !== item.accountId);
  const [target, setTarget] = useState(others[0]?.id ?? "");
  const [folder, setFolder] = useState("root");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function send() {
    if (!target) return;
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/transfers", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sourceAccountId: item.accountId,
        sourceFileId: item.id,
        sourceFileName: item.name,
        sourceFileSize: item.sizeBytes,
        sourceProvider: item.provider,
        targetAccountId: target,
        targetFolderId: folder || "root",
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const b = (await res.json().catch(() => null)) as { error?: string } | null;
      setMsg(b?.error ?? "Gagal memulai transfer.");
      return;
    }
    qc.invalidateQueries({ queryKey: ["transfers"] });
    onClose();
  }

  if (!mounted) return null;

  const inputCls = `w-full rounded-xl border px-3.5 py-2.5 text-xs outline-none transition ${
    isDark
      ? "border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:border-primary/50 focus:bg-white/10"
      : "border-line bg-white text-ink placeholder:text-slate-400 focus:border-primary/40"
  }`;
  const labelCls = `mb-1 block text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-600"}`;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden
      />

      <div
        className={`relative z-10 w-full max-w-sm rounded-3xl border p-6 shadow-2xl animate-fade-in-up transition-colors duration-200 ${
          isDark ? "border-white/10 bg-[#0D0F14] text-white" : "border-line bg-card text-ink"
        }`}
      >
        <div className="flex items-center justify-between">
          <h2 className={`flex items-center gap-2 text-base font-bold ${isDark ? "text-white" : "text-ink"}`}>
            <ArrowLeftRight size={16} className={isDark ? "text-blue-400" : "text-primary"} />
            <span>Kirim ke Cloud Lain</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className={`rounded-xl p-1.5 transition ${isDark ? "text-slate-400 hover:bg-white/10 hover:text-white" : "text-slate-400 hover:bg-slate-100 hover:text-ink"}`}
          >
            <X size={16} />
          </button>
        </div>

        <p className={`mt-1 text-xs ${isDark ? "text-slate-400" : "text-muted"}`}>
          <span className={`font-semibold ${isDark ? "text-white" : "text-ink"}`}>{item.name}</span> • {formatBytes(item.sizeBytes)}
        </p>

        {others.length === 0 ? (
          <p
            className={`mt-4 rounded-2xl border p-3.5 text-xs leading-relaxed ${isDark ? "border-white/10 bg-white/5 text-slate-400" : "border-line bg-slate-50 text-muted"}`}
          >
            Hubungkan akun cloud lain terlebih dahulu melalui menu Akun Cloud untuk mengirim berkas.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            <label className="block">
              <span className={labelCls}>Akun Tujuan</span>
              <select value={target} onChange={(e) => setTarget(e.target.value)} className={inputCls}>
                {others.map((a) => (
                  <option key={a.id} value={a.id} className={isDark ? "bg-[#0D0F14] text-white" : "bg-white text-ink"}>
                    {PROVIDER_META[a.provider]?.label ?? a.label} • {a.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className={labelCls}>ID Folder Tujuan (Opsional)</span>
              <input value={folder} onChange={(e) => setFolder(e.target.value)} className={inputCls} placeholder="root" />
            </label>

            {msg && <p className="text-xs text-rose-500 font-medium">{msg}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className={`rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
                  isDark ? "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10" : "border-line bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={send}
                disabled={busy || !target}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-blue-600 disabled:opacity-50 transition shadow-xs"
              >
                {busy ? "Mengantrekan..." : "Mulai Transfer"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
