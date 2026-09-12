"use client";

import { useDashboardTheme } from "@/components/dashboard-theme-provider";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { isDark } = useDashboardTheme();

  return (
    <div
      className={`flex min-h-screen transition-colors duration-200 ${
        isDark ? "bg-[#08090C] text-white" : "bg-[#F6F8FC] text-[#151B27]"
      }`}
    >
      {children}
    </div>
  );
}
