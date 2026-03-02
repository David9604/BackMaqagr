/**
 * DDAAM-111: Clases de errores personalizadas
 * Jerarquía de errores operacionales con código HTTP incorporado.
 */

// ---------------------------------------------------------------------------
// Base
// ---------------------------------------------------------------------------

/**
 * Error base para errores controlados de la aplicación.
 * isOperational = true indica que es un error esperado (no un bug).
 */
export class AppError extends Error {
  /**
   * @param {string} message    - Mensaje legible
   * @param {number} statusCode - Código HTTP (default 500)
   * @param {boolean} isOperational - true = error de negocio esperado
   */
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

// ---------------------------------------------------------------------------
// 4xx — errores de cliente
// ---------------------------------------------------------------------------

/**
 * 400 Bad Request — datos de entrada inválidos o incompletos.
 */
export class ValidationError extends AppError {
  /**
   * @param {string}   message - Descripción del problema de validación
   * @param {string[]} [errors] - Lista detallada de errores de campo
   */
  constructor(message = 'Error de validación', errors = []) {
    super(message, 400);
    this.errors = errors; // array de strings con detalle de campos
  }
}

/**
 * 401 Unauthorized — el usuario no está autenticado.
 */
export class AuthenticationError extends AppError {
  constructor(message = 'No autenticado') {
    super(message, 401);
  }
}

/**
 * 403 Forbidden — el usuario está autenticado pero no tiene permisos.
 */
export class AuthorizationError extends AppError {
  constructor(message = 'Acceso denegado') {
    super(message, 403);
  }
}

/**
 * 404 Not Found — recurso no existe.
 */
export class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado') {
    super(message, 404);
  }
}

/**
 * 409 Conflict — violación de unicidad u otro conflicto de estado.
 */
export class ConflictError extends AppError {
  constructor(message = 'Conflicto con el estado actual del recurso') {
    super(message, 409);
  }
}
