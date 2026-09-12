"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  toggleTheme: () => {},
});

export function LandingThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const saved = localStorage.getItem("creative_landing_theme") as Theme | null;
    if (saved === "light" || saved === "dark") {
      setTheme(saved);
    }
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("creative_landing_theme", next);
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useLandingTheme() {
  return useContext(ThemeContext);
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useLandingTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Ganti ke tema terang" : "Ganti ke tema gelap"}
      title={isDark ? "Beralih ke Tema Terang" : "Beralih ke Tema Gelap"}
      className={`relative inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-all active:scale-95 ${
        isDark
          ? "border-white/10 bg-white/5 text-amber-300 hover:bg-white/10 hover:border-white/20"
          : "border-line bg-white text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300"
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
