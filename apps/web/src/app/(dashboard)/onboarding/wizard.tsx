"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ArrowRight, PartyPopper } from "lucide-react";
import { ConnectPanel } from "@/app/(dashboard)/accounts/connect-panel";

interface Status {
  completed: boolean;
  connected: number;
}

const STEPS = [
  { title: "Hubungkan akun pertama", desc: "Pilih penyedia cloud. OAuth resmi atau kredensial, semuanya dienkripsi." },
  { title: "Hubungkan akun kedua", desc: "Nilai utama Creative Drive muncul saat ada 2+ cloud berdampingan." },
  { title: "Lihat dasbor gabungan", desc: "Kuota dan berkas Anda kini satu layar." },
];

export function OnboardingWizard() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>({ completed: false, connected: 0 });
  const [step, setStep] = useState(0);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    let alive = true;
    async function tick() {
      const r = await fetch("/api/onboarding").then((res) => (res.ok ? res.json() : null)).catch(() => null);
      if (alive && r) {
        setStatus(r as Status);
        const next = (r as Status).connected >= 2 ? 2 : (r as Status).connected >= 1 ? 1 : 0;
        setStep((prev) => Math.max(prev, next));
      }
    }
    tick();
    const t = setInterval(tick, 2500);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  async function finish() {
    setFinishing(true);
    await fetch("/api/onboarding", { method: "POST" });
    router.push("/dashboard");
  }

  const pct = status.connected === 0 ? 8 : status.connected === 1 ? 50 : status.connected >= 2 ? 100 : 100;

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-2 flex items-center justify-between text-xs text-muted">
        <span>Langkah {Math.min(step + 1, 3)} dari 3</span>
        <span className="font-mono tabular-nums">{pct}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>

      <div className="mt-8 rounded-2xl border border-line bg-card p-8 shadow-[0_4px_24px_-2px_rgba(20,25,40,0.04)]">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#8B5CF6]/10 text-[#8B5CF6]">
          {step === 2 && status.connected >= 2 ? <PartyPopper size={20} /> : <span className="font-semibold">{step + 1}</span>}
        </span>
        <h2 className="mt-4 text-xl font-bold tracking-tight">{STEPS[step]!.title}</h2>
        <p className="mt-1.5 text-sm text-slate-600">{STEPS[step]!.desc}</p>

        {step < 2 ? (
          <div className="mt-6">
            {status.connected > 0 && (
              <p className="mb-4 inline-flex items-center gap-2 rounded-lg bg-[#10B981]/10 px-3 py-1.5 text-sm text-[#10B981]">
                <Check size={15} /> {status.connected} akun terhubung
              </p>
            )}
            <ConnectPanel />
          </div>
        ) : (
          <div className="mt-6">
            <p className="text-sm text-muted">
              {status.connected >= 2
                ? "Mantap. Dasbor gabungan Anda sudah siap."
                : "Sambungkan minimal 2 akun untuk melanjutkan."}
            </p>
            <button
              type="button"
              onClick={finish}
              disabled={status.connected < 2 || finishing}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {finishing ? "Membuka dasbor..." : "Masuk ke dasbor"} <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={finish}
        className="mx-auto mt-6 block text-sm text-muted underline-offset-4 transition hover:text-ink hover:underline"
      >
        Lewati untuk sekarang
      </button>
    </div>
  );
}
