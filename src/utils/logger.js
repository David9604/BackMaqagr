/**
 * Backward-compatibility shim -- DDAAM-108
 * Todos los importadores existentes siguen usando esta ruta sin cambios.
 * La implementacion real vive en src/config/logger.js (Winston).
 */
export { default } from '../config/logger.js';
