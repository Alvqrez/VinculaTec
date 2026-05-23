/**
 * Configuración centralizada de la API
 *
 * SEGURIDAD FIX #11: Eliminada la IP local hardcodeada del código fuente.
 * Ahora se configura mediante variables de entorno o archivo .env.local
 *
 * SETUP PARA DESARROLLO:
 * 1. Copia el archivo .env.example a .env.local en la raíz del proyecto
 * 2. Define REACT_APP_API_URL con la URL correcta según tu ambiente:
 *    - localhost (solo navegador):  http://localhost:3001/api
 *    - WiFi (dispositivo físico):   http://TU_IP_AQUI:3001/api
 *    - ngrok (externo):             https://xxxx.ngrok-free.dev/api
 * 3. Reinicia Expo
 *
 * OBTENER TU IP LOCAL:
 *   Windows: ipconfig → "Dirección IPv4"
 *   Mac/Linux: ifconfig | grep "inet "
 */

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

// SEGURIDAD FIX #11: La IP local ya no está hardcodeada aquí.
// Se obtiene de la variable de entorno REACT_APP_API_URL definida en .env.local
const envUrl = process.env.REACT_APP_API_URL;

// Fallback solo para entorno localhost (navegador en la misma máquina)
// Para móvil o dispositivos externos, REACT_APP_API_URL es obligatorio
const API_BASE = envUrl || (isLocalhost ? "http://localhost:3001/api" : null);

if (!API_BASE) {
  console.error(
    "[API] ERROR: No se pudo determinar la URL del backend.\n" +
    "Crea un archivo .env.local en la raíz del proyecto con:\n" +
    "REACT_APP_API_URL=http://TU_IP:3001/api"
  );
}

if (isDevelopment) {
  console.log("[API] Configuración:", {
    isLocalhost,
    isMobile,
    envUrl: envUrl || "no definida",
    apiBase: API_BASE || "NO CONFIGURADA",
  });
}

const WS_BASE = API_BASE ? API_BASE.replace("/api", "") : null;

const checkApiHealth = async () => {
  if (!API_BASE) return false;
  try {
    const response = await fetch(`${API_BASE.replace("/api", "")}/api/health`, {
      method: "GET",
      mode: "cors",
    });
    return response.ok;
  } catch (error) {
    console.warn("[API] No se puede conectar al backend:", error.message);
    return false;
  }
};

export { API_BASE, WS_BASE, checkApiHealth, isDevelopment, isLocalhost, isMobile };
