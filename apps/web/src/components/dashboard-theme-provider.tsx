"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

type Theme = "dark" | "light";

interface ThemeCtx {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

const Ctx = createContext<ThemeCtx>({
  theme: "dark",
  toggleTheme: () => {},
  isDark: true,
});

export function DashboardThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const saved = localStorage.getItem("creative_dashboard_theme") as Theme | null;
    if (saved === "light" || saved === "dark") {
      setTheme(saved);
    }
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("creative_dashboard_theme", next);
      return next;
    });
  };

  const isDark = theme === "dark";

  return (
    <Ctx.Provider value={{ theme, toggleTheme, isDark }}>
      <div className={isDark ? "theme-dark text-white" : "theme-light text-[#151B27]"}>
        {children}
      </div>
    </Ctx.Provider>
  );
}

export function useDashboardTheme() {
  return useContext(Ctx);
}

export function DashboardThemeToggle({ className = "" }: { className?: string }) {
  const { isDark, toggleTheme } = useDashboardTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Beralih ke Tema Terang" : "Beralih ke Tema Gelap"}
      title={isDark ? "Beralih ke Tema Terang" : "Beralih ke Tema Gelap"}
      className={`relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all active:scale-95 shadow-2xs ${
        isDark
          ? "border-white/10 bg-white/5 text-amber-300 hover:bg-white/10 hover:border-white/20"
          : "border-line bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300"
      } ${className}`}
    >
      {isDark ? (
        <Sun size={16} className="transition-transform hover:rotate-45" />
      ) : (
        <Moon size={16} className="transition-transform hover:-rotate-12" />
      )}
    </button>
  );
}
