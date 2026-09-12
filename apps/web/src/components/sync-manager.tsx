"use client";

import { useState } from "react";
import { z } from "zod";
import { Plus, Trash2, RefreshCw, Clock } from "lucide-react";
import { PROVIDER_META } from "@/lib/providers-meta";
import { useDashboardTheme } from "@/components/dashboard-theme-provider";

const uuid = z.string().uuid();
const createSchema = z.object({
  sourceAccountId: uuid,
  sourceFolderId: z.string().min(1),
  targetAccountId: uuid,
  targetFolderId: z.string().min(1),
  syncDirection: z.enum(["one_way", "two_way", "mirror"]),
  cron: z.string().min(1),
});

const CRON_PRESETS = [
  { label: "Tiap jam", value: "0 * * * *" },
  { label: "Harian 02:00", value: "0 2 * * *" },
  { label: "Mingguan Sen 03:00", value: "0 3 * * 1" },
];

export function SyncManager({
  accounts,
}: {
  accounts: { id: string; provider: string; label: string }[];
}) {
  const { isDark } = useDashboardTheme();
  const [rows, setRows] = useState<{ id: string; sourceProvider: string; targetProvider: string; sourceFolderId: string; targetFolderId: string; cron: string; lastRunAt: string | null }[]>([]);
  const [src, setSrc] = useState(accounts[0]?.id ?? "");
  const [dst, setDst] = useState(accounts[1]?.id ?? "");
  const [srcFolder, setSrcFolder] = useState("root");
  const [dstFolder, setDstFolder] = useState("root");
  const [dir, setDir] = useState<"one_way" | "two_way" | "mirror">("mirror");
  const [cron, setCron] = useState("0 2 * * *");
  const [msg, setMsg] = useState<string | null>(null);

  const inpCls = `w-full rounded-xl border px-3 py-2 text-xs outline-none transition placeholder:text-slate-500 ${
    isDark ? "border-white/10 bg-white/5 text-white focus:border-primary/50 focus:bg-white/10" : "border-line bg-white text-ink focus:border-primary/40"
  }`;
  const selCls = `w-full rounded-xl border px-3 py-2 text-xs outline-none transition ${
    isDark ? "border-white/10 bg-white/5 text-white focus:border-primary/50" : "border-line bg-white text-ink focus:border-primary/40"
  }`;

  async function reload() {
    const r = await fetch("/api/sync");
    const j = (await r.json()) as { schedules?: typeof rows };
    setRows(j.schedules ?? []);
  }

  async function create() {
    setMsg(null);
    const parsed = createSchema.safeParse({
      sourceAccountId: src,
      sourceFolderId: srcFolder || "root",
      targetAccountId: dst,
      targetFolderId: dstFolder || "root",
      syncDirection: dir,
      cron,
    });
    if (!parsed.success) {
      setMsg("Periksa data jadwal.");
      return;
    }
    const res = await fetch("/api/sync", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    if (!res.ok) {
      setMsg((await res.json().catch(() => null))?.error ?? "Gagal membuat jadwal.");
      return;
    }
    await reload();
  }

  async function remove(id: string) {
    await fetch(`/api/sync?id=${id}`, { method: "DELETE" });
    await reload();
  }

  return (
    <section
      className={`rounded-2xl border p-6 shadow-xs transition-colors duration-200 ${
        isDark ? "border-white/10 bg-[#0D0F14] text-white shadow-xl" : "border-line bg-card text-ink"
      }`}
    >
      <div className="flex items-center justify-between">
        <h2 className={`text-sm font-bold ${isDark ? "text-white" : "text-ink"}`}>Jadwal Sinkronisasi Folder</h2>
        <button
          type="button"
          onClick={reload}
          className={`rounded-lg p-1.5 transition ${isDark ? "text-slate-400 hover:bg-white/10 hover:text-white" : "text-slate-400 hover:bg-slate-100 hover:text-ink"}`}
          aria-label="Muat ulang"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {accounts.length < 2 ? (
        <p className={`mt-3 text-xs ${isDark ? "text-slate-400" : "text-muted"}`}>Butuh minimal 2 akun terhubung untuk mengatur mirror antar-cloud.</p>
      ) : (
        <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
          <Field label="Sumber" isDark={isDark}>
            <select value={src} onChange={(e) => setSrc(e.target.value)} className={selCls}>
              {accounts.map((a) => (
                <option key={a.id} value={a.id} className={isDark ? "bg-[#0D0F14] text-white" : "bg-white text-ink"}>
                  {a.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Folder Sumber" isDark={isDark}>
            <input value={srcFolder} onChange={(e) => setSrcFolder(e.target.value)} className={inpCls} placeholder="root" />
          </Field>
          <Field label="Tujuan" isDark={isDark}>
            <select value={dst} onChange={(e) => setDst(e.target.value)} className={selCls}>
              {accounts.map((a) => (
                <option key={a.id} value={a.id} className={isDark ? "bg-[#0D0F14] text-white" : "bg-white text-ink"}>
                  {a.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Folder Tujuan" isDark={isDark}>
            <input value={dstFolder} onChange={(e) => setDstFolder(e.target.value)} className={inpCls} placeholder="root" />
          </Field>
          <Field label="Arah" isDark={isDark}>
            <select value={dir} onChange={(e) => setDir(e.target.value as "one_way")} className={selCls}>
              <option value="one_way" className={isDark ? "bg-[#0D0F14] text-white" : "bg-white text-ink"}>
                One-way
              </option>
              <option value="mirror" className={isDark ? "bg-[#0D0F14] text-white" : "bg-white text-ink"}>
                Mirror
              </option>
              <option value="two_way" className={isDark ? "bg-[#0D0F14] text-white" : "bg-white text-ink"}>
                Two-way
              </option>
            </select>
          </Field>
          <Field label="Cron" isDark={isDark}>
            <div className="flex gap-2">
              <select
                value={CRON_PRESETS.find((p) => p.value === cron)?.value ?? ""}
                onChange={(e) => {
                  if (e.target.value) setCron(e.target.value);
                }}
                className={selCls}
              >
                <option value="" disabled className={isDark ? "bg-[#0D0F14] text-white" : "bg-white text-ink"}>
                  {CRON_PRESETS.some((p) => p.value === cron) ? cron : "Kustom"}
                </option>
                {CRON_PRESETS.map((p) => (
                  <option key={p.value} value={p.value} className={isDark ? "bg-[#0D0F14] text-white" : "bg-white text-ink"}>
                    {p.label} ({p.value})
                  </option>
                ))}
              </select>
              <input value={cron} onChange={(e) => setCron(e.target.value)} className={inpCls} aria-label="Cron expression" />
            </div>
          </Field>
          {msg && <p className="sm:col-span-2 text-xs text-rose-400 font-medium">{msg}</p>}
          <div className="sm:col-span-2 pt-1">
            <button
              type="button"
              onClick={create}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-blue-600 transition shadow-xs"
            >
              <Plus size={15} /> <span>Simpan Jadwal</span>
            </button>
          </div>
        </div>
      )}

      {rows.length > 0 && (
        <ul className={`mt-5 divide-y border-t ${isDark ? "divide-white/5 border-white/10" : "divide-line border-line"}`}>
          {rows.map((r) => (
            <li key={r.id} className="flex items-center gap-3 py-3 text-xs">
              <Clock size={15} className="text-primary" />
              <span className={`min-w-0 flex-1 truncate ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                {PROVIDER_META[r.sourceProvider]?.label ?? r.sourceProvider}/{r.sourceFolderId} →{" "}
                {PROVIDER_META[r.targetProvider]?.label ?? r.targetProvider}/{r.targetFolderId}
              </span>
              <code
                className={`rounded-md px-2 py-0.5 font-mono text-[11px] border ${
                  isDark ? "bg-white/5 text-slate-300 border-white/10" : "bg-slate-100 text-slate-700 border-line"
                }`}
              >
                {r.cron}
              </code>
              <span className={`text-[11px] ${isDark ? "text-slate-400" : "text-muted"}`}>
                {r.lastRunAt ? new Date(r.lastRunAt).toLocaleDateString("id-ID") : "belum jalan"}
              </span>
              <button
                type="button"
                onClick={() => remove(r.id)}
                aria-label="Hapus jadwal"
                className={`rounded-lg p-1 ${isDark ? "text-slate-400 hover:bg-rose-500/20 hover:text-rose-400" : "text-slate-400 hover:bg-rose-50 hover:text-rose-500"}`}
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Field({ label, children, isDark }: { label: string; children: React.ReactNode; isDark: boolean }) {
  return (
    <label className="block">
      <span className={`mb-1 block text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-600"}`}>{label}</span>
      {children}
    </label>
  );
}
