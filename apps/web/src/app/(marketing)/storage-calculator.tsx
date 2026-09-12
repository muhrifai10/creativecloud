"use client";

import { useMemo, useState } from "react";
import { PROVIDER_META } from "@/lib/providers-meta";
import { ProviderLogo } from "@/components/provider-logo";
import { Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useLandingTheme } from "./theme-context";

interface Plan {
  id: string;
  gb: number;
  pricePerMonth: number;
}

const PLANS: Record<string, Plan[]> = {
  google_drive: [
    { id: "Free", gb: 15, pricePerMonth: 0 },
    { id: "100 GB", gb: 100, pricePerMonth: 27000 },
    { id: "2 TB", gb: 2000, pricePerMonth: 135000 },
  ],
  dropbox: [
    { id: "Basic", gb: 2, pricePerMonth: 0 },
    { id: "Plus 2TB", gb: 2000, pricePerMonth: 160000 },
  ],
  onedrive: [
    { id: "Free", gb: 5, pricePerMonth: 0 },
    { id: "100 GB", gb: 100, pricePerMonth: 31000 },
    { id: "1 TB", gb: 1000, pricePerMonth: 95000 },
  ],
  mega: [
    { id: "Free", gb: 20, pricePerMonth: 0 },
    { id: "Pro I", gb: 400, pricePerMonth: 85000 },
    { id: "Pro II", gb: 2000, pricePerMonth: 170000 },
  ],
  pcloud: [
    { id: "Free", gb: 10, pricePerMonth: 0 },
    { id: "500 GB", gb: 500, pricePerMonth: 80000 },
  ],
};

const IDS = Object.keys(PLANS);

export function StorageCalculator() {
  const [sel, setSel] = useState<Record<string, number>>(
    Object.fromEntries(IDS.map((k) => [k, 0])),
  );
  const [count, setCount] = useState(2);
  const { theme } = useLandingTheme();
  const isDark = theme === "dark";

  const { totalGb, monthly } = useMemo(() => {
    let totalGb = 0;
    let monthly = 0;
    for (const id of IDS) {
      const plan = PLANS[id]![sel[id]!]!;
      totalGb += plan.gb;
      monthly += plan.pricePerMonth;
    }
    return { totalGb, monthly: monthly * Math.max(count, 1) };
  }, [sel, count]);

  const rupiah = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-stretch">
      {/* Left Configurator Panel */}
      <div
        className={`rounded-3xl border p-6 shadow-2xl transition-colors duration-300 sm:p-7 ${
          isDark
            ? "border-white/10 bg-[#0C0E12] text-white"
            : "border-line bg-card text-ink shadow-slate-200/50"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-base font-bold ${isDark ? "text-white" : "text-[#151B27]"}`}>
              Pilih Kuota Tiap Akun
            </h3>
            <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Sesuaikan kapasitas paket yang Anda miliki saat ini
            </p>
          </div>
          <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 font-mono text-[10px] font-bold text-blue-500">
            Interactive
          </span>
        </div>

        <div className="mt-6 space-y-3.5">
          {IDS.map((id) => {
            const meta = PROVIDER_META[id];
            const options = PLANS[id]!;
            return (
              <div
                key={id}
                className={`flex flex-col gap-2.5 rounded-2xl border p-3 sm:flex-row sm:items-center sm:justify-between transition-colors ${
                  isDark
                    ? "border-white/5 bg-black/40"
                    : "border-line/60 bg-slate-50/70"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-lg p-1 border shadow-2xs ${
                      isDark ? "bg-white/5 border-white/10" : "bg-white border-line"
                    }`}
                  >
                    <ProviderLogo provider={id} size={15} />
                  </div>
                  <span className={`text-xs font-semibold ${isDark ? "text-white" : "text-slate-800"}`}>
                    {meta?.label ?? id}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {options.map((o, i) => (
                    <button
                      key={o.id}
                      type="button"
                      aria-pressed={sel[id] === i}
                      onClick={() => setSel((s) => ({ ...s, [id]: i }))}
                      className={`rounded-xl px-3 py-1.5 font-mono text-xs font-medium tabular-nums transition-all ${
                        sel[id] === i
                          ? isDark
                            ? "bg-white text-black shadow-xs font-bold"
                            : "bg-ink text-white shadow-xs font-bold"
                          : isDark
                          ? "border border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:text-white"
                          : "border border-line bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {o.gb} GB {o.pricePerMonth > 0 ? `(${rupiah.format(o.pricePerMonth)})` : "(Gratis)"}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div
          className={`mt-6 rounded-2xl border p-4 transition-colors ${
            isDark ? "border-white/5 bg-black/50" : "border-line bg-slate-50"
          }`}
        >
          <label className="flex items-center justify-between text-xs">
            <span className={`font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              Jumlah Akun yang Terhubung
            </span>
            <span className="font-mono text-xs font-bold text-blue-500 tabular-nums">
              {count} Akun Cloud
            </span>
          </label>
          <input
            type="range"
            min={1}
            max={5}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="mt-2.5 w-full accent-blue-500"
          />
        </div>
      </div>

      {/* Right Result Card */}
      <div className="flex flex-col justify-between rounded-3xl border border-white/10 bg-slate-950 p-6 text-white shadow-2xl sm:p-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
            <Sparkles size={13} className="text-amber-400" />
            <span>Kalkulasi Otomatis</span>
          </div>

          <div className="mt-6">
            <p className="text-xs font-mono uppercase tracking-wider text-slate-400">Total Kapasitas Terpadu</p>
            <p className="mt-1 font-mono text-4xl font-bold tracking-tight text-white tabular-nums sm:text-5xl">
              {totalGb.toLocaleString("id-ID")} <span className="text-xl font-normal text-slate-400">GB</span>
            </p>
            <p className="mt-1 text-xs text-slate-400">Dikelola dalam satu dasbor Creative Drive</p>
          </div>

          <div className="mt-8 space-y-3.5 border-t border-white/10 pt-6 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Estimasi Pengeluaran Penyedia:</span>
              <span className="font-mono font-semibold text-white tabular-nums">{rupiah.format(monthly)} / bln</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Jika Beli Single Enterprise Storage:</span>
              <span className="font-mono text-slate-500 line-through tabular-nums">
                {rupiah.format(Math.round(monthly * 1.6 + 50000))} / bln
              </span>
            </div>
            <div className="my-2 border-t border-white/10" />
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold text-slate-200">Potensi Hemat / Tahun:</span>
              <span className="font-mono text-2xl font-bold text-emerald-400 tabular-nums">
                {rupiah.format(Math.round((monthly * 0.6 + 50000) * 12))}
              </span>
            </div>
          </div>
        </div>

        <Link
          href="/register"
          className="mt-8 flex items-center justify-center gap-2 rounded-2xl bg-white py-3 text-xs font-bold text-black transition-all hover:bg-slate-200 hover:shadow-lg active:scale-[0.98]"
        >
          <span>Satukan Cloud Anda Sekarang</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
