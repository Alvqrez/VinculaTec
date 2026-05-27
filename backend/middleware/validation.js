/**
 * Middleware de Validación Unificado
 * Proporciona validación centralizada para endpoints
 */

const { createError, ERROR_CODES, validators } = require('../utils/errorCodes');

// Middleware principal de validación
const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      // Validar body si existe en schema
      if (schema.body) {
        validateObject(req.body, schema.body, 'body');
      }

      // Validar params si existe en schema
      if (schema.params) {
        validateObject(req.params, schema.params, 'params');
      }

      // Validar query si existe en schema
      if (schema.query) {
        validateObject(req.query, schema.query, 'query');
      }

      next();
    } catch (error) {
      return res.status(400).json({
        ok: false,
        error: error.toJSON()
      });
    }
  };
};

// Función de validación de objetos
const validateObject = (obj, schema, context) => {
  if (!obj || typeof obj !== 'object') {
    throw createError(ERROR_CODES.VALIDATION.INVALID_FORMAT, 
      `${context} debe ser un objeto válido`);
  }

  for (const [field, rules] of Object.entries(schema)) {
    const value = obj[field];
    const fieldPath = `${context}.${field}`;

    // Validar campos requeridos
    if (rules.required && (value === undefined || value === null || value === '')) {
      throw createError(ERROR_CODES.VALIDATION.REQUIRED_FIELD, 
        `El campo ${field} es requerido`);
    }

    // Si el campo no es requerido y está vacío, continuar
    if (!rules.required && (value === undefined || value === null || value === '')) {
      continue;
    }

    // Validar tipo
    if (rules.type && typeof value !== rules.type) {
      throw createError(ERROR_CODES.VALIDATION.INVALID_FORMAT, 
        `El campo ${field} debe ser de tipo ${rules.type}`);
    }

    // Validaciones específicas
    if (rules.enum) {
      validators.enum(value, rules.enum, field);
    }

    if (rules.email) {
      validators.email(value);
    }

    if (rules.numeric) {
      validators.numeric(value, field);
    }

    if (rules.minLength || rules.maxLength) {
      validators.length(value, rules.minLength || 0, rules.maxLength || 1000, field);
    }

    if (rules.min !== undefined || rules.max !== undefined) {
      const numValue = Number(value);
      if (rules.min !== undefined && numValue < rules.min) {
        throw createError(ERROR_CODES.VALIDATION.INVALID_RANGE, 
          `El campo ${field} debe ser mayor o igual a ${rules.min}`);
      }
      if (rules.max !== undefined && numValue > rules.max) {
        throw createError(ERROR_CODES.VALIDATION.INVALID_RANGE, 
          `El campo ${field} debe ser menor o igual a ${rules.max}`);
      }
    }

    // Validación personalizada
    if (rules.custom && typeof rules.custom === 'function') {
      rules.custom(value, field);
    }
  }
};

// Schemas de validación predefinidos
const schemas = {
  // Notificaciones
  createNotification: {
    body: {
      // BUG FIX: usuario_id es string (ej: "u_1234_abc"), no número
      usuario_id: { type: 'string', required: true },
      tipo_notificacion: { 
        type: 'string', 
        required: true, 
        enum: ['REVISION', 'AVANCE', 'SISTEMA'] 
      },
      titulo: { type: 'string', required: true, minLength: 1, maxLength: 255 },
      mensaje: { type: 'string', required: true, minLength: 1 },
      icon: { type: 'string', required: false, maxLength: 50 },
      icon_color: { type: 'string', required: false, maxLength: 20 },
      icon_bg: { type: 'string', required: false, maxLength: 20 },
      proyecto_id: { type: 'number', required: false, numeric: true },
      fase: { type: 'string', required: false, maxLength: 50 },
      action_screen: { type: 'string', required: false, maxLength: 50 },
      action_label: { type: 'string', required: false, maxLength: 100 }
    }
  },

  markNotificationRead: {
    params: {
      id: { type: 'string', required: true, custom: (value) => {
        if (isNaN(parseInt(value))) {
          throw createError(ERROR_CODES.VALIDATION.INVALID_FORMAT, 
            'ID debe ser un número válido');
        }
      }}
    }
  },

  // Proyectos
  solicitarAvance: {
    params: {
      id: { type: 'string', required: true, numeric: true }
    }
  },

  aprobarAvance: {
    params: {
      id: { type: 'string', required: true, numeric: true }
    },
    body: {
      comentarios: { type: 'string', required: false, maxLength: 1000 },
      fase_destino: { 
        type: 'string', 
        required: false, 
        enum: ['desarrollo', 'revision', 'concluido'] 
      }
    }
  },

  // Reportes
  revisarReporte: {
    params: {
      id: { type: 'string', required: true, numeric: true }
    },
    body: {
      estado: { 
        type: 'string', 
        required: true, 
        enum: ['Aprobado', 'Rechazado'] 
      },
      feedback: { type: 'string', required: false, maxLength: 2000 },
      calificacion: { type: 'number', required: false, min: 0, max: 100 }
    }
  },

  // Residentes (paginación)
  getResidentes: {
    query: {
      page: { type: 'string', required: false, custom: (value) => {
        const page = parseInt(value);
        if (isNaN(page) || page < 1) {
          throw createError(ERROR_CODES.VALIDATION.INVALID_RANGE, 
            'Page debe ser un número mayor o igual a 1');
        }
      }},
      limit: { type: 'string', required: false, custom: (value) => {
        const limit = parseInt(value);
        if (isNaN(limit) || limit < 1 || limit > 50) {
          throw createError(ERROR_CODES.VALIDATION.INVALID_RANGE, 
            'Limit debe ser un número entre 1 y 50');
        }
      }}
    }
  }
};

// Middleware de manejo de errores global
const errorHandler = (err, req, res, next) => {
  // Si es un error conocido de nuestra aplicación
  const isKnownError = Object.values(ERROR_CODES).some(category => 
    Object.values(category).includes(err.code)
  );
  
  if (err.code && isKnownError) {
    
    const statusCode = getStatusCode(err.code);
    return res.status(statusCode).json({
      ok: false,
      error: err.toJSON()
    });
  }

  // Errores de JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      ok: false,
      error: createError(ERROR_CODES.AUTH.INVALID_TOKEN).toJSON()
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      ok: false,
      error: createError(ERROR_CODES.AUTH.TOKEN_EXPIRED).toJSON()
    });
  }

  // Errores de sintaxis JSON
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      ok: false,
      error: createError(ERROR_CODES.VALIDATION.INVALID_FORMAT, 
        'JSON malformado en el cuerpo de la solicitud').toJSON()
    });
  }

  // Error interno del servidor (loggear para debugging)
  console.error('Error no manejado:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
    user: req.user?.id,
    timestamp: new Date().toISOString()
  });

  return res.status(500).json({
    ok: false,
    error: createError(ERROR_CODES.SYSTEM.INTERNAL_ERROR).toJSON()
  });
};

// Función para obtener código de estado HTTP basado en código de error
const getStatusCode = (errorCode) => {
  if (errorCode >= ERROR_CODES.AUTH.INVALID_TOKEN && errorCode <= ERROR_CODES.AUTH.INVALID_CREDENTIALS) {
    return 401;
  }
  if (errorCode === ERROR_CODES.AUTH.FORBIDDEN) {
    return 403;
  }
  if (errorCode >= ERROR_CODES.VALIDATION.REQUIRED_FIELD && errorCode <= ERROR_CODES.VALIDATION.PASSWORD_TOO_WEAK) {
    return 400;
  }
  if (errorCode >= ERROR_CODES.BUSINESS.PROJECT_NOT_FOUND && errorCode <= ERROR_CODES.BUSINESS.NOTIFICATION_NOT_FOUND) {
    return 404;
  }
  if (errorCode >= ERROR_CODES.DATABASE.CONNECTION_ERROR && errorCode <= ERROR_CODES.DATABASE.TRANSACTION_FAILED) {
    return 500;
  }
  if (errorCode >= ERROR_CODES.NETWORK.TIMEOUT && errorCode <= ERROR_CODES.NETWORK.INVALID_RESPONSE) {
    return 503;
  }
  return 500;
};

module.exports = {
  validateRequest,
  schemas,
  errorHandler,
  validateObject
};
