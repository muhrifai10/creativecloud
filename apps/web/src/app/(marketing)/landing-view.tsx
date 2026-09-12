"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ArrowRight,
  Search,
  Repeat,
  Clock,
  ShieldCheck,
  Check,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { HeroPreview } from "./hero-preview";
import { ProviderLogo } from "@/components/provider-logo";
import { BrandLogo } from "@/components/brand-logo";
import { useLandingTheme, ThemeToggle } from "./theme-context";
import { Reveal } from "./reveal";
import { ScrollBeam } from "./scroll-beam";

// Lazy-load komponen interaktif berat — hanya dimuat saat terlihat
const ExplorerDemo = dynamic(() => import("./explorer-demo").then((m) => m.ExplorerDemo), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 items-center justify-center rounded-3xl border border-neutral-800 bg-neutral-950/40 text-sm text-neutral-500">
      Memuat demo interaktif...
    </div>
  ),
});

const StorageCalculator = dynamic(
  () => import("./storage-calculator").then((m) => m.StorageCalculator),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 items-center justify-center rounded-3xl border border-neutral-800 bg-neutral-950/40 text-sm text-neutral-500">
        Memuat kalkulator...
      </div>
    ),
  },
);

const PROVIDERS = [
  { id: "google_drive", label: "Google Drive" },
  { id: "dropbox", label: "Dropbox" },
  { id: "onedrive", label: "OneDrive" },
  { id: "mega", label: "MEGA" },
  { id: "pcloud", label: "pCloud" },
];

const PRICING = [
  {
    name: "Basic",
    price: "Rp 0",
    period: "Free forever",
    badge: "Free Tier",
    items: [
      "Hingga 3 akun cloud terhubung",
      "Pencarian lintas akun instan",
      "Transfer stream 5 GB per bulan",
      "Enkripsi vault AES-256-GCM lokal",
      "Dukungan komunitas 24/7",
    ],
    cta: "Get Started Free",
    highlight: false,
  },
  {
    name: "Pro",
    price: "Rp 79.000",
    period: "per month",
    badge: "Most Popular",
    items: [
      "Akun cloud tanpa batas",
      "Transfer streaming tanpa batas",
      "Sinkronisasi mirror terjadwal (Cron)",
      "Pencarian cerdas & auto-indexing",
      "Transfer Center floating drawer",
      "Dukungan prioritas eksklusif",
    ],
    cta: "Start 14-Day Free Trial",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Rp 249.000",
    period: "per month",
    badge: "Team & Studio",
    items: [
      "Semua fitur paket Pro",
      "5 kursi kolaborasi tim",
      "Multi-worker BullMQ dedicated",
      "Audit log pemindahan berkas",
      "SLA jaminan uptime 99.9%",
      "Manajer akun personal",
    ],
    cta: "Contact Sales",
    highlight: false,
  },
];

const FAQ = [
  {
    q: "What makes Creative Drive different from traditional cloud storage?",
    a: "Creative Drive does not replace your storage providers—it unifies them. Instead of switching between Google Drive, Dropbox, and MEGA, you manage all your files, search across accounts, and transfer gigabytes of data peer-to-peer without downloading anything to your laptop.",
  },
  {
    q: "How does direct stream transfer work without using laptop disk space?",
    a: "Our high-performance background workers (powered by Redis and BullMQ) establish a direct memory stream pipe between cloud providers. When moving a file from Dropbox to Google Drive, the worker streams byte-chunks directly into the target provider in real time with 0 MB written to your local disk.",
  },
  {
    q: "Which cloud providers are currently supported?",
    a: "Creative Drive supports Google Drive, Dropbox, Microsoft OneDrive, MEGA, and pCloud. You can connect multiple accounts from the same provider simultaneously.",
  },
  {
    q: "How are my cloud credentials and files protected?",
    a: "We never store copies of your files. All OAuth tokens and API credentials are encrypted at rest using military-grade AES-256-GCM encryption with isolated cryptographic salts in your local vault.",
  },
  {
    q: "Can I disconnect or revoke access at any time?",
    a: "Yes, absolutely. You retain complete ownership. You can revoke connection anytime through the Cloud Accounts dashboard, and all cached tokens and metadata are immediately wiped.",
  },
];

export function LandingView() {
  const { theme } = useLandingTheme();
  const isDark = theme === "dark";

  return (
    <div
      className={`min-h-dvh transition-colors duration-300 selection:bg-blue-500 selection:text-white ${
        isDark ? "bg-black text-white" : "bg-canvas text-ink"
      }`}
    >
      {/* 0. Top Laser Scroll Progress Indicator */}
      <ScrollBeam />

      {/* Aceternity Ambient Glowing Beams */}
      <div
        className={`pointer-events-none fixed inset-0 z-0 transition-opacity duration-700 ${
          isDark
            ? "bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(59,130,246,0.18),transparent)] opacity-100"
            : "bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(59,130,246,0.08),transparent)] opacity-70"
        }`}
      />

      {/* Grid Pattern Overlay */}
      <div
        className={`pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] ${
          isDark ? "opacity-40" : "opacity-25"
        }`}
      />

      {/* 1. Aceternity Pill Navbar */}
      <header className="sticky top-0 z-50 px-4 py-3.5 sm:px-8">
        <nav
          className={`mx-auto flex h-14 max-w-6xl items-center justify-between rounded-full border px-5 backdrop-blur-xl transition-all ${
            isDark
              ? "border-neutral-800 bg-black/60 shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
              : "border-line bg-white/90 shadow-sm"
          }`}
        >
          {/* Left: Brand */}
          <Link href="/" className="flex items-center gap-2.5">
            <BrandLogo theme={isDark ? "dark" : "light"} size="sm" />
          </Link>

          {/* Center: Nav Links */}
          <div
            className={`hidden items-center gap-7 text-xs font-semibold md:flex ${
              isDark ? "text-neutral-400" : "text-slate-600"
            }`}
          >
            <a href="#home" className="transition hover:text-white">
              Home
            </a>
            <a href="#product" className="transition hover:text-white">
              Product
            </a>
            <a href="#demo" className="transition hover:text-white">
              Demo
            </a>
            <a href="#pricing" className="transition hover:text-white">
              Pricing
            </a>
            <a href="#faq" className="transition hover:text-white">
              FAQ
            </a>
          </div>

          {/* Right: Actions & Signature Aceternity Button */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <ThemeToggle />

            <Link
              href="/login"
              className={`hidden text-xs font-semibold transition sm:block ${
                isDark ? "text-neutral-400 hover:text-white" : "text-slate-600 hover:text-ink"
              }`}
            >
              Log in
            </Link>

            {/* Signature Aceternity Pill Button with Inner Shine */}
            <Link
              href="/register"
              className={`group relative inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-xs font-semibold transition-all active:scale-95 ${
                isDark
                  ? "border border-white/20 bg-neutral-950 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_0_20px_rgba(255,255,255,0.06)] hover:bg-neutral-900 hover:border-white/40"
                  : "bg-ink text-white shadow-xs hover:bg-slate-800"
              }`}
            >
              <span>Get Started Now</span>
              <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </nav>
      </header>

      <main className="relative z-10" id="home">
        {/* 2. Centered Hero Section */}
        <section className="relative overflow-hidden pt-12 pb-20 sm:pt-18 sm:pb-28">
          <div className="mx-auto max-w-5xl px-5 text-center sm:px-8">
            {/* Top Pill Badge */}
            <Reveal direction="down" delay={0.05}>
              <div className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/80 px-4 py-1.5 shadow-inner">
                <Sparkles size={13} className="text-blue-400" />
                <span className="text-xs font-medium text-neutral-300">
                  Your All-in-One Cloud Storage Companion
                </span>
              </div>
            </Reveal>

            {/* Centered Monumental Title */}
            <Reveal direction="up" delay={0.1}>
              <h1
                className={`mt-6 text-4xl font-bold tracking-tight sm:text-6xl lg:text-[70px] lg:leading-[1.1] ${
                  isDark
                    ? "bg-gradient-to-b from-white via-white/90 to-neutral-500 bg-clip-text text-transparent"
                    : "text-[#151B27]"
                }`}
              >
                Your All-in-One Cloud Companion
              </h1>
            </Reveal>

            {/* Subtitle */}
            <Reveal direction="up" delay={0.18}>
              <p
                className={`mx-auto mt-5 max-w-2xl text-sm leading-relaxed sm:text-base ${
                  isDark ? "text-neutral-400" : "text-slate-600"
                }`}
              >
                Simplify multi-cloud storage management, stream transfers, and automated mirroring with cutting-edge tools designed for creators and teams.
              </p>
            </Reveal>

            {/* Action Buttons */}
            <Reveal direction="up" delay={0.25}>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
                <Link
                  href="/register"
                  className="group relative inline-flex items-center gap-2 rounded-full border border-white/20 bg-white px-7 py-3 text-xs font-bold text-black shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all hover:bg-neutral-200 active:scale-95"
                >
                  <span>Get Started Free</span>
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                </Link>

                <a
                  href="#demo"
                  className={`inline-flex items-center gap-2 rounded-full border px-6 py-3 text-xs font-semibold transition-all active:scale-95 ${
                    isDark
                      ? "border-neutral-800 bg-neutral-950/60 text-white hover:bg-neutral-900 hover:border-neutral-700 shadow-inner"
                      : "border-line bg-white text-slate-700 shadow-2xs hover:bg-slate-50"
                  }`}
                >
                  <span>Explore Interactive Demo</span>
                </a>
              </div>
            </Reveal>

            {/* Trust Points */}
            <Reveal direction="up" delay={0.32}>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-6 font-mono text-xs text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <Check size={13} className="text-emerald-400" /> Free 3 Accounts
                </span>
                <span className="flex items-center gap-1.5">
                  <Check size={13} className="text-emerald-400" /> No credit card required
                </span>
                <span className="flex items-center gap-1.5">
                  <Check size={13} className="text-emerald-400" /> 2-minute setup
                </span>
              </div>
            </Reveal>

            {/* Centerpiece Dashboard Frame with Radial Glow & Scroll Reveal */}
            <Reveal direction="up" delay={0.38} duration={0.8}>
              <div className="relative mt-14 sm:mt-18" id="product">
                <div className="pointer-events-none absolute -inset-4 rounded-3xl bg-blue-500/15 blur-2xl transition-opacity" />
                <div className="relative">
                  <HeroPreview />
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* 3. Trusted by Industry Leaders / Cloud Partners */}
        <section
          className={`border-y py-12 transition-colors duration-300 ${
            isDark ? "border-neutral-800 bg-[#070709]" : "border-line bg-card/60"
          }`}
        >
          <div className="mx-auto max-w-6xl px-5 sm:px-8 text-center">
            <Reveal direction="up">
              <h2 className={`text-xl sm:text-2xl font-bold tracking-tight ${isDark ? "text-white" : "text-[#151B27]"}`}>
                Trusted by Industry Leaders
              </h2>
              <p className="mt-1.5 text-xs text-neutral-400">
                Direct official API & OAuth 2.0 integrations across major cloud storage providers
              </p>
            </Reveal>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-8 sm:gap-14">
              {PROVIDERS.map((p, idx) => (
                <Reveal key={p.id} delay={idx * 0.07} direction="up">
                  <div className="group flex items-center gap-2.5 opacity-75 transition-all hover:opacity-100">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-2xl border p-2 transition-transform group-hover:scale-105 ${
                        isDark
                          ? "border-neutral-800 bg-neutral-900/60 shadow-inner"
                          : "border-line bg-white shadow-2xs"
                      }`}
                    >
                      <ProviderLogo provider={p.id} size={20} />
                    </div>
                    <span className={`font-semibold text-xs ${isDark ? "text-neutral-300" : "text-slate-700"}`}>
                      {p.label}
                    </span>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* 4. Features & Benefits (Aceternity Bento Grid) */}
        <section className="py-20 sm:py-28" id="features">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <Reveal direction="up">
              <div className="text-center space-y-2.5">
                <span className="font-mono text-xs uppercase tracking-widest text-blue-400 font-bold">
                  Features & Benefits
                </span>
                <h2
                  className={`text-3xl font-bold tracking-tight sm:text-5xl ${
                    isDark ? "text-white" : "text-[#151B27]"
                  }`}
                >
                  Hosting over the edge. Built for scale.
                </h2>
                <p className={`mx-auto max-w-xl text-xs sm:text-sm leading-relaxed ${isDark ? "text-neutral-400" : "text-slate-600"}`}>
                  Unify cloud storage into a single high-performance workspace with zero friction.
                </p>
              </div>
            </Reveal>

            <div className="mt-12 grid gap-5 sm:grid-cols-3">
              {/* Tile 1: Global Multi-Cloud Search (Span 2) */}
              <Reveal delay={0.08} className="sm:col-span-2">
                <div
                  className={`group flex flex-col justify-between h-full rounded-3xl border p-6 sm:p-8 transition-all ${
                    isDark
                      ? "border-neutral-800 bg-neutral-950/60 hover:border-neutral-700 shadow-inner"
                      : "border-line bg-card shadow-xs hover:border-slate-300"
                  }`}
                >
                  <div>
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
                      <Search size={18} />
                    </div>
                    <h3 className={`mt-4 text-xl font-bold ${isDark ? "text-white" : "text-[#151B27]"}`}>
                      Instant Multi-Cloud Search
                    </h3>
                    <p className={`mt-1.5 max-w-lg text-xs leading-relaxed sm:text-sm ${isDark ? "text-neutral-400" : "text-slate-600"}`}>
                      One unified search query queries Google Drive, Dropbox, OneDrive, MEGA, and pCloud simultaneously in milliseconds.
                    </p>
                  </div>

                  {/* Mock Search Simulation */}
                  <div
                    className={`mt-6 overflow-hidden rounded-2xl border p-3.5 font-mono ${
                      isDark ? "border-neutral-800 bg-black/60" : "border-line bg-slate-50"
                    }`}
                  >
                    <div
                      className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2 text-xs ${
                        isDark ? "border-neutral-800 bg-neutral-900/70 text-white" : "border-line bg-white text-slate-800 shadow-2xs"
                      }`}
                    >
                      <Search size={13} className="text-blue-400" />
                      <span>Commercial-Reel-4K</span>
                      <span className="ml-auto rounded-md border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[10px] text-blue-400 font-bold">
                        Match Found
                      </span>
                    </div>
                    <div className="mt-2.5 space-y-1.5 text-xs">
                      <div
                        className={`flex items-center justify-between rounded-xl px-3 py-2 border ${
                          isDark ? "bg-white/[0.02] border-white/5 text-neutral-300" : "bg-white border-line/60 text-slate-700 shadow-2xs"
                        }`}
                      >
                        <span className="truncate">Commercial-Reel-4K-Final.mov</span>
                        <span className="text-[10px] text-rose-400 font-semibold font-mono">Dropbox</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>

              {/* Tile 2: Vault AES-256 (Span 1) */}
              <Reveal delay={0.16}>
                <div
                  className={`group flex flex-col justify-between h-full rounded-3xl border p-6 sm:p-8 transition-all ${
                    isDark
                      ? "border-neutral-800 bg-neutral-950/60 hover:border-neutral-700 shadow-inner"
                      : "border-line bg-card shadow-xs hover:border-slate-300"
                  }`}
                >
                  <div>
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                      <ShieldCheck size={18} />
                    </div>
                    <h3 className={`mt-4 text-xl font-bold ${isDark ? "text-white" : "text-[#151B27]"}`}>
                      AES-256-GCM Vault
                    </h3>
                    <p className={`mt-1.5 text-xs leading-relaxed sm:text-sm ${isDark ? "text-neutral-400" : "text-slate-600"}`}>
                      Your OAuth credentials and keys are sealed at the database layer. No plain text ever touches browser memory.
                    </p>
                  </div>

                  <div
                    className={`mt-6 rounded-2xl border p-4 font-mono text-center ${
                      isDark
                        ? "border-emerald-500/20 bg-emerald-950/20 text-emerald-300"
                        : "border-emerald-100 bg-emerald-50/70 text-emerald-800"
                    }`}
                  >
                    <p className="text-xs font-bold">MILITARY-GRADE SECURITY</p>
                    <p className="mt-0.5 text-[11px] opacity-80">Zero local plain-text tokens</p>
                  </div>
                </div>
              </Reveal>

              {/* Tile 3: Direct Stream (Span 1) */}
              <Reveal delay={0.22}>
                <div
                  className={`group flex flex-col justify-between h-full rounded-3xl border p-6 sm:p-8 transition-all ${
                    isDark
                      ? "border-neutral-800 bg-neutral-950/60 hover:border-neutral-700 shadow-inner"
                      : "border-line bg-card shadow-xs hover:border-slate-300"
                  }`}
                >
                  <div>
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-purple-500/20 bg-purple-500/10 text-purple-400">
                      <Repeat size={18} />
                    </div>
                    <h3 className={`mt-4 text-xl font-bold ${isDark ? "text-white" : "text-[#151B27]"}`}>
                      Stream-to-Stream
                    </h3>
                    <p className={`mt-1.5 text-xs leading-relaxed sm:text-sm ${isDark ? "text-neutral-400" : "text-slate-600"}`}>
                      Transfer massive files between clouds without downloading to your laptop first. Save bandwidth and disk space.
                    </p>
                  </div>

                  <div
                    className={`mt-6 flex items-center justify-center gap-3 rounded-2xl border p-4 font-mono text-xs ${
                      isDark ? "border-neutral-800 bg-black/40" : "border-line bg-slate-50"
                    }`}
                  >
                    <span
                      className={`rounded-xl border px-2.5 py-1 ${
                        isDark ? "border-neutral-800 bg-neutral-900 text-neutral-200" : "border-line bg-white text-slate-700 shadow-2xs"
                      }`}
                    >
                      Dropbox
                    </span>
                    <span className="text-blue-400 font-bold">──▶</span>
                    <span
                      className={`rounded-xl border px-2.5 py-1 ${
                        isDark ? "border-neutral-800 bg-neutral-900 text-neutral-200" : "border-line bg-white text-slate-700 shadow-2xs"
                      }`}
                    >
                      Google Drive
                    </span>
                  </div>
                </div>
              </Reveal>

              {/* Tile 4: Automated Cron Mirroring (Span 2) */}
              <Reveal delay={0.28} className="sm:col-span-2">
                <div
                  className={`group flex flex-col justify-between h-full rounded-3xl border p-6 sm:p-8 transition-all ${
                    isDark
                      ? "border-neutral-800 bg-neutral-950/60 hover:border-neutral-700 shadow-inner"
                      : "border-line bg-card shadow-xs hover:border-slate-300"
                  }`}
                >
                  <div>
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
                      <Clock size={18} />
                    </div>
                    <h3 className={`mt-4 text-xl font-bold ${isDark ? "text-white" : "text-[#151B27]"}`}>
                      Automated Mirror Sync
                    </h3>
                    <p className={`mt-1.5 max-w-lg text-xs leading-relaxed sm:text-sm ${isDark ? "text-neutral-400" : "text-slate-600"}`}>
                      Schedule recurring nightly mirror backups with BullMQ workers and Redis queue orchestration.
                    </p>
                  </div>

                  <div
                    className={`mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 font-mono text-xs ${
                      isDark ? "border-neutral-800 bg-black/60" : "border-line bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className={isDark ? "text-neutral-200" : "text-slate-800"}>Cron: Daily at 02:00 WIB</span>
                    </div>
                    <span
                      className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold ${
                        isDark ? "border-neutral-800 bg-neutral-900 text-neutral-400" : "border-line bg-white text-slate-700"
                      }`}
                    >
                      Automated Mirror Active
                    </span>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* 5. Live Interactive Explorer Demo */}
        <section
          id="demo"
          className={`border-t py-20 sm:py-28 transition-colors duration-300 ${
            isDark ? "border-neutral-800 bg-[#070709]" : "border-line bg-slate-50/60"
          }`}
        >
          <div className="mx-auto max-w-5xl px-5 sm:px-8">
            <Reveal direction="up">
              <div className="text-center space-y-3 mb-10">
                <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3.5 py-1 font-mono text-xs font-bold text-blue-400">
                  Live Interactive Demo
                </span>
                <h2
                  className={`text-3xl font-bold tracking-tight sm:text-5xl ${
                    isDark ? "text-white" : "text-[#151B27]"
                  }`}
                >
                  Experience Unified Navigation
                </h2>
                <p className={`mx-auto max-w-xl text-xs sm:text-sm leading-relaxed ${isDark ? "text-neutral-400" : "text-slate-600"}`}>
                  Switch between cloud provider tabs below to inspect how Creative Drive maps disparate files into a single high-speed view.
                </p>
              </div>
            </Reveal>

            <Reveal direction="up" delay={0.15}>
              <ExplorerDemo />
            </Reveal>
          </div>
        </section>

        {/* 6. Storage Savings Calculator */}
        <section
          id="kalkulator"
          className={`border-t py-20 sm:py-28 transition-colors duration-300 ${
            isDark ? "border-neutral-800 bg-black" : "border-line bg-canvas"
          }`}
        >
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <Reveal direction="up">
              <div className="text-center space-y-3 mb-12">
                <span className="font-mono text-xs uppercase tracking-widest text-emerald-400 font-bold">
                  Efficiency Calculator
                </span>
                <h2
                  className={`text-3xl font-bold tracking-tight sm:text-5xl ${
                    isDark ? "text-white" : "text-[#151B27]"
                  }`}
                >
                  Calculate Your Annual Savings
                </h2>
                <p className={`mx-auto max-w-xl text-xs sm:text-sm leading-relaxed ${isDark ? "text-neutral-400" : "text-slate-600"}`}>
                  Combine free tiers and existing subscriptions instead of paying for redundant expensive single-cloud enterprise plans.
                </p>
              </div>
            </Reveal>

            <Reveal direction="up" delay={0.15}>
              <StorageCalculator />
            </Reveal>
          </div>
        </section>

        {/* 7. Aceternity Pricing Section ("Choose Your Plan") */}
        <section
          id="pricing"
          className={`border-t py-20 sm:py-28 transition-colors duration-300 ${
            isDark ? "border-neutral-800 bg-[#070709]" : "border-line bg-slate-50/60"
          }`}
        >
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <Reveal direction="up">
              <div className="text-center space-y-3 mb-12">
                <span className={`font-mono text-xs uppercase tracking-widest font-bold ${isDark ? "text-neutral-400" : "text-slate-500"}`}>
                  Pricing
                </span>
                <h2
                  className={`text-3xl font-bold tracking-tight sm:text-5xl ${
                    isDark ? "text-white" : "text-[#151B27]"
                  }`}
                >
                  Choose Your Plan
                </h2>
                <p className={`mx-auto mt-3 max-w-xl text-xs sm:text-sm leading-relaxed ${isDark ? "text-neutral-400" : "text-slate-600"}`}>
                  Transparent pricing built for creators, studios, and distributed teams.
                </p>
              </div>
            </Reveal>

            <div className="grid gap-6 sm:grid-cols-3">
              {PRICING.map((plan, idx) => (
                <Reveal key={plan.name} delay={idx * 0.1} direction="up">
                  <div
                    className={`relative flex flex-col justify-between h-full rounded-3xl p-7 sm:p-8 transition-all ${
                      plan.highlight
                        ? isDark
                          ? "border-2 border-blue-500 bg-neutral-950/80 shadow-[0_0_50px_rgba(59,130,246,0.15)]"
                          : "border-2 border-primary bg-card shadow-xl shadow-primary/10"
                        : isDark
                        ? "border border-neutral-800 bg-neutral-950/50 hover:border-neutral-700 shadow-inner"
                        : "border border-line bg-card shadow-xs"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className={`text-lg font-bold ${isDark ? "text-white" : "text-[#151B27]"}`}>
                          {plan.name}
                        </h3>
                        <span
                          className={`rounded-full px-3 py-0.5 font-mono text-[10px] font-bold ${
                            plan.highlight
                              ? "bg-blue-500 text-white"
                              : isDark
                              ? "border border-neutral-800 bg-neutral-900 text-neutral-400"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {plan.badge}
                        </span>
                      </div>

                      <div className="mt-6">
                        <p className={`font-mono text-3xl font-bold sm:text-4xl ${isDark ? "text-white" : "text-[#151B27]"}`}>
                          {plan.price}
                        </p>
                        <p className={`mt-1 font-mono text-xs ${isDark ? "text-neutral-500" : "text-slate-500"}`}>
                          {plan.period}
                        </p>
                      </div>

                      <ul className="mt-8 space-y-3.5 text-xs">
                        {plan.items.map((item) => (
                          <li key={item} className="flex items-start gap-2.5">
                            <Check size={14} className="mt-0.5 shrink-0 text-emerald-400" />
                            <span className={isDark ? "text-neutral-300 font-medium" : "text-slate-700 font-medium"}>
                              {item}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Link
                      href="/register"
                      className={`mt-8 flex items-center justify-center gap-2 rounded-full py-3.5 text-xs font-bold transition-all active:scale-95 ${
                        plan.highlight
                          ? "border border-white/20 bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:bg-neutral-200"
                          : isDark
                          ? "border border-neutral-800 bg-neutral-900 text-white hover:bg-neutral-800 shadow-inner"
                          : "border border-line bg-slate-50 text-slate-800 hover:bg-slate-100"
                      }`}
                    >
                      <span>{plan.cta}</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* 8. FAQ Section ("Let's Answer Your Questions") */}
        <section
          id="faq"
          className={`border-t py-20 sm:py-28 transition-colors duration-300 ${
            isDark ? "border-neutral-800 bg-black" : "border-line bg-canvas"
          }`}
        >
          <div className="mx-auto max-w-3xl px-5 sm:px-8">
            <Reveal direction="up">
              <div className="text-center space-y-3 mb-12">
                <span className={`font-mono text-xs uppercase tracking-widest font-bold ${isDark ? "text-neutral-400" : "text-slate-500"}`}>
                  FAQ
                </span>
                <h2
                  className={`text-3xl font-bold tracking-tight sm:text-4xl ${
                    isDark ? "text-white" : "text-[#151B27]"
                  }`}
                >
                  Let&apos;s Answer Your Questions
                </h2>
                <p className={`mt-2 text-xs sm:text-sm ${isDark ? "text-neutral-400" : "text-slate-600"}`}>
                  Everything you need to know about Creative Drive platform security, streaming, and access.
                </p>
              </div>
            </Reveal>

            <div className="space-y-3.5">
              {FAQ.map((item, idx) => (
                <Reveal key={idx} delay={idx * 0.06} direction="up">
                  <details
                    className={`group rounded-2xl border p-5 transition-all [&_summary::-webkit-details-marker]:hidden ${
                      isDark
                        ? "border-neutral-800 bg-neutral-950/60 text-white hover:border-neutral-700 shadow-inner"
                        : "border-line bg-card text-ink shadow-2xs"
                    }`}
                  >
                    <summary className={`flex cursor-pointer items-center justify-between gap-4 text-sm font-bold ${isDark ? "text-white" : "text-[#151B27]"}`}>
                      <span>{item.q}</span>
                      <span
                        className={`shrink-0 rounded-full p-1 transition-transform group-open:rotate-180 ${
                          isDark ? "border border-neutral-800 bg-neutral-900 text-neutral-400" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <ChevronDown size={14} />
                      </span>
                    </summary>
                    <p className={`mt-3 text-xs leading-relaxed sm:text-sm ${isDark ? "text-neutral-400" : "text-slate-600"}`}>
                      {item.a}
                    </p>
                  </details>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* 9. Final Aceternity CTA Banner */}
        <section className="border-t border-neutral-800 py-20 sm:py-28">
          <div className="mx-auto max-w-5xl px-5 sm:px-8">
            <Reveal direction="up" duration={0.8}>
              <div
                className={`relative overflow-hidden rounded-3xl border p-8 text-center sm:p-16 shadow-2xl ${
                  isDark
                    ? "border-neutral-800 bg-neutral-950 text-white shadow-[0_0_80px_rgba(59,130,246,0.15)]"
                    : "border-line bg-gradient-to-b from-slate-900 to-black text-white"
                }`}
              >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.2),transparent)]" />
                <div className="relative z-10 space-y-5">
                  <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1 font-mono text-xs text-blue-400 font-bold">
                    GET STARTED TODAY
                  </span>
                  <h2 className="mx-auto max-w-xl text-3xl font-bold tracking-tight sm:text-5xl text-white">
                    Your All-in-One Cloud Storage Companion
                  </h2>
                  <p className="mx-auto max-w-md text-xs leading-relaxed sm:text-sm text-neutral-400">
                    Connect your first cloud account in under two minutes. Free forever, no credit card required.
                  </p>
                  <div className="pt-3">
                    <Link
                      href="/register"
                      className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white px-8 py-3.5 text-xs font-bold text-black shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all hover:bg-neutral-200 active:scale-95"
                    >
                      <span>Get Started Now</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      {/* 10. Minimal Aceternity Footer */}
      <footer
        className={`border-t py-12 transition-colors duration-300 ${
          isDark ? "border-neutral-800 bg-black text-neutral-500" : "border-line bg-card text-slate-500"
        }`}
      >
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-5 sm:flex-row sm:px-8 text-xs font-mono">
          <div className="flex items-center gap-3">
            <BrandLogo theme={isDark ? "dark" : "light"} size="sm" />
            <span className={isDark ? "text-neutral-500" : "text-slate-500"}>
              © 2026 Creative Drive. All rights reserved.
            </span>
          </div>

          <div className="flex gap-6 font-semibold">
            <a href="#home" className="hover:text-white transition">
              Home
            </a>
            <a href="#product" className="hover:text-white transition">
              Product
            </a>
            <a href="#pricing" className="hover:text-white transition">
              Pricing
            </a>
            <a href="#faq" className="hover:text-white transition">
              FAQ
            </a>
            <Link href="/login" className="hover:text-white transition">
              Log in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
