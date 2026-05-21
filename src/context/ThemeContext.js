import { createContext, useContext, useState, useEffect } from "react";

const ThemeCtx = createContext(null);

// ── Paletas ───────────────────────────────────────────────────────────────────
const DARK = {
  bg: "#0F172A",
  card: "#1E293B",
  sidebar: "#080E1A",
  border: "#334155",
  borderLight: "#1E293B",
  text: "#F1F5F9",
  textSub: "#CBD5E1",
  textMuted: "#94A3B8",
  textLight: "#64748B",
  teal: "#2DD4BF",
  tealLight: "#0F3330",
  tealLighter: "#0A2420",
  navy: "#1E3A5F",
  navyLight: "#1E3A5F",
  green: "#34D399",
  greenLight: "#064E3B44",
  amber: "#FBBF24",
  amberLight: "#78350F44",
  red: "#F87171",
  redLight: "#7F1D1D44",
  blue: "#60A5FA",
  blueLight: "#1E3A5F44",
  white: "#F1F5F9",
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

// ── CSS para modo oscuro ──────────────────────────────────────────────────────
// Usa selectores de atributo para sobrescribir los estilos inline de React Native Web.
// React Native Web convierte los colores hex a rgb() en los estilos inline del DOM,
// por lo que necesitamos usar !important con los valores rgb exactos.
const DARK_CSS = `
  body { background-color: #0F172A !important; }

  /* ── Fondos blancos → fondo de tarjeta oscura ── */
  [data-theme="dark"] *[style*="background-color: rgb(255, 255, 255)"],
  [data-theme="dark"] *[style*="background-color:rgb(255, 255, 255)"],
  [data-theme="dark"] *[style*="background-color: white"] {
    background-color: #1E293B !important;
  }

  /* ── Fondo gris claro (bg principal de la app) → oscuro profundo ── */
  [data-theme="dark"] *[style*="background-color: rgb(248, 250, 252)"],
  [data-theme="dark"] *[style*="background-color:rgb(248, 250, 252)"] {
    background-color: #0F172A !important;
  }

  /* ── Fondo F1F5F9 (hover, secundario) ── */
  [data-theme="dark"] *[style*="background-color: rgb(241, 245, 249)"],
  [data-theme="dark"] *[style*="background-color:rgb(241, 245, 249)"] {
    background-color: #1E293B !important;
  }

  /* ── Inputs y textareas ── */
  [data-theme="dark"] *[style*="background-color: rgb(250, 250, 250)"],
  [data-theme="dark"] *[style*="background-color:rgb(250, 250, 250)"] {
    background-color: #0F172A !important;
  }

  /* ── Texto oscuro (color principal) → claro ── */
  [data-theme="dark"] *[style*="color: rgb(15, 23, 42)"],
  [data-theme="dark"] *[style*="color:rgb(15, 23, 42)"] {
    color: #F1F5F9 !important;
  }

  /* ── Texto sub (475569) → claro ── */
  [data-theme="dark"] *[style*="color: rgb(71, 85, 105)"],
  [data-theme="dark"] *[style*="color:rgb(71, 85, 105)"] {
    color: #CBD5E1 !important;
  }

  /* ── Bordes claros → oscuros ── */
  [data-theme="dark"] *[style*="border-color: rgb(226, 232, 240)"],
  [data-theme="dark"] *[style*="border-top-color: rgb(226, 232, 240)"],
  [data-theme="dark"] *[style*="border-bottom-color: rgb(226, 232, 240)"],
  [data-theme="dark"] *[style*="border-left-color: rgb(226, 232, 240)"],
  [data-theme="dark"] *[style*="border-right-color: rgb(226, 232, 240)"] {
    border-color: #334155 !important;
  }

  /* ── Border F1F5F9 (borderLight) ── */
  [data-theme="dark"] *[style*="border-color: rgb(241, 245, 249)"],
  [data-theme="dark"] *[style*="border-top-color: rgb(241, 245, 249)"],
  [data-theme="dark"] *[style*="border-bottom-color: rgb(241, 245, 249)"] {
    border-color: #1E293B !important;
  }

  /* ── ScrollView outer wrapper (the main container) ── */
  [data-theme="dark"] div[style*="flex: 1"] > div[style*="background-color: rgb(248"] {
    background-color: #0F172A !important;
  }

  /* ── Inputs de texto ── */
  [data-theme="dark"] input, [data-theme="dark"] textarea {
    background-color: #1E293B !important;
    color: #F1F5F9 !important;
    border-color: #334155 !important;
  }

  /* ── Placeholder ── */
  [data-theme="dark"] input::placeholder, [data-theme="dark"] textarea::placeholder {
    color: #64748B !important;
  }
`;

const LIGHT_CSS = `
  body { background-color: #F8FAFC !important; }
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
