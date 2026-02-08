/**
 * Error Middleware
 * Maneja errores de forma centralizada en la aplicación
 */

import logger from '../utils/logger.js';

/**
 * Handler para rutas no encontradas (404)
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
export const notFound = (req, res, next) => {
  const message = `Ruta no encontrada - ${req.originalUrl}`;
  logger.warn(message, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip
  });
  
  res.status(404).json({
    success: false,
    message: `La ruta ${req.originalUrl} no existe en este servidor`
  });
};

/**
 * Handler global de errores
 * @param {Error} err - Error object
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
export const errorHandler = (err, req, res, next) => {
  // Log del error
  logger.error('Error en la aplicación', {
    error: err,
    method: req.method,
    url: req.originalUrl,
    body: req.body,
    params: req.params,
    query: req.query
  });

  // Determinar el código de estado
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Error interno del servidor';

  // Manejo de errores específicos
  
  // Error de validación
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Error de validación';
  }

  // Error de JWT
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token inválido';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expirado';
  }

  // Error de base de datos PostgreSQL
  if (err.code) {
    switch (err.code) {
      case '23505': // Unique violation
        statusCode = 409;
        message = 'Ya existe un registro con estos datos';
        break;
      case '23503': // Foreign key violation
        statusCode = 400;
        message = 'Referencia a un registro que no existe';
        break;
      case '23502': // Not null violation
        statusCode = 400;
        message = 'Falta un campo obligatorio';
        break;
      case '22P02': // Invalid text representation
        statusCode = 400;
        message = 'Formato de datos inválido';
        break;
      case '42P01': // Undefined table
        statusCode = 500;
        message = 'Error de configuración de base de datos';
        break;
      default:
        statusCode = 500;
        message = 'Error en la base de datos';
    }
  }

  // Error de casteo
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Formato de ID inválido';
  }

  // Construir respuesta
  const response = {
    success: false,
    message: message
  };

  // Incluir detalles del error solo en development
  if (process.env.NODE_ENV === 'development') {
    response.error = {
      message: err.message,
      stack: err.stack,
      code: err.code,
      name: err.name
    };
  }

  res.status(statusCode).json(response);
};

/**
 * Wrapper para funciones async en rutas
 * Captura errores automáticamente y los pasa al error handler
 * @param {Function} fn - Función async a ejecutar
 * @returns {Function} Middleware function
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Clase para errores personalizados con código de estado
 */
export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}
