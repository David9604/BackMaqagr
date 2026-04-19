/**
 * Response Utility
 * Proporciona funciones para generar respuestas consistentes en toda la API
 */

const DEFAULT_ERROR_CODE_BY_STATUS = {
  400: 'VALIDATION_ERROR',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  500: 'INTERNAL_ERROR'
};

/**
 * Envía una respuesta exitosa con formato consistente
 * @param {Object} res - Express response object
 * @param {Object|Array} data - Datos a enviar en la respuesta
 * @param {string} message - Mensaje descriptivo de la operación
 * @param {number} statusCode - Código de estado HTTP (por defecto 200)
 * @returns {Object} Response JSON
 */
export const successResponse = (res, data, message = 'Operación exitosa', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

/**
 * Envía una respuesta de error con formato consistente
 * @param {Object} res - Express response object
 * @param {string} message - Mensaje descriptivo del error
 * @param {number} statusCode - Código de estado HTTP (por defecto 500)
 * @param {Object} errors - Detalles adicionales del error (opcional)
 * @param {string} code - Código de error estable para integración (opcional)
 * @returns {Object} Response JSON
 */
export const errorResponse = (
  res,
  message = 'Error en el servidor',
  statusCode = 500,
  errors = null,
  code = null,
) => {
  const resolvedCode = code || DEFAULT_ERROR_CODE_BY_STATUS[statusCode] || 'INTERNAL_ERROR';

  const response = {
    success: false,
    code: resolvedCode,
    message
  };

  // Incluir detalles de errores si se proporcionan
  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

/**
 * Envía una respuesta de éxito para creación de recursos (201)
 * @param {Object} res - Express response object
 * @param {Object} data - Datos del recurso creado
 * @param {string} message - Mensaje descriptivo
 * @returns {Object} Response JSON
 */
export const createdResponse = (res, data, message = 'Recurso creado exitosamente') => {
  return successResponse(res, data, message, 201);
};

/**
 * Envía una respuesta de éxito sin contenido (204)
 * @param {Object} res - Express response object
 * @returns {Object} Response
 */
export const noContentResponse = (res) => {
  return res.status(204).send();
};

/**
 * Envía una respuesta de error de validación (400)
 * @param {Object} res - Express response object
 * @param {string|Array} errors - Errores de validación
 * @param {string} message - Mensaje principal
 * @param {string} code - Código de error estable
 * @returns {Object} Response JSON
 */
export const validationErrorResponse = (res, errors, message = 'Error de validación', code = 'VALIDATION_ERROR') => {
  return errorResponse(res, message, 400, errors, code);
};

/**
 * Envía una respuesta de error de autenticación (401)
 * @param {Object} res - Express response object
 * @param {string} message - Mensaje de error
 * @param {string} code - Código de error estable
 * @returns {Object} Response JSON
 */
export const unauthorizedResponse = (res, message = 'No autorizado', code = 'UNAUTHORIZED') => {
  return errorResponse(res, message, 401, null, code);
};

/**
 * Envía una respuesta de error de permisos (403)
 * @param {Object} res - Express response object
 * @param {string} message - Mensaje de error
 * @param {string} code - Código de error estable
 * @returns {Object} Response JSON
 */
export const forbiddenResponse = (res, message = 'Acceso denegado', code = 'FORBIDDEN') => {
  return errorResponse(res, message, 403, null, code);
};

/**
 * Envía una respuesta de recurso no encontrado (404)
 * @param {Object} res - Express response object
 * @param {string} message - Mensaje de error
 * @param {string} code - Código de error estable
 * @returns {Object} Response JSON
 */
export const notFoundResponse = (res, message = 'Recurso no encontrado', code = 'NOT_FOUND') => {
  return errorResponse(res, message, 404, null, code);
};

/**
 * Envía una respuesta de conflicto (409)
 * @param {Object} res - Express response object
 * @param {string} message - Mensaje de error
 * @param {string} code - Código de error estable
 * @returns {Object} Response JSON
 */
export const conflictResponse = (res, message = 'Conflicto con el estado actual del recurso', code = 'CONFLICT') => {
  return errorResponse(res, message, 409, null, code);
};

/**
 * Envía una respuesta con datos paginados
 * @param {Object} res - Express response object
 * @param {Array} data - Array de datos
 * @param {Object} pagination - Objeto con información de paginación
 * @param {number} pagination.page - Página actual
 * @param {number} pagination.limit - Límite por página
 * @param {number} pagination.total - Total de registros
 * @param {string} message - Mensaje descriptivo
 * @returns {Object} Response JSON
 */
export const paginatedResponse = (res, data, pagination, message = 'Datos obtenidos exitosamente') => {
  const { page, limit, total } = pagination;
  const totalPages = Math.ceil(total / limit);

  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      currentPage: page,
      totalPages,
      pageSize: limit,
      totalItems: total,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    }
  });
};

export default {
  successResponse,
  errorResponse,
  createdResponse,
  noContentResponse,
  validationErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  conflictResponse,
  paginatedResponse
};
