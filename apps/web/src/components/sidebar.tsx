"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FolderOpen,
  Plug,
  ArrowLeftRight,
  Settings,
  Folder,
  X,
  Plus,
  Sparkles,
} from "lucide-react";
import { useSummary } from "@/lib/use-summary";
import { formatBytes, PROVIDER_META } from "@/lib/providers-meta";
import { BrandLogo } from "@/components/brand-logo";
import { useSidebar } from "@/components/sidebar-provider";
import { useDashboardTheme } from "@/components/dashboard-theme-provider";

interface SidebarProps {
  user?: {
    name: string;
    email: string;
  };
}

const MENU = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/explorer", label: "My Files", icon: FolderOpen },
  { href: "/accounts", label: "Akun Cloud", icon: Plug },
  { href: "/transfers", label: "Transfer", icon: ArrowLeftRight },
  { href: "/settings", label: "Settings", icon: Settings },
];

function SidebarContent({ user }: SidebarProps) {
  const { data } = useSummary();
  const pathname = usePathname();
  const router = useRouter();
  const { isDark } = useDashboardTheme();

  const folders = data?.recentFolders ?? [];
  const totalUsed = data?.totals.usedBytes ?? 0;
  const totalCapacity = data?.totals.totalBytes ?? 0;
  const usedPct = totalCapacity > 0 ? Math.min(Math.round((totalUsed / totalCapacity) * 100), 100) : 0;

  const displayName = user?.name || "Alexander Bell";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div
      className={`flex h-full flex-col transition-colors duration-200 ${
        isDark ? "bg-[#0D0F14] text-white" : "bg-card text-ink"
      }`}
    >
      {/* 1. Brand Logo Header */}
      <div
        className={`flex h-16 shrink-0 items-center justify-between border-b px-5 transition-colors ${
          isDark ? "border-white/10" : "border-line"
        }`}
      >
        <Link href="/dashboard" className="flex items-center gap-2">
          <BrandLogo size="md" theme={isDark ? "white" : "light"} />
        </Link>
      </div>

      {/* 2. Tailgrids User Profile Card */}
      <div
        className={`flex shrink-0 items-center gap-3 border-b px-5 py-3.5 transition-colors ${
          isDark ? "border-white/10 bg-white/[0.02]" : "border-line bg-slate-50/40"
        }`}
      >
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-blue-500 text-sm font-bold text-white shadow-xs">
          {initial}
          <span
            className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ${
              isDark ? "ring-[#0D0F14]" : "ring-white"
            }`}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold">{displayName}</p>
          <p className={`text-[11px] font-medium ${isDark ? "text-slate-400" : "text-muted"}`}>Manager</p>
        </div>
      </div>

      {/* 3. Scrollable Center Menu */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {/* Group: MENU */}
        <div>
          <p
            className={`px-3 pb-2 text-[11px] font-bold uppercase tracking-wider font-mono ${
              isDark ? "text-slate-500" : "text-slate-400"
            }`}
          >
            MENU
          </p>
          <nav className="space-y-1">
            {MENU.map((item) => {
              const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                    active
                      ? isDark
                        ? "border border-primary/30 bg-primary/15 text-blue-400 shadow-2xs"
                        : "bg-primary/10 text-primary shadow-2xs"
                      : isDark
                      ? "text-slate-400 hover:bg-white/5 hover:text-white"
                      : "text-slate-600 hover:bg-slate-50 hover:text-ink"
                  }`}
                >
                  <item.icon
                    size={16}
                    className={`transition-transform ${
                      active
                        ? isDark
                          ? "text-blue-400 scale-105"
                          : "text-primary scale-105"
                        : isDark
                        ? "text-slate-400 group-hover:text-white"
                        : "text-slate-400 group-hover:text-slate-600"
                    }`}
                    aria-hidden
                  />
                  <span>{item.label}</span>
                  {active && (
                    <span
                      className={`ml-auto h-1.5 w-1.5 rounded-full ${
                        isDark ? "bg-blue-400" : "bg-primary"
                      }`}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Group: ALL FOLDER */}
        <div>
          <p
            className={`px-3 pb-2 text-[11px] font-bold uppercase tracking-wider font-mono ${
              isDark ? "text-slate-500" : "text-slate-400"
            }`}
          >
            ALL FOLDER
          </p>
          <ul className="space-y-1">
            {folders.slice(0, 5).map((f) => (
              <li key={f.id}>
                <Link
                  href={`/explorer?account=${f.accountId}&folder=${encodeURIComponent(f.providerFileId)}`}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-1.5 text-xs transition-all ${
                    isDark
                      ? "text-slate-400 hover:bg-white/5 hover:text-white"
                      : "text-slate-600 hover:bg-slate-50 hover:text-ink"
                  }`}
                >
                  <Folder size={14} className="shrink-0 text-amber-500" aria-hidden />
                  <span className="min-w-0 flex-1 truncate font-medium">{f.name}</span>
                  <span
                    className={`font-mono text-[9px] uppercase ${
                      isDark ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    {PROVIDER_META[f.provider]?.initial}
                  </span>
                </Link>
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={() => router.push("/explorer")}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                  isDark
                    ? "text-blue-400 hover:bg-primary/10"
                    : "text-primary hover:bg-primary/5"
                }`}
              >
                <Plus size={14} />
                <span>Create New Folder</span>
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* 4. Tailgrids Signature "Upgrade Storage" Card */}
      <div
        className={`shrink-0 border-t p-4 transition-colors ${
          isDark ? "border-white/10" : "border-line"
        }`}
      >
        <div
          className={`rounded-2xl border p-4 transition-colors ${
            isDark ? "border-white/10 bg-white/[0.03]" : "border-line bg-slate-50/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold">Upgrade Storage</h4>
            <span
              className={`font-mono text-[11px] font-bold ${
                isDark ? "text-blue-400" : "text-primary"
              }`}
            >
              {usedPct}%
            </span>
          </div>

          <p className={`mt-1 text-[11px] ${isDark ? "text-slate-400" : "text-muted"}`}>
            {formatBytes(totalUsed)} of {formatBytes(totalCapacity)} Used
          </p>

          <div
            className={`mt-2.5 h-1.5 overflow-hidden rounded-full ${
              isDark ? "bg-white/10" : "bg-slate-200"
            }`}
          >
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${usedPct}%` }}
            />
          </div>

          <Link
            href="/settings"
            className="mt-3.5 flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary py-2 text-xs font-bold text-white shadow-xs transition hover:bg-blue-600"
          >
            <Sparkles size={12} />
            <span>Upgrade Plan</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export function Sidebar({ user }: SidebarProps) {
  const { open, close } = useSidebar();
  const { isDark } = useDashboardTheme();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden w-[250px] shrink-0 border-r lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:overflow-hidden transition-colors duration-200 ${
          isDark ? "border-white/10 bg-[#0D0F14]" : "border-line bg-card"
        }`}
      >
        <SidebarContent user={user} />
      </aside>

      {/* Mobile Drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="sidebar-overlay absolute inset-0" onClick={close} />
          <aside
            className={`absolute inset-y-0 left-0 z-50 flex h-full w-[270px] flex-col border-r shadow-2xl animate-slide-in-left overflow-hidden transition-colors duration-200 ${
              isDark ? "border-white/10 bg-[#0D0F14]" : "border-line bg-card"
            }`}
          >
            <button
              type="button"
              onClick={close}
              className="absolute right-3.5 top-4 z-10 rounded-xl p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
              aria-label="Tutup menu"
            >
              <X size={18} />
            </button>
            <SidebarContent user={user} />
          </aside>
        </div>
      )}
    </>
  );
}
