/**
 * DDAAM-109: Middleware de logging HTTP con Morgan + Winston
 * Archivo: src/middleware/httpLogger.middleware.js
 *
 * - Formato custom: Method · URL · Status · Response Time · User ID
 * - Stream de Morgan enrutado a Winston (nivel 'http')
 * - Log del request body sólo en development, sin passwords ni tokens
 * - Inyección de x-request-id para correlación cross-service
 */

import morgan from 'morgan';
import logger from '../config/logger.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Genera un request-id simple si el cliente no envía uno. */
const generateRequestId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/**
 * Clona un objeto sanitizando campos sensibles.
 * Elimina password, token, authorization, secret, refreshToken.
 * @param {Object} obj
 * @returns {Object}
 */
const sanitize = (obj = {}) => {
  const SENSITIVE = new Set([
    'password', 'password_hash', 'currentPassword', 'newPassword',
    'token', 'accessToken', 'refreshToken', 'secret', 'authorization',
  ]);
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => !SENSITIVE.has(key.toLowerCase()))
  );
};

// ---------------------------------------------------------------------------
// Winston stream para Morgan
// ---------------------------------------------------------------------------

/**
 * Morgan escribe en este stream; cada línea se enruta a logger.http()
 * para que conviva con los demás transportes de Winston.
 */
const morganStream = {
  write: (message) => logger.http(message.trimEnd()),
};

// ---------------------------------------------------------------------------
// Formato custom de Morgan
// ---------------------------------------------------------------------------

/**
 * Token personalizado: extrae el user_id desde req.user (si existe).
 * Disponible como :user-id en la cadena de formato.
 */
morgan.token('user-id', (req) => req.user?.user_id?.toString() ?? 'anon');

/**
 * Token: devuelve el request-id inyectado por este middleware.
 */
morgan.token('request-id', (req) => req.requestId ?? '-');

/**
 * Formato custom:
 *   METHOD /path STATUS response-time ms | userId=X | reqId=Y
 */
const HTTP_LOG_FORMAT =
  ':method :url :status :response-time ms | userId=:user-id | reqId=:request-id';

// ---------------------------------------------------------------------------
// Middleware compuesto
// ---------------------------------------------------------------------------

/** Instancia de morgan con stream → Winston */
const morganMiddleware = morgan(HTTP_LOG_FORMAT, {
  stream: morganStream,
  // Omitir en test para no ensuciar salida de Jest
  skip: () => process.env.NODE_ENV === 'test',
});

/**
 * Middleware principal DDAAM-109.
 * 1. Inyecta x-request-id (propio o generado).
 * 2. Ejecuta morgan → Winston stream.
 * 3. En development: loggea el request body sanitizado.
 */
const httpLogger = (req, res, next) => {
  // ── 1. Request ID ──────────────────────────────────────────────────────
  const requestId =
    req.headers['x-request-id'] || generateRequestId();
  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);

  // ── 2. Morgan logging ──────────────────────────────────────────────────
  morganMiddleware(req, res, (err) => {
    if (err) return next(err);

    // ── 3. Request body log (solo development, sin datos sensibles) ──────
    if (
      process.env.NODE_ENV === 'development' &&
      req.body &&
      Object.keys(req.body).length > 0
    ) {
      logger.debug('Request body', {
        requestId,
        method: req.method,
        url: req.originalUrl,
        body: sanitize(req.body),
      });
    }

    next();
  });
};

export default httpLogger;
