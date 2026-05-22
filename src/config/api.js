/**
 * Configuración centralizada de la API
 * Soporta: localhost, ngrok, y producción
 * 
 * IMPORTANTE PARA MÓVIL:
 * - En dispositivos físicos/emuladores, window.location NO existe
 * - Debes usar ngrok o definir REACT_APP_API_URL en .env.local
 * 
 * Para usar ngrok:
 * 1. Instalar: npm install -g ngrok (o descargar de ngrok.com)
 * 2. Iniciar backend: cd backend && node server.js
 * 3. Iniciar ngrok: ngrok http 3001
 * 4. Copiar la URL HTTPS (ej: https://abc123.ngrok-free.dev)
 * 5. Crear archivo .env.local en la raíz con:
 *    REACT_APP_API_URL=https://abc123.ngrok-free.dev/api
 * 6. Reiniciar Expo
 */

// Detectar automáticamente el ambiente
const isDevelopment = process.env.NODE_ENV === 'development';

// En React Native móvil, window existe pero window.location es undefined
// En navegador web, window.location.hostname existe
const isLocalhost = (() => {
  try {
    if (typeof window === 'undefined') return false;
    if (!window.location) return false;
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1';
  } catch (e) {
    return false;
  }
})();

// Detectar si estamos en React Native móvil (no web)
const isMobile = (() => {
  try {
    // En React Native, navigator.product es 'ReactNative'
    // En navegador, no existe o es diferente
    return typeof navigator !== 'undefined' && 
           navigator.product === 'ReactNative';
  } catch (e) {
    return false;
  }
})();

// URLs por defecto según ambiente
// INSTRUCCIONES: Edita la URL según tu configuración:
// - 'localhost' = solo en tu laptop (navegador)
// - 'local' = para probar en móvil vía WiFi (misma red)
// - 'ngrok' = para compartir con dispositivos externos (internet)
const DEFAULT_URLS = {
  // Para desarrollo local (solo navegador web en tu laptop)
  localhost: 'http://localhost:3001/api',
  // Para móvil en misma red WiFi (reemplaza con tu IP actual)
  // Obtén tu IP con: ipconfig → IPv4 Address
  local: 'http://192.168.100.10:3001/api',
  // Para ngrok (compartir con dispositivos externos por internet)
  // ngrok: 'https://abc123-def456.ngrok-free.dev/api',
  // Para producción
  production: 'https://tu-dominio-produccion.com/api'
};

// Variable de entorno tiene prioridad absoluta
const envUrl = process.env.REACT_APP_API_URL;

// Lógica de selección de URL:
// 1. Si hay REACT_APP_API_URL definida, usar esa (prioridad máxima)
// 2. Si estamos en localhost (navegador web), usar localhost
// 3. Si estamos en móvil, usar IP local (misma red WiFi)
// 4. Fallback: usar IP local
const API_BASE = envUrl || (isLocalhost ? DEFAULT_URLS.localhost : DEFAULT_URLS.local);

// Log para debugging (solo en desarrollo)
if (isDevelopment) {
  console.log('[API] Configuración:', {
    isLocalhost,
    isMobile,
    envUrl: envUrl || 'no definida',
    apiBase: API_BASE
  });
}

// WebSocket URL (mismo host pero sin /api)
const WS_BASE = API_BASE.replace('/api', '');

// Helper para verificar conectividad
const checkApiHealth = async () => {
  try {
    const response = await fetch(`${API_BASE.replace('/api', '')}/api/health`, { 
      method: 'GET',
      mode: 'cors'
    });
    return response.ok;
  } catch (error) {
    console.warn('[API] No se puede conectar al backend:', error.message);
    return false;
  }
};

export { API_BASE, WS_BASE, DEFAULT_URLS, checkApiHealth, isDevelopment, isLocalhost };
