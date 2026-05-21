import { createContext, useContext, useState, useEffect } from "react";

const ThemeCtx = createContext(null);

// ── Paleta oscura ─────────────────────────────────────────────────────────────
const DARK = {
  bg:          "#0F172A",
  card:        "#1E293B",
  sidebar:     "#080E1A",
  border:      "#334155",
  borderLight: "#1E293B",
  text:        "#F1F5F9",
  textSub:     "#CBD5E1",
  textMuted:   "#94A3B8",
  textLight:   "#64748B",
  teal:        "#2DD4BF",
  tealLight:   "#0F3330",
  tealLighter: "#0A2420",
  navy:        "#3B82F6",
  navyLight:   "#1E3A5F",
  green:       "#34D399",
  greenLight:  "#064E3B44",
  amber:       "#FBBF24",
  amberLight:  "#78350F44",
  red:         "#F87171",
  redLight:    "#7F1D1D44",
  blue:        "#60A5FA",
  blueLight:   "#1E3A5F44",
  white:       "#F1F5F9",
};

// ── Paleta clara (valores originales de colors.js) ────────────────────────────
const LIGHT = {
  bg:          "#F8FAFC",
  card:        "#FFFFFF",
  sidebar:     "#0F172A",
  border:      "#E2E8F0",
  borderLight: "#F1F5F9",
  text:        "#0F172A",
  textSub:     "#475569",
  textMuted:   "#94A3B8",
  textLight:   "#CBD5E1",
  teal:        "#0D9488",
  tealLight:   "#F0FDFA",
  tealLighter: "#CCFBF1",
  navy:        "#1E3A5F",
  navyLight:   "#EFF6FF",
  green:       "#10B981",
  greenLight:  "#D1FAE5",
  amber:       "#F59E0B",
  amberLight:  "#FEF3C7",
  red:         "#EF4444",
  redLight:    "#FEE2E2",
  blue:        "#3B82F6",
  blueLight:   "#EFF6FF",
  white:       "#FFFFFF",
};

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    try { return localStorage.getItem("vt_dark_mode") === "true"; }
    catch { return false; }
  });

  useEffect(() => {
    try { localStorage.setItem("vt_dark_mode", String(isDark)); } catch {}

    // Para web: inyecta CSS que afecta el fondo del body y variables globales
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");

    let styleEl = document.getElementById("vt-theme");
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "vt-theme";
      document.head.appendChild(styleEl);
    }

    if (isDark) {
      styleEl.textContent = `
        body { background-color: #0F172A !important; }
        :root {
          --vt-bg: #0F172A;
          --vt-card: #1E293B;
          --vt-text: #F1F5F9;
          --vt-border: #334155;
          --vt-teal: #2DD4BF;
        }
      `;
    } else {
      styleEl.textContent = `
        body { background-color: #F8FAFC !important; }
        :root {
          --vt-bg: #F8FAFC;
          --vt-card: #FFFFFF;
          --vt-text: #0F172A;
          --vt-border: #E2E8F0;
          --vt-teal: #0D9488;
        }
      `;
    }
  }, [isDark]);

  const toggleDark = () => setIsDark((p) => !p);
  const colors     = isDark ? DARK : LIGHT;

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

// Exportar paletas para que otros componentes puedan importarlas si las necesitan
export { DARK as darkColors, LIGHT as lightColors };
