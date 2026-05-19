import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

// ── Storage helpers (compatibles con web y React Native) ───────────────────
const storage = {
  getItem: (key) => {
    try { return globalThis?.localStorage?.getItem(key) ?? null; } catch { return null; }
  },
  setItem: (key, value) => {
    try { globalThis?.localStorage?.setItem(key, value); } catch { /* sin storage */ }
  },
  removeItem: (key) => {
    try { globalThis?.localStorage?.removeItem(key); } catch { /* sin storage */ }
  },
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);

  useEffect(() => {
    const stored = storage.getItem("authToken");
    if (stored) setToken(stored);
  }, []);

  const guardarToken = (nuevoToken) => {
    setToken(nuevoToken);
    if (nuevoToken) {
      storage.setItem("authToken", nuevoToken);
    } else {
      storage.removeItem("authToken");
    }
  };

  return (
    <AuthContext.Provider value={{ token, getToken: () => token, guardarToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return context;
}

// ── Helpers de token (singleton sobre storage) ─────────────────────────────
// Usados por App.js y DashAsesor.js directamente (sin contexto React)
export function setAuthToken(token) {
  if (token) {
    storage.setItem("authToken", token);
  } else {
    storage.removeItem("authToken");
  }
}

export function getAuthToken() {
  return storage.getItem("authToken");
}
