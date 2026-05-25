/**
 * Sistema Centralizado de Códigos de Error
 * Proporciona códigos consistentes para todo el sistema
 */

// Códigos de error por categoría
const ERROR_CODES = {
  // Errores de Autenticación (1000-1099)
  AUTH: {
    INVALID_TOKEN: 1001,
    TOKEN_EXPIRED: 1002,
    UNAUTHORIZED: 1003,
    FORBIDDEN: 1004,
    INVALID_CREDENTIALS: 1005,
  },

  // Errores de Validación (1100-1199)
  VALIDATION: {
    REQUIRED_FIELD: 1101,
    INVALID_FORMAT: 1102,
    INVALID_LENGTH: 1103,
    INVALID_RANGE: 1104,
    INVALID_ENUM: 1105,
    EMAIL_INVALID: 1106,
    PASSWORD_TOO_WEAK: 1107,
  },

  // Errores de Negocio (1200-1299)
  BUSINESS: {
    PROJECT_NOT_FOUND: 1201,
    REPORT_NOT_FOUND: 1202,
    RESIDENTE_NOT_FOUND: 1203,
    ASESOR_NOT_FOUND: 1204,
    PROJECT_ALREADY_CONCLUDED: 1205,
    INVALID_PHASE_TRANSITION: 1206,
    NO_PENDING_ADVANCE_REQUEST: 1207,
    REPORT_ALREADY_REVIEWED: 1208,
    NOTIFICATION_NOT_FOUND: 1209,
  },

  // Errores de Base de Datos (1300-1399)
  DATABASE: {
    CONNECTION_ERROR: 1301,
    DUPLICATE_ENTRY: 1302,
    FOREIGN_KEY_VIOLATION: 1303,
    CONSTRAINT_VIOLATION: 1304,
    QUERY_TIMEOUT: 1305,
    TRANSACTION_FAILED: 1306,
  },

  // Errores de Red/Servicio (1400-1499)
  NETWORK: {
    TIMEOUT: 1401,
    SERVICE_UNAVAILABLE: 1402,
    RATE_LIMIT_EXCEEDED: 1403,
    INVALID_RESPONSE: 1404,
  },

  // Errores del Sistema (1500-1599)
  SYSTEM: {
    INTERNAL_ERROR: 1501,
    CONFIGURATION_ERROR: 1502,
    FILE_NOT_FOUND: 1503,
    PERMISSION_DENIED: 1504,
    UNKNOWN_ERROR: 1599,
  }
};

// Mapeo de códigos a mensajes (para desarrollo)
const ERROR_MESSAGES = {
  [ERROR_CODES.AUTH.INVALID_TOKEN]: "Token de autenticación inválido",
  [ERROR_CODES.AUTH.TOKEN_EXPIRED]: "Token de autenticación expirado",
  [ERROR_CODES.AUTH.UNAUTHORIZED]: "No autorizado para esta operación",
  [ERROR_CODES.AUTH.FORBIDDEN]: "Acceso denegado",
  [ERROR_CODES.AUTH.INVALID_CREDENTIALS]: "Credenciales inválidas",

  [ERROR_CODES.VALIDATION.REQUIRED_FIELD]: "Campo requerido faltante",
  [ERROR_CODES.VALIDATION.INVALID_FORMAT]: "Formato de campo inválido",
  [ERROR_CODES.VALIDATION.INVALID_LENGTH]: "Longitud de campo inválida",
  [ERROR_CODES.VALIDATION.INVALID_RANGE]: "Valor fuera de rango permitido",
  [ERROR_CODES.VALIDATION.INVALID_ENUM]: "Valor de enumeración inválido",
  [ERROR_CODES.VALIDATION.EMAIL_INVALID]: "Formato de email inválido",
  [ERROR_CODES.VALIDATION.PASSWORD_TOO_WEAK]: "Contraseña demasiado débil",

  [ERROR_CODES.BUSINESS.PROJECT_NOT_FOUND]: "Proyecto no encontrado",
  [ERROR_CODES.BUSINESS.REPORT_NOT_FOUND]: "Reporte no encontrado",
  [ERROR_CODES.BUSINESS.RESIDENTE_NOT_FOUND]: "Residente no encontrado",
  [ERROR_CODES.BUSINESS.ASESOR_NOT_FOUND]: "Asesor no encontrado",
  [ERROR_CODES.BUSINESS.PROJECT_ALREADY_CONCLUDED]: "El proyecto ya está concluido",
  [ERROR_CODES.BUSINESS.INVALID_PHASE_TRANSITION]: "Transición de fase inválida",
  [ERROR_CODES.BUSINESS.NO_PENDING_ADVANCE_REQUEST]: "No hay solicitud de avance pendiente",
  [ERROR_CODES.BUSINESS.REPORT_ALREADY_REVIEWED]: "El reporte ya ha sido revisado",
  [ERROR_CODES.BUSINESS.NOTIFICATION_NOT_FOUND]: "Notificación no encontrada",

  [ERROR_CODES.DATABASE.CONNECTION_ERROR]: "Error de conexión a la base de datos",
  [ERROR_CODES.DATABASE.DUPLICATE_ENTRY]: "Entrada duplicada en la base de datos",
  [ERROR_CODES.DATABASE.FOREIGN_KEY_VIOLATION]: "Violación de clave foránea",
  [ERROR_CODES.DATABASE.CONSTRAINT_VIOLATION]: "Violación de restricción",
  [ERROR_CODES.DATABASE.QUERY_TIMEOUT]: "Tiempo de consulta agotado",
  [ERROR_CODES.DATABASE.TRANSACTION_FAILED]: "Transacción fallida",

  [ERROR_CODES.NETWORK.TIMEOUT]: "Tiempo de espera agotado",
  [ERROR_CODES.NETWORK.SERVICE_UNAVAILABLE]: "Servicio no disponible",
  [ERROR_CODES.NETWORK.RATE_LIMIT_EXCEEDED]: "Límite de solicitudes excedido",
  [ERROR_CODES.NETWORK.INVALID_RESPONSE]: "Respuesta inválida del servicio",

  [ERROR_CODES.SYSTEM.INTERNAL_ERROR]: "Error interno del servidor",
  [ERROR_CODES.SYSTEM.CONFIGURATION_ERROR]: "Error de configuración",
  [ERROR_CODES.SYSTEM.FILE_NOT_FOUND]: "Archivo no encontrado",
  [ERROR_CODES.SYSTEM.PERMISSION_DENIED]: "Permiso denegado",
  [ERROR_CODES.SYSTEM.UNKNOWN_ERROR]: "Error desconocido",
};

// Clase de error personalizada
class AppError extends Error {
  constructor(code, message = null, details = null) {
    super(message || ERROR_MESSAGES[code] || "Error desconocido");
    this.code = code;
    this.details = details;
    this.isOperational = true;
  }

  toJSON() {
    return {
      error: true,
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: new Date().toISOString()
    };
  }
}

// Funciones helper
const createError = (code, message = null, details = null) => {
  return new AppError(code, message, details);
};

const isOperationalError = (error) => {
  return error.isOperational === true;
};

const getErrorCode = (error) => {
  if (error instanceof AppError) return error.code;
  return ERROR_CODES.SYSTEM.UNKNOWN_ERROR;
};

// Validaciones comunes
const validators = {
  required: (value, fieldName) => {
    if (value === null || value === undefined || value === '') {
      throw createError(ERROR_CODES.VALIDATION.REQUIRED_FIELD, `El campo ${fieldName} es requerido`);
    }
  },

  email: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw createError(ERROR_CODES.VALIDATION.EMAIL_INVALID);
    }
  },

  enum: (value, allowedValues, fieldName) => {
    if (!allowedValues.includes(value)) {
      throw createError(ERROR_CODES.VALIDATION.INVALID_ENUM, 
        `${fieldName} debe ser uno de: ${allowedValues.join(', ')}`);
    }
  },

  length: (value, min, max, fieldName) => {
    if (value.length < min || value.length > max) {
      throw createError(ERROR_CODES.VALIDATION.INVALID_LENGTH, 
        `${fieldName} debe tener entre ${min} y ${max} caracteres`);
    }
  },

  numeric: (value, fieldName) => {
    if (isNaN(Number(value))) {
      throw createError(ERROR_CODES.VALIDATION.INVALID_FORMAT, 
        `${fieldName} debe ser un número válido`);
    }
  }
};

module.exports = {
  ERROR_CODES,
  ERROR_MESSAGES,
  AppError,
  createError,
  isOperationalError,
  getErrorCode,
  validators
};
