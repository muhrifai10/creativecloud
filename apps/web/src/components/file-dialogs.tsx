"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Share2, ExternalLink, Loader2, X } from "lucide-react";
import { formatBytes, PROVIDER_META } from "@/lib/providers-meta";
import { FileKindIcon } from "@/components/file-kind-icon";
import { ProviderLogo } from "@/components/provider-logo";
import { useDashboardTheme } from "@/components/dashboard-theme-provider";
import type { BrowseItem } from "@/components/explorer";

function useInvalidate() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["browse"] });
    qc.invalidateQueries({ queryKey: ["search"] });
    qc.invalidateQueries({ queryKey: ["summary"] });
  };
}

function DialogShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const { isDark } = useDashboardTheme();

  useEffect(() => {
    setMounted(true);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden
      />

      <div
        className={`relative z-10 w-full max-w-md rounded-3xl border p-6 shadow-2xl animate-fade-in-up transition-colors duration-200 ${
          isDark ? "border-white/10 bg-[#0D0F14] text-white" : "border-line bg-card text-ink"
        }`}
      >
        <div className="flex items-center justify-between">
          <h2 className={`text-base font-bold ${isDark ? "text-white" : "text-ink"}`}>{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className={`rounded-xl p-1.5 transition ${isDark ? "text-slate-400 hover:bg-white/10 hover:text-white" : "text-slate-400 hover:bg-slate-100 hover:text-ink"}`}
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function RenameDialog({ item, onClose }: { item: BrowseItem; onClose: () => void }) {
  const invalidate = useInvalidate();
  const { isDark } = useDashboardTheme();
  const [name, setName] = useState(item.name);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const inputCls = `w-full rounded-xl border px-3.5 py-2.5 text-xs outline-none transition placeholder:text-slate-500 focus:ring-2 focus:ring-primary/20 ${
    isDark ? "border-white/10 bg-white/5 text-white focus:border-primary/50 focus:bg-white/10" : "border-line bg-white text-ink focus:border-primary/40"
  }`;
  const btnGhost = `rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
    isDark ? "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10" : "border-line bg-white text-slate-600 hover:bg-slate-50"
  }`;
  const btnPrimary = `rounded-xl px-3.5 py-2 text-xs font-semibold bg-primary text-white hover:bg-blue-600 disabled:opacity-50 shadow-xs transition`;

  async function submit() {
    if (!name.trim() || name.trim() === item.name) {
      onClose();
      return;
    }
    setBusy(true);
    const res = await fetch("/api/files/rename", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ accountId: item.accountId, itemId: item.id, newName: name.trim() }),
    });
    const errMsg = !res.ok ? ((await res.json().catch(() => null)) as { error?: string } | null)?.error ?? `Gagal (${res.status}).` : null;
    setBusy(false);
    if (errMsg) {
      setErr(errMsg);
      return;
    }
    invalidate();
    onClose();
  }

  return (
    <DialogShell title="Ubah Nama Berkas" onClose={onClose}>
      <input autoFocus value={name} onChange={(e) => setName(e.target.value)} className={`mt-4 ${inputCls}`} />
      {err && <p className="mt-2 text-xs text-rose-500">{err}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" className={btnGhost} onClick={onClose}>
          Batal
        </button>
        <button type="button" className={btnPrimary} onClick={submit} disabled={busy}>
          {busy ? "Menyimpan..." : "Simpan"}
        </button>
      </div>
    </DialogShell>
  );
}

export function NewFolderDialog({ accountId, folderId, onClose }: { accountId: string; folderId: string; onClose: () => void }) {
  const invalidate = useInvalidate();
  const { isDark } = useDashboardTheme();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const inputCls = `w-full rounded-xl border px-3.5 py-2.5 text-xs outline-none transition placeholder:text-slate-500 focus:ring-2 focus:ring-primary/20 ${
    isDark ? "border-white/10 bg-white/5 text-white focus:border-primary/50 focus:bg-white/10" : "border-line bg-white text-ink focus:border-primary/40"
  }`;
  const btnGhost = `rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
    isDark ? "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10" : "border-line bg-white text-slate-600 hover:bg-slate-50"
  }`;
  const btnPrimary = `rounded-xl px-3.5 py-2 text-xs font-semibold bg-primary text-white hover:bg-blue-600 disabled:opacity-50 shadow-xs transition`;

  async function submit() {
    if (!name.trim()) return;
    setBusy(true);
    const res = await fetch("/api/files/folder", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ accountId, name: name.trim(), parentId: folderId }),
    });
    const errMsg = !res.ok ? ((await res.json().catch(() => null)) as { error?: string } | null)?.error ?? `Gagal (${res.status}).` : null;
    setBusy(false);
    if (errMsg) {
      setErr(errMsg);
      return;
    }
    invalidate();
    onClose();
  }

  return (
    <DialogShell title="Folder Baru" onClose={onClose}>
      <input autoFocus placeholder="Nama folder baru" value={name} onChange={(e) => setName(e.target.value)} className={`mt-4 ${inputCls}`} />
      {err && <p className="mt-2 text-xs text-rose-500">{err}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" className={btnGhost} onClick={onClose}>
          Batal
        </button>
        <button type="button" className={btnPrimary} onClick={submit} disabled={busy || !name.trim()}>
          {busy ? "Membuat..." : "Buat Folder"}
        </button>
      </div>
    </DialogShell>
  );
}

export function ConfirmDeleteDialog({ item, onClose }: { item: BrowseItem; onClose: () => void }) {
  const invalidate = useInvalidate();
  const { isDark } = useDashboardTheme();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    const usp = new URLSearchParams({ accountId: item.accountId, itemId: item.id });
    const res = await fetch(`/api/files/delete?${usp}`, { method: "DELETE" });
    const errMsg = !res.ok ? ((await res.json().catch(() => null)) as { error?: string } | null)?.error ?? `Gagal (${res.status}).` : null;
    setBusy(false);
    if (errMsg) {
      setErr(errMsg);
      return;
    }
    invalidate();
    onClose();
  }

  const btnGhost = `rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
    isDark ? "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10" : "border-line bg-white text-slate-600 hover:bg-slate-50"
  }`;

  return (
    <DialogShell title="Hapus Berkas / Folder" onClose={onClose}>
      <p className={`mt-3 text-xs leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
        Apakah Anda yakin ingin menghapus <strong className={`font-semibold ${isDark ? "text-white" : "text-ink"}`}>&quot;{item.name}&quot;</strong> dari akun cloud? Tindakan ini permanen.
      </p>
      {err && <p className="mt-2 text-xs text-rose-500">{err}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" className={btnGhost} onClick={onClose}>
          Batal
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={busy}
          className="rounded-xl bg-rose-500 px-3.5 py-2 text-xs font-semibold text-white hover:bg-rose-600 disabled:opacity-50 shadow-xs transition"
        >
          {busy ? "Menghapus..." : "Ya, Hapus"}
        </button>
      </div>
    </DialogShell>
  );
}

export function ShareDialog({ item, onClose }: { item: BrowseItem; onClose: () => void }) {
  const [loadingPublic, setLoadingPublic] = useState(true);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [copiedPublic, setCopiedPublic] = useState(false);
  const [copiedStream, setCopiedStream] = useState(false);
  const { isDark } = useDashboardTheme();

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const directStreamUrl = `${origin}/api/files/stream?accountId=${item.accountId}&fileId=${item.id}`;

  const providerMeta = PROVIDER_META[item.provider];
  const providerLabel = providerMeta?.label ?? item.provider;

  useEffect(() => {
    let alive = true;
    fetch(`/api/files/share?accountId=${item.accountId}&fileId=${encodeURIComponent(item.id)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (alive && data?.publicUrl) {
          setPublicUrl(data.publicUrl);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoadingPublic(false);
      });
    return () => {
      alive = false;
    };
  }, [item.accountId, item.id]);

  const copyPublic = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopiedPublic(true);
      setTimeout(() => setCopiedPublic(false), 2500);
    } catch {
      // ignore
    }
  };

  const copyStream = async () => {
    try {
      await navigator.clipboard.writeText(directStreamUrl);
      setCopiedStream(true);
      setTimeout(() => setCopiedStream(false), 2500);
    } catch {
      // ignore
    }
  };

  const nativeShare = async () => {
    const urlToShare = publicUrl || directStreamUrl;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: item.name,
          text: `Unduh berkas "${item.name}" dari ${providerLabel}`,
          url: urlToShare,
        });
      } catch {
        // user cancel
      }
    }
  };

  return (
    <DialogShell title="Bagikan Berkas" onClose={onClose}>
      <div className="mt-4 space-y-4">
        {/* File Preview Chip */}
        <div
          className={`flex items-center gap-3 rounded-2xl border p-3 ${isDark ? "border-white/10 bg-white/5" : "border-line bg-slate-50"}`}
        >
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-2xs ${
              isDark ? "bg-white/5 border-white/10" : "bg-white border-line"
            }`}
          >
            <FileKindIcon kind={item.kind} size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className={`truncate text-xs font-bold ${isDark ? "text-white" : "text-ink"}`}>{item.name}</p>
            <p className={`text-[10px] ${isDark ? "text-slate-400" : "text-muted"}`}>
              {item.isFolder ? "Folder" : formatBytes(item.sizeBytes)} • {providerLabel}
            </p>
          </div>
          <div
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border p-1 shadow-2xs ${
              isDark ? "bg-white/5 border-white/10" : "bg-white border-line"
            }`}
          >
            <ProviderLogo provider={item.provider} size={16} />
          </div>
        </div>

        {/* Section 1: Official Cloud Public Link */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className={`text-xs font-bold ${isDark ? "text-white" : "text-ink"}`}>Tautan Publik Resmi {providerLabel}</label>
            {publicUrl && (
              <a
                href={publicUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
              >
                <span>Buka di {providerLabel}</span>
                <ExternalLink size={12} />
              </a>
            )}
          </div>

          {loadingPublic ? (
            <div
              className={`flex items-center gap-2 rounded-xl border p-3 text-xs ${isDark ? "border-white/10 bg-white/5 text-slate-400" : "border-line bg-slate-50 text-slate-500"}`}
            >
              <Loader2 size={14} className="animate-spin text-primary" />
              <span>Membuat tautan publik resmi dari {providerLabel}...</span>
            </div>
          ) : publicUrl ? (
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={publicUrl}
                className={`w-full rounded-xl border px-3 py-2 text-[11px] font-mono outline-none select-all ${
                  isDark ? "border-white/10 bg-white/5 text-slate-200 focus:border-primary/40" : "border-line bg-slate-50 text-slate-700"
                }`}
              />
              <button
                type="button"
                onClick={copyPublic}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold shadow-xs transition ${
                  copiedPublic ? "bg-emerald-600 text-white" : "bg-primary text-white hover:bg-blue-600"
                }`}
              >
                {copiedPublic ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedPublic ? "Disalin!" : "Salin Link"}</span>
              </button>
            </div>
          ) : (
            <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Tautan publik langsung tidak tersedia untuk penyedia ini. Gunakan tautan streaming di bawah.
            </p>
          )}
        </div>

        {/* Section 2: Direct Stream Link */}
        <div>
          <label className={`mb-1.5 block text-xs font-semibold ${isDark ? "text-white" : "text-ink"}`}>Tautan Streaming Creative Drive</label>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={directStreamUrl}
              className={`w-full rounded-xl border px-3 py-2 text-[11px] font-mono outline-none select-all ${
                isDark ? "border-white/10 bg-white/5 text-slate-300" : "border-line bg-slate-50 text-slate-600"
              }`}
            />
            <button
              type="button"
              onClick={copyStream}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition shadow-2xs ${
                isDark
                  ? "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                  : "border-line bg-white text-slate-700 hover:bg-slate-50"
              } ${copiedStream ? "text-emerald-500 border-emerald-500/40" : ""}`}
            >
              {copiedStream ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedStream ? "Disalin!" : "Salin"}</span>
            </button>
          </div>
        </div>

        {/* Security Info */}
        <div
          className={`rounded-xl border p-3 text-xs ${isDark ? "border-emerald-500/20 bg-emerald-950/20 text-emerald-300" : "border-emerald-100 bg-emerald-50 text-emerald-800"}`}
        >
          <p className="font-semibold">Tautan Siap Dibagikan</p>
          <p className={`mt-0.5 text-[11px] leading-relaxed ${isDark ? "text-emerald-400/80" : "text-emerald-700"}`}>
            Penerima tautan dapat langsung mengunduh berkas tanpa perlu login ke akun cloud Anda.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-1">
          {typeof navigator !== "undefined" && typeof navigator.share === "function" ? (
            <button
              type="button"
              onClick={nativeShare}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
            >
              <Share2 size={13} />
              <span>Bagikan ke Aplikasi</span>
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={onClose}
            className={`rounded-xl border px-4 py-2 text-xs font-semibold transition ${
              isDark ? "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10" : "border-line bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            Tutup
          </button>
        </div>
      </div>
    </DialogShell>
  );
}
