/**
 * Configuración centralizada de la API
 * Permite cambiar fácilmente entre ambientes (dev, staging, prod)
 */

// URL base de la API - se puede sobrescribir con variable de entorno
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:3001/api";

export { API_BASE };
