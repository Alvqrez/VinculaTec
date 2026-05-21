import { createContext, useContext, useState, useEffect } from "react";

const ThemeCtx = createContext(null);

// ── Paletas ───────────────────────────────────────────────────────────────────
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

// ── CSS oscuro ────────────────────────────────────────────────────────────────
// React Native Web convierte colores HEX a RGBA en el DOM:
//   #FFFFFF  → background-color: rgba(255, 255, 255, 1)
//   #F8FAFC  → background-color: rgba(248, 250, 252, 1)
// Los selectores deben usar rgba() para hacer match con los estilos inline.
const DARK_CSS = `
  body { background-color: #0D1117 !important; }

  /* ── Blanco puro (#FFFFFF) → card oscura ── */
  [data-theme="dark"] *[style*="rgba(255, 255, 255, 1)"],
  [data-theme="dark"] *[style*="rgba(255,255,255,1)"],
  [data-theme="dark"] *[style*="rgb(255, 255, 255)"],
  [data-theme="dark"] *[style*="rgb(255,255,255)"] {
    background-color: #161B22 !important;
  }

  /* ── Gris muy claro (#F8FAFC) → fondo principal oscuro ── */
  [data-theme="dark"] *[style*="rgba(248, 250, 252, 1)"],
  [data-theme="dark"] *[style*="rgba(248,250,252,1)"],
  [data-theme="dark"] *[style*="rgb(248, 250, 252)"],
  [data-theme="dark"] *[style*="rgb(248,250,252)"] {
    background-color: #0D1117 !important;
  }

  /* ── #F1F5F9 (secciones alt, borderLight) → intermedio ── */
  [data-theme="dark"] *[style*="rgba(241, 245, 249, 1)"],
  [data-theme="dark"] *[style*="rgba(241,245,249,1)"],
  [data-theme="dark"] *[style*="rgb(241, 245, 249)"],
  [data-theme="dark"] *[style*="rgb(241,245,249)"] {
    background-color: #1C2130 !important;
  }

  /* ── #FAFAFA (inputs) ── */
  [data-theme="dark"] *[style*="rgba(250, 250, 250, 1)"],
  [data-theme="dark"] *[style*="rgba(250,250,250,1)"],
  [data-theme="dark"] *[style*="rgb(250, 250, 250)"],
  [data-theme="dark"] *[style*="rgb(250,250,250)"] {
    background-color: #0D1117 !important;
  }

  /* ── Texto oscuro (#0F172A = rgb 15,23,42) → claro ── */
  [data-theme="dark"] *[style*="rgba(15, 23, 42, 1)"],
  [data-theme="dark"] *[style*="rgba(15,23,42,1)"],
  [data-theme="dark"] *[style*="rgb(15, 23, 42)"],
  [data-theme="dark"] *[style*="rgb(15,23,42)"] {
    color: #E6EDF3 !important;
  }

  /* ── Texto sub (#475569 = rgb 71,85,105) → gris claro ── */
  [data-theme="dark"] *[style*="rgba(71, 85, 105, 1)"],
  [data-theme="dark"] *[style*="rgba(71,85,105,1)"],
  [data-theme="dark"] *[style*="rgb(71, 85, 105)"],
  [data-theme="dark"] *[style*="rgb(71,85,105)"] {
    color: #8B949E !important;
  }

  /* ── Bordes claros (#E2E8F0 = rgb 226,232,240) ── */
  [data-theme="dark"] *[style*="rgba(226, 232, 240, 1)"],
  [data-theme="dark"] *[style*="rgba(226,232,240,1)"],
  [data-theme="dark"] *[style*="rgb(226, 232, 240)"],
  [data-theme="dark"] *[style*="rgb(226,232,240)"] {
    border-color: #30363D !important;
  }
  [data-theme="dark"] *[style*="border-top-color: rgba(226, 232, 240, 1)"],
  [data-theme="dark"] *[style*="border-bottom-color: rgba(226, 232, 240, 1)"],
  [data-theme="dark"] *[style*="border-left-color: rgba(226, 232, 240, 1)"],
  [data-theme="dark"] *[style*="border-right-color: rgba(226, 232, 240, 1)"] {
    border-color: #30363D !important;
  }

  /* ── Borde borderLight (#F1F5F9 = rgb 241,245,249) ── */
  [data-theme="dark"] *[style*="border-top-color: rgba(241, 245, 249, 1)"],
  [data-theme="dark"] *[style*="border-bottom-color: rgba(241, 245, 249, 1)"] {
    border-color: #21262D !important;
  }

  /* ── Inputs HTML nativos ── */
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
