import React, { createContext, useContext, useState, useEffect } from "react";
import { Platform } from "react-native";

// Importar AsyncStorage solo para plataformas móviles
let AsyncStorage = null;
if (Platform.OS !== "web") {
  try {
    AsyncStorage = require("@react-native-async-storage/async-storage").default;
  } catch {
    console.warn("AsyncStorage no disponible");
  }
}

const AuthContext = createContext();

// ── Storage helpers (compatibles con web y React Native) ───────────────────
const storage = {
  getItem: async (key) => {
    // React Native: usar AsyncStorage
    if (Platform.OS !== "web" && AsyncStorage) {
      try {
        return await AsyncStorage.getItem(key);
      } catch {
        return null;
      }
    }
    // Web: usar localStorage
    try {
      return globalThis?.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  },
  setItem: async (key, value) => {
    // React Native: usar AsyncStorage
    if (Platform.OS !== "web" && AsyncStorage) {
      try {
        await AsyncStorage.setItem(key, value);
      } catch { /* sin storage */ }
      return;
    }
    // Web: usar localStorage
    try {
      globalThis?.localStorage?.setItem(key, value);
    } catch { /* sin storage */ }
  },
  removeItem: async (key) => {
    // React Native: usar AsyncStorage
    if (Platform.OS !== "web" && AsyncStorage) {
      try {
        await AsyncStorage.removeItem(key);
      } catch { /* sin storage */ }
      return;
    }
    // Web: usar localStorage
    try {
      globalThis?.localStorage?.removeItem(key);
    } catch { /* sin storage */ }
  },
};

// ── Token cache (síncrono para apiClient) ─────────────────────────────────
let tokenCache = null;

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [isReady, setIsReady] = useState(false);

  // Cargar token al inicio (asíncrono)
  useEffect(() => {
    let isMounted = true;
    const loadToken = async () => {
      const stored = await storage.getItem("authToken");
      if (isMounted && stored) {
        setToken(stored);
        tokenCache = stored;
      }
      setIsReady(true);
    };
    loadToken();
    return () => { isMounted = false; };
  }, []);

  const guardarToken = async (nuevoToken) => {
    setToken(nuevoToken);
    tokenCache = nuevoToken;
    if (nuevoToken) {
      await storage.setItem("authToken", nuevoToken);
    } else {
      await storage.removeItem("authToken");
    }
  };

  if (!isReady) {
    return null; // O un loading spinner si prefieres
  }

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
// NOTA: Ahora son async para soportar AsyncStorage en móvil
export async function setAuthToken(token) {
  tokenCache = token;
  if (token) {
    await storage.setItem("authToken", token);
  } else {
    await storage.removeItem("authToken");
  }
}

// Para compatibilidad con código existente (síncrono)
// Lee del caché en memoria (actualizado por AuthProvider)
export function getAuthToken() {
  return tokenCache;
}
