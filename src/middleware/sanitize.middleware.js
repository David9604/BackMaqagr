import { sanitizeString, sanitizeSQLInput } from "../utils/validators.util.js";

/**
 * Recorre recursivamente un objeto y sanitiza todos los valores string.
 * @param {any} obj - Objeto, array o valor a sanitizar
 * @returns {any} Copia sanitizada
 */
const sanitizeValue = (obj) => {
  if (typeof obj === "string") {
    // SQL sanitización primero (opera sobre texto plano),
    // luego XSS (codifica entidades HTML que podrían contener ';')
    return sanitizeString(sanitizeSQLInput(obj));
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeValue);
  }

  if (obj !== null && typeof obj === "object") {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeValue(value);
    }
    return sanitized;
  }

  // Números, booleanos, null, etc. se devuelven tal cual
  return obj;
};

/**
 * Middleware Express que sanitiza req.body, req.query y req.params
 * contra ataques XSS y SQL Injection.
 *
 * NOTA: En Express 5, req.query y req.params son de solo lectura,
 * por lo que se sanitizan las propiedades individuales en lugar de reasignar el objeto.
 */
export const sanitizeInputs = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeValue(req.body);
  }

  // req.query es read-only en Express 5, sanitizamos cada propiedad individual
  if (req.query && typeof req.query === "object") {
    for (const key of Object.keys(req.query)) {
      if (typeof req.query[key] === "string") {
        try {
          req.query[key] = sanitizeValue(req.query[key]);
        } catch {
          // Si la propiedad es read-only, se ignora
        }
      }
    }
  }

  // req.params puede ser read-only en Express 5, sanitizamos cada propiedad
  if (req.params && typeof req.params === "object") {
    for (const key of Object.keys(req.params)) {
      if (typeof req.params[key] === "string") {
        try {
          req.params[key] = sanitizeValue(req.params[key]);
        } catch {
          // Si la propiedad es read-only, se ignora
        }
      }
    }
  }

  next();
};
