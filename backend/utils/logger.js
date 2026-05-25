/**
 * Sistema de Logging Centralizado
 * Proporciona logging estructurado para monitoreo y debugging
 */

const fs = require('fs');
const path = require('path');

// Configuración de logs
const LOG_CONFIG = {
  levels: {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
  },
  currentLevel: process.env.LOG_LEVEL === 'DEBUG' ? 3 : 
                 process.env.LOG_LEVEL === 'INFO' ? 2 : 
                 process.env.LOG_LEVEL === 'WARN' ? 1 : 0,
  logDir: path.join(__dirname, '../../logs'),
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 5
};

// Asegurar que el directorio de logs existe
if (!fs.existsSync(LOG_CONFIG.logDir)) {
  fs.mkdirSync(LOG_CONFIG.logDir, { recursive: true });
}

// Función para formatear timestamp
const formatTimestamp = () => {
  return new Date().toISOString();
};

// Función para obtener nombre de archivo de log
const getLogFileName = (level) => {
  const date = new Date().toISOString().split('T')[0];
  return `${level.toLowerCase()}-${date}.log`;
};

// Función para rotar logs si es necesario
const rotateLogIfNeeded = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      if (stats.size > LOG_CONFIG.maxFileSize) {
        // Rotar archivo
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const rotatedPath = filePath.replace('.log', `-${timestamp}.log`);
        fs.renameSync(filePath, rotatedPath);
        
        // Limpiar archivos viejos
        const files = fs.readdirSync(LOG_CONFIG.logDir)
          .filter(file => file.includes(filePath.split('/').pop().replace('.log', '')))
          .sort()
          .reverse();
        
        if (files.length > LOG_CONFIG.maxFiles) {
          const filesToDelete = files.slice(LOG_CONFIG.maxFiles);
          filesToDelete.forEach(file => {
            fs.unlinkSync(path.join(LOG_CONFIG.logDir, file));
          });
        }
      }
    }
  } catch (error) {
    console.error('Error rotating log:', error);
  }
};

// Función principal de logging
const writeLog = (level, message, meta = {}) => {
  if (LOG_CONFIG.levels[level] > LOG_CONFIG.currentLevel) {
    return;
  }

  const timestamp = formatTimestamp();
  const logEntry = {
    timestamp,
    level,
    message,
    ...meta
  };

  // Formato para archivo
  const logLine = JSON.stringify(logEntry) + '\n';

  // Escribir a archivo
  const logFile = path.join(LOG_CONFIG.logDir, getLogFileName(level));
  rotateLogIfNeeded(logFile);
  
  try {
    fs.appendFileSync(logFile, logLine);
  } catch (error) {
    console.error('Error writing to log file:', error);
  }

  // También mostrar en consola para desarrollo
  if (process.env.NODE_ENV !== 'production') {
    const colorMap = {
      ERROR: '\x1b[31m', // Rojo
      WARN: '\x1b[33m',  // Amarillo
      INFO: '\x1b[36m',  // Cyan
      DEBUG: '\x1b[37m'  // Blanco
    };
    const reset = '\x1b[0m';
    console.log(`${colorMap[level]}[${timestamp}] ${level}: ${message}${reset}`);
    if (Object.keys(meta).length > 0) {
      console.log('Meta:', JSON.stringify(meta, null, 2));
    }
  }
};

// Logger principal
const logger = {
  error: (message, meta = {}) => {
    writeLog('ERROR', message, meta);
  },

  warn: (message, meta = {}) => {
    writeLog('WARN', message, meta);
  },

  info: (message, meta = {}) => {
    writeLog('INFO', message, meta);
  },

  debug: (message, meta = {}) => {
    writeLog('DEBUG', message, meta);
  },

  // Logging específico para errores de aplicación
  logAppError: (error, req = null, additionalMeta = {}) => {
    const meta = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code
      },
      ...additionalMeta
    };

    if (req) {
      meta.request = {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body,
        params: req.params,
        query: req.query,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id,
        userRole: req.user?.rol
      };
    }

    writeLog('ERROR', `Application Error: ${error.message}`, meta);
  },

  // Logging para operaciones de negocio
  logBusinessOperation: (operation, userId, details = {}) => {
    writeLog('INFO', `Business Operation: ${operation}`, {
      operation,
      userId,
      timestamp: new Date().toISOString(),
      ...details
    });
  },

  // Logging para auditoría
  logAudit: (action, userId, targetId, details = {}) => {
    writeLog('INFO', `Audit: ${action}`, {
      action,
      userId,
      targetId,
      timestamp: new Date().toISOString(),
      ...details
    });
  },

  // Logging para rendimiento
  logPerformance: (operation, duration, details = {}) => {
    const level = duration > 5000 ? 'WARN' : duration > 2000 ? 'INFO' : 'DEBUG';
    writeLog(level, `Performance: ${operation}`, {
      operation,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      ...details
    });
  },

  // Logging para seguridad
  logSecurity: (event, userId, details = {}) => {
    writeLog('WARN', `Security Event: ${event}`, {
      event,
      userId,
      timestamp: new Date().toISOString(),
      ...details
    });
  }
};

// Middleware para logging de solicitudes HTTP
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Loggear solicitud
  logger.info(`HTTP Request: ${req.method} ${req.url}`, {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  });

  // Intercepta respuesta para loggear duración
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;
    
    logger.logPerformance(`${req.method} ${req.url}`, duration, {
      statusCode: res.statusCode,
      userId: req.user?.id
    });

    // Loggear errores HTTP
    if (res.statusCode >= 400) {
      logger.error(`HTTP Error: ${req.method} ${req.url}`, {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        userId: req.user?.id,
        response: data
      });
    }

    return originalSend.call(this, data);
  };

  next();
};

// Función para limpiar logs viejos
const cleanupOldLogs = () => {
  try {
    const files = fs.readdirSync(LOG_CONFIG.logDir);
    const now = new Date();
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 días

    files.forEach(file => {
      const filePath = path.join(LOG_CONFIG.logDir, file);
      const stats = fs.statSync(filePath);
      const age = now - stats.mtime;

      if (age > maxAge) {
        fs.unlinkSync(filePath);
        logger.info(`Cleaned up old log file: ${file}`);
      }
    });
  } catch (error) {
    logger.error('Error cleaning up old logs', { error: error.message });
  }
};

// Ejecutar limpieza diariamente
if (process.env.NODE_ENV === 'production') {
  setInterval(cleanupOldLogs, 24 * 60 * 60 * 1000); // Cada 24 horas
}

module.exports = {
  logger,
  requestLogger,
  cleanupOldLogs,
  LOG_CONFIG
};
