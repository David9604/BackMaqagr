/**
 * Response Utility
 * Proporciona funciones para generar respuestas consistentes en toda la API
 */

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
 * @returns {Object} Response JSON
 */
export const errorResponse = (res, message = 'Error en el servidor', statusCode = 500, errors = null) => {
  const response = {
    success: false,
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
 * @returns {Object} Response JSON
 */
export const validationErrorResponse = (res, errors, message = 'Error de validación') => {
  return errorResponse(res, message, 400, errors);
};

/**
 * Envía una respuesta de error de autenticación (401)
 * @param {Object} res - Express response object
 * @param {string} message - Mensaje de error
 * @returns {Object} Response JSON
 */
export const unauthorizedResponse = (res, message = 'No autorizado') => {
  return errorResponse(res, message, 401);
};

/**
 * Envía una respuesta de error de permisos (403)
 * @param {Object} res - Express response object
 * @param {string} message - Mensaje de error
 * @returns {Object} Response JSON
 */
export const forbiddenResponse = (res, message = 'Acceso denegado') => {
  return errorResponse(res, message, 403);
};

/**
 * Envía una respuesta de recurso no encontrado (404)
 * @param {Object} res - Express response object
 * @param {string} message - Mensaje de error
 * @returns {Object} Response JSON
 */
export const notFoundResponse = (res, message = 'Recurso no encontrado') => {
  return errorResponse(res, message, 404);
};

/**
 * Envía una respuesta de conflicto (409)
 * @param {Object} res - Express response object
 * @param {string} message - Mensaje de error
 * @returns {Object} Response JSON
 */
export const conflictResponse = (res, message = 'Conflicto con el estado actual del recurso') => {
  return errorResponse(res, message, 409);
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
