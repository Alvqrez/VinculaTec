/*import { createContext, useContext, useState, useEffect } from "react";


const ThemeCtx = createContext(null);

const DARK = {
  bg: "#0D1117",
  card: "#161B22",
  sidebar: "#080E1A",
  border: "#30363D",
  borderLight: "#21262D",
  text: "#E6EDF3",
  textSub: "#8B949E",
  textMuted: "#6E7681",
  textLight: "#484F58",
  teal: "#2DD4BF",
  tealLight: "#0D2E2B",
  tealLighter: "#0A2220",
  navy: "#1E3A5F",
  navyLight: "#1C2734",
  green: "#3FB950",
  greenLight: "#0F2A0F",
  amber: "#D29922",
  amberLight: "#2D2009",
  red: "#F85149",
  redLight: "#2A0E0E",
  blue: "#58A6FF",
  blueLight: "#1C2C48",
  white: "#E6EDF3",
};

const LIGHT = {
  bg: "#F8FAFC",
  card: "#FFFFFF",
  sidebar: "#0F172A",
  border: "#E2E8F0",
  borderLight: "#F1F5F9",
  text: "#0F172A",
  textSub: "#475569",
  textMuted: "#94A3B8",
  textLight: "#CBD5E1",
  teal: "#0D9488",
  tealLight: "#F0FDFA",
  tealLighter: "#CCFBF1",
  navy: "#1E3A5F",
  navyLight: "#EFF6FF",
  green: "#10B981",
  greenLight: "#D1FAE5",
  amber: "#F59E0B",
  amberLight: "#FEF3C7",
  red: "#EF4444",
  redLight: "#FEE2E2",
  blue: "#3B82F6",
  blueLight: "#EFF6FF",
  white: "#FFFFFF",
};

// CSS mínimo — el grueso del dark mode lo manejan los componentes con useTheme()
const DARK_CSS = `
  body { background-color: #0D1117 !important; }
  [data-theme="dark"] input,
  [data-theme="dark"] textarea,
  [data-theme="dark"] select {
    background-color: #0D1117 !important;
    color: #E6EDF3 !important;
    border-color: #30363D !important;
  }
  [data-theme="dark"] input::placeholder,
  [data-theme="dark"] textarea::placeholder {
    color: #6E7681 !important;
  }
`;

const LIGHT_CSS = `body { background-color: #F8FAFC !important; }`;

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    try {
      return localStorage.getItem("vt_dark_mode") === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("vt_dark_mode", String(isDark));
    } catch {}
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute(
      "data-theme",
      isDark ? "dark" : "light",
    );
    let styleEl = document.getElementById("vt-theme");
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "vt-theme";
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = isDark ? DARK_CSS : LIGHT_CSS;
  }, [isDark]);

  const toggleDark = () => setIsDark((p) => !p);
  const colors = isDark ? DARK : LIGHT;

  return (
    <ThemeCtx.Provider value={{ isDark, toggleDark, colors, DARK, LIGHT }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme debe usarse dentro de ThemeProvider");
  return ctx;
}

export { DARK as darkColors, LIGHT as lightColors };
*/

import { createContext, useContext, useState, useEffect } from "react";

const ThemeCtx = createContext(null);

// ── PALETA DARK ───────────────────────────────────────────────────────────────
const DARK = {
  bg: "#0F172A",
  card: "#111827",
  sidebar: "#020617",

  border: "#1E293B",
  borderLight: "#334155",

  text: "#F8FAFC",
  textSub: "#E2E8F0",
  textMuted: "#94A3B8",
  textLight: "#64748B",

  teal: "#14B8A6",
  tealLight: "#134E4A",
  tealLighter: "#042F2E",

  navy: "#1E293B",
  navyLight: "#0F172A",

  green: "#4ADE80",
  greenLight: "#14532D",

  amber: "#FBBF24",
  amberLight: "#78350F",

  red: "#F87171",
  redLight: "#7F1D1D",

  blue: "#60A5FA",
  blueLight: "#1E3A8A",

  purple: "#A78BFA",
  purpleLight: "#4C1D95",

  white: "#F8FAFC",
};

// ── PALETA LIGHT ──────────────────────────────────────────────────────────────
const LIGHT = {
  bg: "#F8FAFC",
  card: "#FFFFFF",
  sidebar: "#0F172A",

  border: "#E2E8F0",
  borderLight: "#F1F5F9",

  text: "#0F172A",
  textSub: "#334155",
  textMuted: "#64748B",
  textLight: "#94A3B8",

  teal: "#0D9488",
  tealLight: "#CCFBF1",
  tealLighter: "#F0FDFA",

  navy: "#1E3A5F",
  navyLight: "#DBEAFE",

  green: "#16A34A",
  greenLight: "#DCFCE7",

  amber: "#F59E0B",
  amberLight: "#FEF3C7",

  red: "#DC2626",
  redLight: "#FEE2E2",

  blue: "#2563EB",
  blueLight: "#DBEAFE",

  purple: "#7C3AED",
  purpleLight: "#EDE9FE",

  white: "#FFFFFF",
};

// ── CSS GLOBAL WEB ────────────────────────────────────────────────────────────
const DARK_CSS = `
  body {
    background-color: #0F172A !important;
  }

  [data-theme="dark"] input,
  [data-theme="dark"] textarea,
  [data-theme="dark"] select {
    background-color: #111827 !important;
    color: #F8FAFC !important;
    border-color: #1E293B !important;
  }

  [data-theme="dark"] input::placeholder,
  [data-theme="dark"] textarea::placeholder {
    color: #64748B !important;
  }
`;

const LIGHT_CSS = `
  body {
    background-color: #F8FAFC !important;
  }
`;

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    try {
      return localStorage.getItem("vt_dark_mode") === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("vt_dark_mode", String(isDark));
    } catch {}

    if (typeof document === "undefined") return;

    document.documentElement.setAttribute(
      "data-theme",
      isDark ? "dark" : "light",
    );

    let styleEl = document.getElementById("vt-theme");

    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "vt-theme";
      document.head.appendChild(styleEl);
    }

    styleEl.textContent = isDark ? DARK_CSS : LIGHT_CSS;
  }, [isDark]);

  const toggleDark = () => setIsDark((p) => !p);

  const colors = isDark ? DARK : LIGHT;

  return (
    <ThemeCtx.Provider
      value={{
        isDark,
        toggleDark,
        colors,
        DARK,
        LIGHT,
      }}
    >
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);

  if (!ctx) {
    throw new Error("useTheme debe usarse dentro de ThemeProvider");
  }

  return ctx;
}

export { DARK as darkColors, LIGHT as lightColors };
