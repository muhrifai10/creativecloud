"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { PROVIDER_META } from "@/lib/providers-meta";
import { ProviderLogo } from "@/components/provider-logo";
import { useDashboardTheme } from "@/components/dashboard-theme-provider";
import { ArrowUpRight, Lock, X } from "lucide-react";

type CredProvider = "mega" | "pcloud";

export function ConnectPanel() {
  const router = useRouter();
  const { isDark } = useDashboardTheme();
  const [target, setTarget] = useState<CredProvider | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const inputClass = `w-full rounded-2xl border px-4 py-3 text-sm outline-none transition placeholder:text-slate-500 focus:ring-2 focus:ring-primary/20 ${
    isDark
      ? "border-white/10 bg-white/5 text-white focus:border-primary/50 focus:bg-white/10"
      : "border-line bg-white text-ink focus:border-primary/40 focus:bg-white"
  }`;

  useEffect(() => {
    setMounted(true);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setTarget(null);
        setError(null);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function open(provider: CredProvider) {
    setTarget(provider);
    setError(null);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!target) return;
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const payload =
      target === "mega"
        ? { provider: "mega", email: form.get("email"), password: form.get("password") }
        : { provider: "pcloud", token: form.get("token"), region: form.get("region") };

    const res = await fetch("/api/credentials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    setBusy(false);
    if (!res.ok) {
      setError(data?.error ?? "Koneksi gagal.");
      return;
    }
    setTarget(null);
    router.refresh();
  }

  return (
    <>
      <div className="mt-5 grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
        {Object.entries(PROVIDER_META).map(([id, meta]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              if (meta.kind === "oauth") window.location.href = `/api/oauth/${id}/connect`;
              else open(id as CredProvider);
            }}
            className={`card-hover group relative flex flex-col justify-between rounded-2xl border p-5 text-left shadow-xs transition-all duration-200 ${
              isDark
                ? "border-white/10 bg-[#0D0F14] hover:border-primary/40 shadow-xl"
                : "border-line bg-card hover:border-primary/30 shadow-2xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border p-2 shadow-xs transition-all group-hover:scale-105 ${
                  isDark ? "border-white/10 bg-white/5 group-hover:bg-white/10" : "border-line bg-slate-50 group-hover:bg-white"
                }`}
              >
                <ProviderLogo provider={id} size={28} />
              </div>
              <ArrowUpRight size={16} className={`${isDark ? "text-slate-400" : "text-slate-300"} transition-colors group-hover:text-primary`} />
            </div>

            <div className="mt-4">
              <p className={`text-sm font-bold tracking-tight ${isDark ? "text-white" : "text-ink"}`}>{meta.label}</p>
              <p className={`mt-0.5 text-[11px] font-medium ${isDark ? "text-slate-400" : "text-muted"}`}>
                {meta.kind === "oauth" ? "Koneksi OAuth 2.0" : "Kredensial API"}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Centered Modal Overlay via Portal */}
      {target &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
              onClick={() => {
                setTarget(null);
                setError(null);
              }}
              aria-hidden
            />

            {/* Modal Box */}
            <div
              className={`relative z-10 w-full max-w-sm rounded-3xl border p-6 shadow-2xl animate-fade-in-up transition-colors duration-200 ${
                isDark ? "border-white/10 bg-[#0D0F14] text-white" : "border-line bg-card text-ink"
              }`}
            >
              <div className={`flex items-center justify-between border-b pb-4 ${isDark ? "border-white/10" : "border-line"}`}>
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border p-1.5 shadow-xs ${
                      isDark ? "border-white/10 bg-white/5" : "border-line bg-slate-50"
                    }`}
                  >
                    <ProviderLogo provider={target} size={24} />
                  </div>
                  <h3 className={`text-base font-bold ${isDark ? "text-white" : "text-ink"}`}>
                    Hubungkan {PROVIDER_META[target]?.label}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTarget(null);
                    setError(null);
                  }}
                  className={`rounded-xl p-1.5 transition ${isDark ? "text-slate-400 hover:bg-white/10 hover:text-white" : "text-slate-400 hover:bg-slate-100 hover:text-ink"}`}
                  aria-label="Tutup"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={onSubmit} className="mt-5 space-y-3.5">
                {target === "mega" ? (
                  <>
                    <div>
                      <label className={`mb-1 block text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-600"}`}>Email Akun MEGA</label>
                      <input name="email" type="email" required placeholder="nama@email.com" className={inputClass} />
                    </div>
                    <div>
                      <label className={`mb-1 block text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-600"}`}>Password</label>
                      <input name="password" type="password" required placeholder="••••••••" className={inputClass} />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className={`mb-1 block text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-600"}`}>pCloud API Token</label>
                      <input name="token" required placeholder="Masukkan token pCloud" className={inputClass} />
                    </div>
                    <div>
                      <label className={`mb-1 block text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-600"}`}>Region Server</label>
                      <select name="region" className={inputClass} defaultValue="us">
                        <option value="us" className={isDark ? "bg-[#0D0F14] text-white" : "bg-white text-ink"}>Server US (United States)</option>
                        <option value="eu" className={isDark ? "bg-[#0D0F14] text-white" : "bg-white text-ink"}>Server EU (Europe)</option>
                      </select>
                    </div>
                  </>
                )}

                {error && (
                  <p role="alert" className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-400">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="mt-2 w-full rounded-2xl bg-primary py-3 text-xs font-bold text-white shadow-sm transition hover:bg-blue-600 disabled:opacity-50"
                >
                  {busy ? "Memverifikasi koneksi..." : "Hubungkan Akun"}
                </button>

                <div className={`flex items-center justify-center gap-1.5 pt-1 text-[11px] ${isDark ? "text-slate-400" : "text-muted"}`}>
                  <Lock size={12} />
                  <span>Kredensial dienkripsi AES-256-GCM di vault lokal.</span>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
