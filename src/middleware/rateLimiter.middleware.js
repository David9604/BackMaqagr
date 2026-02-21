import rateLimit from "express-rate-limit";

// Helper para crear mensajes de error consistentes con el formato JSend de tu API
const createRateLimitMessage = (message) => ({
  success: false,
  message: message,
});

/**
 * Limitador estricto para intentos de inicio de sesión (fuerza bruta).
 * 5 intentos por cada 15 minutos (por IP).
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: createRateLimitMessage(
    "Demasiados intentos de inicio de sesión. Por favor, intente de nuevo en 15 minutos.",
  ),
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Limitador para llamadas generales a la API para usuarios autenticados.
 * 100 peticiones por cada 15 minutos (por IP).
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: createRateLimitMessage(
    "Demasiadas peticiones a la API desde esta IP, por favor intente más tarde.",
  ),
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Limitador para rutas públicas (ej. registro, recuperación de contraseña).
 * 50 peticiones por cada 15 minutos (por IP).
 */
export const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: createRateLimitMessage(
    "Demasiadas peticiones desde esta IP, por favor intente más tarde.",
  ),
  standardHeaders: true,
  legacyHeaders: false,
});
