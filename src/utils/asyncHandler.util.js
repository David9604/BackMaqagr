/**
 * AsyncHandler Utility
 * Wrapper para funciones async en rutas Express
 * Captura errores automáticamente y los pasa al error handler middleware
 */

/**
 * Envuelve una función async para capturar errores automáticamente
 * Elimina la necesidad de bloques try-catch en cada controller
 * 
 * @param {Function} fn - Función async/Promise a ejecutar (req, res, next) => Promise
 * @returns {Function} Express middleware function (req, res, next) => void
 * 
 * @example
 * // En un controller
 * export const getUser = asyncHandler(async (req, res) => {
 *   const user = await User.findById(req.params.id);
 *   res.json({ success: true, data: user });
 * });
 * 
 * @example
 * // Con error handling automático
 * export const createUser = asyncHandler(async (req, res) => {
 *   // Si esto falla, el error se pasa automáticamente a errorHandler middleware
 *   const user = await User.create(req.body);
 *   res.status(201).json({ success: true, data: user });
 * });
 */
export const asyncHandler = (fn) => {
  // Validación de input
  if (typeof fn !== 'function') {
    throw new TypeError('asyncHandler espera una función como argumento');
  }

  return (req, res, next) => {
    // Promise.resolve() garantiza que tanto funciones async como Promises sean manejadas
    // .catch(next) captura cualquier error y lo pasa al siguiente error handler
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Versión alternativa que captura también errores síncronos inmediatos
 * Útil para funciones que pueden lanzar errores antes de retornar una Promise
 * 
 * @param {Function} fn - Función a ejecutar
 * @returns {Function} Express middleware function
 */
export const asyncHandlerStrict = (fn) => {
  if (typeof fn !== 'function') {
    throw new TypeError('asyncHandlerStrict espera una función como argumento');
  }

  return (req, res, next) => {
    try {
      // Intentar ejecutar la función y capturar errores síncronos
      Promise.resolve(fn(req, res, next)).catch(next);
    } catch (error) {
      // Capturar errores síncronos que ocurren antes de Promise.resolve()
      next(error);
    }
  };
};

export default asyncHandler;
