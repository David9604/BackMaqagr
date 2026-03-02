/**
 * DDAAM-108: Configuración de Winston Logger
 * Logger singleton con múltiples transportes, rotación diaria y formato JSON.
 */

import { createLogger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Directorio de logs en la raíz del proyecto
const logsDir = join(__dirname, '../../logs');

const isDev = process.env.NODE_ENV !== 'production';
const isTest = process.env.NODE_ENV === 'test';

const { combine, timestamp, json, colorize, printf, errors, splat } = format;

// ---------------------------------------------------------------------------
// Formatos
// ---------------------------------------------------------------------------

/** Formato consola (desarrollo): colorizado, legible */
const consoleFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  splat(),
  printf(({ timestamp, level, message, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return `[${timestamp}] ${level}: ${message}${stack ? `\n${stack}` : ''}${metaStr}`;
  })
);

/** Formato archivo: JSON estructurado */
const fileFormat = combine(
  timestamp(),
  errors({ stack: true }),
  splat(),
  json()
);

// ---------------------------------------------------------------------------
// Transportes
// ---------------------------------------------------------------------------

const fileTransports = [
  // Sólo errores
  new transports.File({
    filename: join(logsDir, 'error.log'),
    level: 'error',
    format: fileFormat,
  }),

  // Todos los niveles
  new transports.File({
    filename: join(logsDir, 'combined.log'),
    format: fileFormat,
  }),

  // Rotación diaria — mantiene 14 días, comprime los antiguos
  new DailyRotateFile({
    dirname: logsDir,
    filename: 'app-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxFiles: '14d',
    zippedArchive: true,
    format: fileFormat,
  }),
];

// ---------------------------------------------------------------------------
// Logger principal
// ---------------------------------------------------------------------------

const logger = createLogger({
  /**
   * Niveles personalizados compatibles con npm levels + http
   * error(0) < warn(1) < info(2) < http(3) < debug(4)
   */
  levels: { error: 0, warn: 1, info: 2, http: 3, debug: 4 },
  level: isDev ? 'debug' : 'info',
  transports: [
    // Console sólo fuera de test para no ensuciar la salida de Jest
    ...(isTest ? [] : [new transports.Console({ format: consoleFormat, level: isDev ? 'debug' : 'warn' })]),
    // Archivos siempre (excepto test para no crear archivos durante pruebas)
    ...(isTest ? [] : fileTransports),
  ],
  // No lanzar excepciones si un transporte falla
  exitOnError: false,
});

// ---------------------------------------------------------------------------
// Middleware HTTP request logger (mantiene la misma API que utils/logger.js)
// ---------------------------------------------------------------------------

/**
 * Express middleware que registra cada request/response HTTP al nivel 'http'.
 * Agrega x-request-id (existente o generado) al request para correlación.
 */
logger.requestLogger = (req, res, next) => {
  // Correlación: usa el header si viene del cliente, o genera uno simple
  const requestId = req.headers['x-request-id'] || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);

  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      requestId,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: req.user?.user_id ?? null,
    };

    if (res.statusCode >= 500) {
      logger.error(`HTTP ${res.statusCode} ${req.method} ${req.originalUrl}`, logData);
    } else if (res.statusCode >= 400) {
      logger.warn(`HTTP ${res.statusCode} ${req.method} ${req.originalUrl}`, logData);
    } else {
      logger.http(`HTTP ${res.statusCode} ${req.method} ${req.originalUrl}`, logData);
    }
  });

  next();
};

// ---------------------------------------------------------------------------
// Helper: medir duración de queries (DDAAM-113 — slow query logging)
// ---------------------------------------------------------------------------

/**
 * Envuelve una función async de query y registra si tarda más de threshold.
 * @param {Function} queryFn - async () => resultado
 * @param {string} label     - etiqueta descriptiva del query
 * @param {number} threshold - ms antes de considerarse lento (default 100)
 */
logger.timedQuery = async (queryFn, label = 'DB Query', threshold = 100) => {
  const start = Date.now();
  const result = await queryFn();
  const duration = Date.now() - start;
  if (duration > threshold) {
    logger.warn(`Slow query detected: ${label}`, { duration: `${duration}ms`, threshold: `${threshold}ms` });
  }
  return result;
};

export default logger;
