/**
 * Logger Utility
 * Proporciona funciones de logging centralizadas para la aplicación
 */

const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

/**
 * Formatea la fecha y hora actual
 * @returns {string} Timestamp formateado
 */
const getTimestamp = () => {
  return new Date().toISOString();
};

/**
 * Formatea un mensaje de log con timestamp y nivel
 * @param {string} level - Nivel del log
 * @param {string} message - Mensaje a loggear
 * @param {Object} meta - Metadata adicional
 * @returns {string} Mensaje formateado
 */
const formatLogMessage = (level, message, meta = {}) => {
  const timestamp = getTimestamp();
  const metaStr = Object.keys(meta).length > 0 ? `\n${JSON.stringify(meta, null, 2)}` : '';
  return `[${timestamp}] [${level}] ${message}${metaStr}`;
};

/**
 * Log de nivel ERROR
 * @param {string} message - Mensaje de error
 * @param {Error|Object} error - Objeto de error o metadata adicional
 */
const error = (message, error = {}) => {
  const meta = {};
  
  if (error instanceof Error) {
    meta.error = {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  } else {
    Object.assign(meta, error);
  }
  
  console.error(formatLogMessage(LOG_LEVELS.ERROR, message, meta));
};

/**
 * Log de nivel WARN
 * @param {string} message - Mensaje de advertencia
 * @param {Object} meta - Metadata adicional
 */
const warn = (message, meta = {}) => {
  console.warn(formatLogMessage(LOG_LEVELS.WARN, message, meta));
};

/**
 * Log de nivel INFO
 * @param {string} message - Mensaje informativo
 * @param {Object} meta - Metadata adicional
 */
const info = (message, meta = {}) => {
  console.log(formatLogMessage(LOG_LEVELS.INFO, message, meta));
};

/**
 * Log de nivel DEBUG (solo en development)
 * @param {string} message - Mensaje de debug
 * @param {Object} meta - Metadata adicional
 */
const debug = (message, meta = {}) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(formatLogMessage(LOG_LEVELS.DEBUG, message, meta));
  }
};

/**
 * Log de petición HTTP
 * @param {Object} req - Objeto de request de Express
 */
const logRequest = (req) => {
  const meta = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent')
  };
  info(`HTTP Request: ${req.method} ${req.originalUrl}`, meta);
};

/**
 * Log de respuesta HTTP
 * @param {Object} req - Objeto de request de Express
 * @param {Object} res - Objeto de response de Express
 * @param {number} duration - Duración de la petición en ms
 */
const logResponse = (req, res, duration) => {
  const meta = {
    method: req.method,
    url: req.originalUrl,
    statusCode: res.statusCode,
    duration: `${duration}ms`
  };
  
  if (res.statusCode >= 500) {
    error(`HTTP Response: ${req.method} ${req.originalUrl}`, meta);
  } else if (res.statusCode >= 400) {
    warn(`HTTP Response: ${req.method} ${req.originalUrl}`, meta);
  } else {
    info(`HTTP Response: ${req.method} ${req.originalUrl}`, meta);
  }
};

/**
 * Middleware de logging de peticiones
 */
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log de la petición entrante
  logRequest(req);
  
  // Interceptar el fin de la respuesta
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logResponse(req, res, duration);
  });
  
  next();
};

export default {
  error,
  warn,
  info,
  debug,
  logRequest,
  logResponse,
  requestLogger,
  LOG_LEVELS
};
