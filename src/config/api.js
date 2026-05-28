/**
 * Configuración centralizada de la API
 *
 * SETUP PARA DESARROLLO (cada miembro del equipo):
 * 1. Copia .env.local.example → .env.local en la raíz del proyecto
 * 2. Pon la IP o URL ngrok de la máquina que corre el backend:
 *      REACT_APP_API_URL=http://192.168.x.x:3001/api
 *    O con ngrok:
 *      REACT_APP_API_URL=https://xxxx.ngrok-free.dev/api
 * 3. Reinicia Expo (Ctrl+C y vuelve a correr)
 *
 * OBTENER TU IP LOCAL:
 *   Windows : ipconfig  → "Dirección IPv4"
 *   Mac/Linux: ifconfig | grep "inet "
 */

import { REACT_APP_API_URL } from "@env";

const isDevelopment = process.env.NODE_ENV === "development";

const isLocalhost = (() => {
  try {
    if (typeof window === "undefined") return false;
    if (!window.location) return false;
    return (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    );
  } catch {
    return false;
  }
})();

const isMobile = (() => {
  try {
    return (
      typeof navigator !== "undefined" && navigator.product === "ReactNative"
    );
  } catch {
    return false;
  }
})();

// Prioridad: variable de entorno → fallback solo si estamos en localhost
const API_BASE =
  REACT_APP_API_URL || (isLocalhost ? "http://localhost:3001/api" : null);

if (!API_BASE) {
  console.error(
    "[API] ❌ No se pudo determinar la URL del backend.\n" +
      "Crea un archivo .env.local en la raíz del proyecto con:\n" +
      "REACT_APP_API_URL=http://TU_IP:3001/api\n" +
      "(o la URL de ngrok si usas dispositivo externo)",
  );
}

if (isDevelopment && API_BASE) {
  console.log("[API] ✅ Backend URL:", API_BASE);
}

// WS_BASE: quita "/api" del final para apuntar al servidor raíz de Socket.IO
const WS_BASE = API_BASE ? API_BASE.replace(/\/api\/?$/, "") : null;

const checkApiHealth = async () => {
  if (!API_BASE) return false;
  try {
    const response = await fetch(
      `${API_BASE.replace(/\/api\/?$/, "")}/api/health`,
      { method: "GET", mode: "cors" },
    );
    return response.ok;
  } catch (error) {
    console.warn("[API] No se puede conectar al backend:", error.message);
    return false;
  }
};

export {
  API_BASE,
  WS_BASE,
  checkApiHealth,
  isDevelopment,
  isLocalhost,
  isMobile,
};
