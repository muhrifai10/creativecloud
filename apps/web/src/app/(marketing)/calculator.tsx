"use client";

import { useState } from "react";
import { PROVIDER_META } from "@/lib/providers-meta";

const TIERS = [
  { provider: "google_drive", gb: 15 },
  { provider: "dropbox", gb: 2 },
  { provider: "onedrive", gb: 5 },
  { provider: "mega", gb: 20 },
  { provider: "pcloud", gb: 10 },
] as const;

export function StorageCalculator() {
  const [on, setOn] = useState<Record<string, boolean>>(
    Object.fromEntries(TIERS.map((t) => [t.provider, true])),
  );
  const [searchMinutes, setSearchMinutes] = useState(25);

  const totalGb = TIERS.filter((t) => on[t.provider]).reduce((a, t) => a + t.gb, 0);
  const hoursSavedMonth = (searchMinutes * 20) / 60;

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_360px] lg:items-center">
      <div>
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Hitung gabungan kuota gratis Anda</h2>
        <p className="mt-3 max-w-[60ch] text-base leading-relaxed text-slate-600">
          Lima penyedia menyimpan berkas yang sama di lima tempat. NexisDrive menampilkannya sebagai satu angka.
        </p>

        <ul className="mt-8 space-y-2">
          {TIERS.map((t) => {
            const meta = PROVIDER_META[t.provider];
            const active = on[t.provider];
            return (
              <li key={t.provider}>
                <label
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition select-none ${
                    active ? "border-line bg-card shadow-[0_2px_12px_-2px_rgba(20,25,40,0.05)]" : "border-line/60 bg-transparent opacity-60"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => setOn((s) => ({ ...s, [t.provider]: !s[t.provider] }))}
                    className="h-4 w-4 accent-[#4f46e5] focus-visible:ring-2 focus-visible:ring-primary/40"
                  />
                  <span
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold text-white"
                    style={{ background: meta?.color }}
                    aria-hidden
                  >
                    {meta?.initial}
                  </span>
                  <span className="flex-1 text-sm font-medium">{meta?.label}</span>
                  <span className="font-mono text-sm tabular-nums text-slate-500">{t.gb} GB</span>
                </label>
              </li>
            );
          })}
        </ul>

        <div className="mt-8">
          <label htmlFor="minutes" className="flex items-center justify-between text-sm font-medium">
            Waktu mencari berkas antar-tab, per hari
            <span className="font-mono tabular-nums text-[#4f46e5]">{searchMinutes} menit</span>
          </label>
          <input
            id="minutes"
            type="range"
            min={5}
            max={60}
            step={5}
            value={searchMinutes}
            onChange={(e) => setSearchMinutes(Number(e.target.value))}
            className="mt-3 w-full accent-[#4f46e5]"
          />
          <p className="mt-1.5 text-xs text-slate-400">Asumsi kerja 20 hari per bulan.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-card p-8 shadow-[0_4px_24px_-2px_rgba(20,25,40,0.04)]">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Hasil</p>
        <p className="mt-4 font-mono text-5xl font-semibold tabular-nums">
          {totalGb}
          <span className="ml-1 text-xl text-slate-400">GB</span>
        </p>
        <p className="mt-1.5 text-sm text-slate-500">kuota gabungan yang tampil di satu gauge</p>
        <div className="my-6 border-t border-line" />
        <p className="font-mono text-3xl font-semibold tabular-nums text-[#4f46e5]">
          {hoursSavedMonth.toFixed(1)}
          <span className="ml-1 text-lg text-slate-400">jam</span>
        </p>
        <p className="mt-1.5 text-sm text-slate-500">hemat waktu cari berkas per bulan bila semua di satu tempat</p>
      </div>
    </div>
  );
}
