/**
 * Validators Utility
 * Proporciona funciones reutilizables para validación de datos
 */
import xss from "xss";

/**
 * Valida el formato de un email usando regex
 * @param {string} email - Email a validar
 * @returns {boolean} true si el formato es válido
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== "string") {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Valida que una contraseña cumpla con los requisitos de seguridad
 * Requisitos:
 * - Mínimo 8 caracteres
 * - Al menos una letra mayúscula
 * - Al menos un número
 *
 * @param {string} password - Contraseña a validar
 * @returns {boolean} true si cumple con los requisitos
 */
export const isValidPassword = (password) => {
  if (!password || typeof password !== "string") {
    return false;
  }

  // Mínimo 8 caracteres
  if (password.length < 8) {
    return false;
  }

  // Al menos una letra mayúscula
  if (!/[A-Z]/.test(password)) {
    return false;
  }

  // Al menos un número
  if (!/[0-9]/.test(password)) {
    return false;
  }

  return true;
};

/**
 * Obtiene los mensajes de error específicos de una contraseña inválida
 * @param {string} password - Contraseña a validar
 * @returns {string[]} Array de mensajes de error
 */
export const getPasswordValidationErrors = (password) => {
  const errors = [];

  if (!password) {
    errors.push("La contraseña es requerida");
    return errors;
  }

  if (password.length < 8) {
    errors.push("La contraseña debe tener al menos 8 caracteres");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("La contraseña debe contener al menos una letra mayúscula");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("La contraseña debe contener al menos un número");
  }

  return errors;
};

/**
 * Valida que un valor sea un número positivo
 * @param {any} value - Valor a validar
 * @returns {boolean} true si es un número positivo
 */
export const isPositiveNumber = (value) => {
  // Convertir string a número si es posible
  const num = typeof value === "string" ? parseFloat(value) : value;

  // Verificar que sea un número válido y positivo
  return typeof num === "number" && !isNaN(num) && num > 0 && isFinite(num);
};

/**
 * Valida que un valor sea un número positivo o cero
 * @param {any} value - Valor a validar
 * @returns {boolean} true si es un número positivo o cero
 */
export const isNonNegativeNumber = (value) => {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return typeof num === "number" && !isNaN(num) && num >= 0 && isFinite(num);
};

/**
 * Valida que un valor sea un entero positivo
 * @param {any} value - Valor a validar
 * @returns {boolean} true si es un entero positivo
 */
export const isPositiveInteger = (value) => {
  const num = typeof value === "string" ? parseInt(value, 10) : value;
  return Number.isInteger(num) && num > 0;
};

/**
 * Valida que un valor esté dentro de un conjunto de valores permitidos (enum)
 * @param {any} value - Valor a validar
 * @param {Array} allowedValues - Array de valores permitidos
 * @returns {boolean} true si el valor está en el array de valores permitidos
 */
export const isValidEnum = (value, allowedValues) => {
  if (!Array.isArray(allowedValues)) {
    throw new Error("allowedValues debe ser un array");
  }

  return allowedValues.includes(value);
};

/**
 * Valida que un string no esté vacío (después de trim)
 * @param {string} value - String a validar
 * @returns {boolean} true si no está vacío
 */
export const isNonEmptyString = (value) => {
  return typeof value === "string" && value.trim().length > 0;
};

/**
 * Valida que un string tenga una longitud mínima
 * @param {string} value - String a validar
 * @param {number} minLength - Longitud mínima requerida
 * @returns {boolean} true si cumple con la longitud mínima
 */
export const hasMinLength = (value, minLength) => {
  return typeof value === "string" && value.length >= minLength;
};

/**
 * Valida que un string tenga una longitud máxima
 * @param {string} value - String a validar
 * @param {number} maxLength - Longitud máxima permitida
 * @returns {boolean} true si cumple con la longitud máxima
 */
export const hasMaxLength = (value, maxLength) => {
  return typeof value === "string" && value.length <= maxLength;
};

/**
 * Valida que un valor esté dentro de un rango numérico
 * @param {number} value - Valor a validar
 * @param {number} min - Valor mínimo (inclusivo)
 * @param {number} max - Valor máximo (inclusivo)
 * @returns {boolean} true si está dentro del rango
 */
export const isInRange = (value, min, max) => {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return typeof num === "number" && !isNaN(num) && num >= min && num <= max;
};

/**
 * Valida que un valor sea un UUID válido (v4)
 * @param {string} uuid - UUID a validar
 * @returns {boolean} true si es un UUID válido
 */
export const isValidUUID = (uuid) => {
  if (!uuid || typeof uuid !== "string") {
    return false;
  }

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Valida que un objeto tenga todas las propiedades requeridas
 * @param {Object} obj - Objeto a validar
 * @param {string[]} requiredProps - Array de nombres de propiedades requeridas
 * @returns {Object} { isValid: boolean, missingProps: string[] }
 */
export const hasRequiredProperties = (obj, requiredProps) => {
  if (!obj || typeof obj !== "object") {
    return {
      isValid: false,
      missingProps: requiredProps,
    };
  }

  const missingProps = requiredProps.filter((prop) => {
    return !(prop in obj) || obj[prop] === undefined || obj[prop] === null;
  });

  return {
    isValid: missingProps.length === 0,
    missingProps,
  };
};

/**
 * Valida un número de teléfono (formato internacional o local)
 * @param {string} phone - Teléfono a validar
 * @returns {boolean} true si el formato es válido
 */
export const isValidPhone = (phone) => {
  if (!phone || typeof phone !== "string") {
    return false;
  }

  // Permite formatos: +57 300 1234567, 3001234567, +1-234-567-8900
  const phoneRegex =
    /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ""));
};

/**
 * Valida una URL
 * @param {string} url - URL a validar
 * @returns {boolean} true si es una URL válida
 */
export const isValidURL = (url) => {
  if (!url || typeof url !== "string") {
    return false;
  }

  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Valida que un valor sea una fecha válida
 * @param {any} date - Fecha a validar (puede ser string, Date, o timestamp)
 * @returns {boolean} true si es una fecha válida
 */
export const isValidDate = (date) => {
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj instanceof Date && !isNaN(dateObj.getTime());
};

/**
 * Valida coordenadas geográficas (latitud y longitud)
 * @param {number} lat - Latitud
 * @param {number} lng - Longitud
 * @returns {boolean} true si las coordenadas son válidas
 */
export const isValidCoordinates = (lat, lng) => {
  return isInRange(lat, -90, 90) && isInRange(lng, -180, 180);
};

/**
 * Sanitiza un string removiendo contenido HTML/JS peligroso usando la librería xss.
 * @param {string} str - String a sanitizar
 * @returns {string} String sanitizado
 */
export const sanitizeString = (str) => {
  if (typeof str !== "string") {
    return "";
  }

  return xss(str).trim();
};

/**
 * Sanitiza un string contra patrones comunes de SQL Injection.
 * Escapa comillas simples y remueve comentarios SQL y patrones peligrosos.
 * NOTA: Las consultas parametrizadas (como las de pg) son la defensa primaria;
 * esta función añade una capa de defensa en profundidad.
 * @param {string} str - String a sanitizar
 * @returns {string} String sanitizado
 */
export const sanitizeSQLInput = (str) => {
  if (typeof str !== "string") {
    return "";
  }

  return str
    .replace(/'/g, "''") // Escapar comillas simples
    .replace(/--/g, "") // Remover comentarios SQL
    .replace(/\/\*/g, "") // Remover inicio de comentario bloque
    .replace(/\*\//g, "") // Remover fin de comentario bloque
    .replace(/;/g, "") // Remover punto y coma (múltiples sentencias)
    .trim();
};

/**
 * Valida múltiples campos y retorna un objeto con los errores
 * @param {Object} data - Objeto con los datos a validar
 * @param {Object} rules - Objeto con las reglas de validación
 * @returns {Object} { isValid: boolean, errors: Object }
 *
 * @example
 * const { isValid, errors } = validateFields(
 *   { email: 'test@test.com', age: 25 },
 *   {
 *     email: { validator: isValidEmail, message: 'Email inválido' },
 *     age: { validator: (v) => isPositiveNumber(v), message: 'Edad debe ser positiva' }
 *   }
 * );
 */
export const validateFields = (data, rules) => {
  const errors = {};
  let isValid = true;

  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field];

    if (
      rule.required &&
      (value === undefined || value === null || value === "")
    ) {
      errors[field] = rule.requiredMessage || `${field} es requerido`;
      isValid = false;
      continue;
    }

    if (value && rule.validator && !rule.validator(value)) {
      errors[field] = rule.message || `${field} es inválido`;
      isValid = false;
    }
  }

  return { isValid, errors };
};

// Exportar todas las funciones
export default {
  isValidEmail,
  isValidPassword,
  getPasswordValidationErrors,
  isPositiveNumber,
  isNonNegativeNumber,
  isPositiveInteger,
  isValidEnum,
  isNonEmptyString,
  hasMinLength,
  hasMaxLength,
  isInRange,
  isValidUUID,
  hasRequiredProperties,
  isValidPhone,
  isValidURL,
  isValidDate,
  isValidCoordinates,
  sanitizeString,
  sanitizeSQLInput,
  validateFields,
};
