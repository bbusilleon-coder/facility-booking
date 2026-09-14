"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export const themeColors = {
  blue: { name: "블루", primary: "#3b82f6", hover: "#2563eb", light: "#3b82f622" },
  green: { name: "그린", primary: "#22c55e", hover: "#16a34a", light: "#22c55e22" },
  purple: { name: "퍼플", primary: "#8b5cf6", hover: "#7c3aed", light: "#8b5cf622" },
  red: { name: "레드", primary: "#ef4444", hover: "#dc2626", light: "#ef444422" },
  orange: { name: "오렌지", primary: "#f97316", hover: "#ea580c", light: "#f9731622" },
  pink: { name: "핑크", primary: "#ec4899", hover: "#db2777", light: "#ec489922" },
  cyan: { name: "시안", primary: "#06b6d4", hover: "#0891b2", light: "#06b6d422" },
  amber: { name: "앰버", primary: "#f59e0b", hover: "#d97706", light: "#f59e0b22" },
  indigo: { name: "인디고", primary: "#6366f1", hover: "#4f46e5", light: "#6366f122" },
  teal: { name: "틸", primary: "#14b8a6", hover: "#0d9488", light: "#14b8a622" },
};

export type ThemeKey = keyof typeof themeColors;
export type ModeKey = "dark" | "light";

interface ThemeContextType {
  theme: ThemeKey;
  mode: ModeKey;
  setTheme: (theme: ThemeKey) => void;
  setMode: (mode: ModeKey) => void;
  colors: typeof themeColors[ThemeKey];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeKey>("blue");
  const [mode, setModeState] = useState<ModeKey>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const res = await fetch("/api/settings/theme");
        const json = await res.json();
        if (json.ok) {
          if (json.theme && themeColors[json.theme as ThemeKey]) {
            setThemeState(json.theme as ThemeKey);
          }
          if (json.mode) {
            setModeState(json.mode as ModeKey);
          }
        }
      } catch (err) {}
      setMounted(true);
    };
    fetchTheme();
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const colors = themeColors[theme];
    document.documentElement.style.setProperty("--color-primary", colors.primary);
    document.documentElement.style.setProperty("--color-primary-hover", colors.hover);
    document.documentElement.style.setProperty("--color-primary-light", colors.light);
    
    // 라이트/다크 모드 적용
    if (mode === "light") {
      document.documentElement.style.setProperty("--background", "#f5f5f5");
      document.documentElement.style.setProperty("--foreground", "#1a1a1a");
      document.documentElement.style.setProperty("--card-bg", "#ffffff");
      document.documentElement.style.setProperty("--border-color", "#e5e5e5");
      document.documentElement.style.setProperty("--border-strong", "#cbd5e1");
      document.documentElement.style.setProperty("--text-muted", "#666666");
      document.documentElement.style.setProperty("--text-secondary", "#475569");
      document.documentElement.style.setProperty("--text-subtle", "#64748b");
      document.documentElement.style.setProperty("--input-bg", "#ffffff");
      document.documentElement.style.setProperty("--surface-strong", "#e2e8f0");
      document.documentElement.style.setProperty("--selection-bg", "#eff6ff");
      document.documentElement.style.setProperty("--skeleton-base", "#e2e8f0");
      document.documentElement.style.setProperty("--skeleton-highlight", "#f8fafc");
      document.body.classList.add("light-mode");
      document.body.classList.remove("dark-mode");
    } else {
      document.documentElement.style.setProperty("--background", "#0a0a0a");
      document.documentElement.style.setProperty("--foreground", "#ededed");
      document.documentElement.style.setProperty("--card-bg", "#1a1a1a");
      document.documentElement.style.setProperty("--border-color", "#333333");
      document.documentElement.style.setProperty("--border-strong", "#444444");
      document.documentElement.style.setProperty("--text-muted", "#888888");
      document.documentElement.style.setProperty("--text-secondary", "#aaaaaa");
      document.documentElement.style.setProperty("--text-subtle", "#777777");
      document.documentElement.style.setProperty("--input-bg", "#0f0f0f");
      document.documentElement.style.setProperty("--surface-strong", "#333333");
      document.documentElement.style.setProperty("--selection-bg", "#1f2937");
      document.documentElement.style.setProperty("--skeleton-base", "#1a1a1a");
      document.documentElement.style.setProperty("--skeleton-highlight", "#2a2a2a");
      document.body.classList.add("dark-mode");
      document.body.classList.remove("light-mode");
    }
  }, [theme, mode, mounted]);

  const setTheme = async (newTheme: ThemeKey) => {
    setThemeState(newTheme);
    try {
      await fetch("/api/settings/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: newTheme, mode }),
      });
    } catch (err) {}
  };

  const setMode = async (newMode: ModeKey) => {
    setModeState(newMode);
    try {
      await fetch("/api/settings/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme, mode: newMode }),
      });
    } catch (err) {}
  };

  return (
    <ThemeContext.Provider value={{ theme, mode, setTheme, setMode, colors: themeColors[theme] }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
