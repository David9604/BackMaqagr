/**
 * Error Middleware — DDAAM-110
 * Maneja errores de forma centralizada con logging mejorado:
 *  - 4xx → logger.warn()  (errores de cliente)
 *  - 5xx → logger.error() (errores de servidor, con stack trace completo)
 *  - Correlación por request-id
 *  - Datos del usuario autenticado si existen
 */

import logger from '../utils/logger.js';
import { asyncHandler as asyncHandlerUtil } from '../utils/asyncHandler.util.js';
import {
  AppError as AppErrorBase,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
} from '../utils/errors.util.js';

/**
 * Handler para rutas no encontradas (404)
 */
export const notFound = (req, res, next) => {
  const message = `Ruta no encontrada - ${req.originalUrl}`;
  logger.warn(message, {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.user?.user_id ?? null,
  });

  res.status(404).json({
    success: false,
    message: `La ruta ${req.originalUrl} no existe en este servidor`,
  });
};

/**
 * Construye el contexto de log desde request + error.
 * @param {Error}  err
 * @param {Object} req
 * @returns {Object}
 */
const buildLogContext = (err, req) => ({
  requestId:  req.requestId ?? req.headers?.['x-request-id'] ?? null,
  method:     req.method,
  url:        req.originalUrl,
  userId:     req.user?.user_id   ?? null,
  userEmail:  req.user?.email     ?? null,
  userRole:   req.user?.role_id   ?? null,
  ip:         req.ip,
  // Detalles del error
  errorName:  err.name,
  errorCode:  err.code  ?? null,
  stack:      err.stack ?? null,
  // Contexto de payload (sanitizado, sin passwords)
  params: req.params,
  query:  req.query,
});

/**
 * Handler global de errores — DDAAM-110
 * 4xx → warn, 5xx → error con stack trace completo.
 */
export const errorHandler = (err, req, res, next) => {
  // ── Determinar código y mensaje ────────────────────────────────────────────
  let statusCode = err.statusCode || 500;
  let message    = err.message    || 'Error interno del servidor';

  // JWT
  if (err.name === 'JsonWebTokenError')  { statusCode = 401; message = 'Token inválido'; }
  if (err.name === 'TokenExpiredError')  { statusCode = 401; message = 'Token expirado'; }

  // Validación (Mongoose / JOI / third-party — sin statusCode propio)
  if (err.name === 'ValidationError' && !err.statusCode) { statusCode = 400; message = 'Error de validación'; }

  // Casteo de ID
  if (err.name === 'CastError')          { statusCode = 400; message = 'Formato de ID inválido'; }

  // Errores de PostgreSQL — log incluye query context si está disponible
  if (err.code) {
    const pgMap = {
      '23505': [409, 'Ya existe un registro con estos datos'],
      '23503': [400, 'Referencia a un registro que no existe'],
      '23502': [400, 'Falta un campo obligatorio'],
      '22P02': [400, 'Formato de datos inválido'],
      '42P01': [500, 'Error de configuración de base de datos'],
    };
    const mapped = pgMap[err.code];
    if (mapped) {
      [statusCode, message] = mapped;
    } else if (err.code.startsWith('2') || err.code.startsWith('4')) {
      statusCode = 400;
      message = 'Error en la base de datos';
    } else {
      statusCode = 500;
      message = 'Error en la base de datos';
    }
  }

  // ── Logging según severidad ────────────────────────────────────────────────
  const ctx = buildLogContext(err, req);

  if (statusCode >= 500) {
    // Errores de servidor: log completo con stack trace
    logger.error(`[${statusCode}] ${message}`, {
      ...ctx,
      // Contexto adicional de PostgreSQL si está disponible
      pgQuery:  err.query   ?? null,
      pgDetail: err.detail  ?? null,
    });
  } else {
    // Errores de cliente (4xx): warn sin stack trace en producción
    logger.warn(`[${statusCode}] ${message}`, {
      ...ctx,
      stack: process.env.NODE_ENV !== 'production' ? ctx.stack : undefined,
    });
  }

  // ── Respuesta HTTP ─────────────────────────────────────────────────────────
  const response = { success: false, message };

  // Incluir detalles solo en development
  if (process.env.NODE_ENV === 'development') {
    response.error = {
      name:    err.name,
      message: err.message,
      stack:   err.stack,
      code:    err.code,
    };
  }

  // Incluir errores de validación si existen (ValidationError de errors.util.js)
  if (err.errors?.length) {
    response.errors = err.errors;
  }

  res.status(statusCode).json(response);
};

/**
 * Wrapper para funciones async en rutas.
 * @deprecated Importa directamente desde '../utils/asyncHandler.util.js'
 */
export const asyncHandler = asyncHandlerUtil;

/**
 * Re-exportaciones de utils/errors.util.js para compatibilidad con
 * los controllers existentes que importan desde este middleware.
 */
export { AppErrorBase as AppError, ValidationError, AuthenticationError, AuthorizationError, NotFoundError };
