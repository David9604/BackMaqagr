/**
 * Tests para Utilidades de Validación
 * Valida funciones reutilizables en validators.util.js
 */

import { describe, test, expect } from '@jest/globals';
import {
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
  hasRequiredProperties,
  sanitizeString,
  validateFields
} from '../utils/validators.util.js';

describe('Validators Utility Tests', () => {
  
  // ========== EMAIL VALIDATION ==========
  describe('isValidEmail', () => {
    test('debe aceptar emails válidos', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co')).toBe(true);
      expect(isValidEmail('admin+test@company.org')).toBe(true);
    });

    test('debe rechazar emails inválidos', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('no@domain')).toBe(false);
      expect(isValidEmail('@nodomain.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail(null)).toBe(false);
    });
  });

  // ========== PASSWORD VALIDATION ==========
  describe('isValidPassword', () => {
    test('debe aceptar contraseñas válidas', () => {
      expect(isValidPassword('Password123')).toBe(true);
      expect(isValidPassword('MyP@ssw0rd')).toBe(true);
      expect(isValidPassword('Test1234')).toBe(true);
    });

    test('debe rechazar contraseñas sin mayúsculas', () => {
      expect(isValidPassword('password123')).toBe(false);
    });

    test('debe rechazar contraseñas sin números', () => {
      expect(isValidPassword('PasswordTest')).toBe(false);
    });

    test('debe rechazar contraseñas cortas', () => {
      expect(isValidPassword('Pass1')).toBe(false);
      expect(isValidPassword('Test12')).toBe(false);
    });

    test('debe rechazar contraseñas null o undefined', () => {
      expect(isValidPassword(null)).toBe(false);
      expect(isValidPassword(undefined)).toBe(false);
      expect(isValidPassword('')).toBe(false);
    });
  });

  describe('getPasswordValidationErrors', () => {
    test('debe retornar errores específicos', () => {
      const errors = getPasswordValidationErrors('test');
      expect(errors).toContain('La contraseña debe tener al menos 8 caracteres');
      expect(errors).toContain('La contraseña debe contener al menos una letra mayúscula');
      expect(errors).toContain('La contraseña debe contener al menos un número');
    });

    test('debe retornar array vacío para contraseña válida', () => {
      const errors = getPasswordValidationErrors('ValidPass123');
      expect(errors).toEqual([]);
    });
  });

  // ========== NUMBER VALIDATION ==========
  describe('isPositiveNumber', () => {
    test('debe aceptar números positivos', () => {
      expect(isPositiveNumber(1)).toBe(true);
      expect(isPositiveNumber(10.5)).toBe(true);
      expect(isPositiveNumber('5.7')).toBe(true);
    });

    test('debe rechazar cero y negativos', () => {
      expect(isPositiveNumber(0)).toBe(false);
      expect(isPositiveNumber(-5)).toBe(false);
      expect(isPositiveNumber('-10')).toBe(false);
    });

    test('debe rechazar valores no numéricos', () => {
      expect(isPositiveNumber('abc')).toBe(false);
      expect(isPositiveNumber(null)).toBe(false);
      expect(isPositiveNumber(Infinity)).toBe(false);
    });
  });

  describe('isNonNegativeNumber', () => {
    test('debe aceptar números no negativos incluyendo cero', () => {
      expect(isNonNegativeNumber(0)).toBe(true);
      expect(isNonNegativeNumber(5)).toBe(true);
      expect(isNonNegativeNumber('10.5')).toBe(true);
    });

    test('debe rechazar números negativos', () => {
      expect(isNonNegativeNumber(-1)).toBe(false);
      expect(isNonNegativeNumber('-5')).toBe(false);
    });
  });

  describe('isPositiveInteger', () => {
    test('debe aceptar enteros positivos', () => {
      expect(isPositiveInteger(1)).toBe(true);
      expect(isPositiveInteger(100)).toBe(true);
      expect(isPositiveInteger('5')).toBe(true);
    });

    test('debe rechazar decimales', () => {
      expect(isPositiveInteger(1.5)).toBe(false);
      expect(isPositiveInteger(10.5)).toBe(false);
    });

    test('debe rechazar cero y negativos', () => {
      expect(isPositiveInteger(0)).toBe(false);
      expect(isPositiveInteger(-5)).toBe(false);
    });
  });

  // ========== STRING VALIDATION ==========
  describe('isNonEmptyString', () => {
    test('debe aceptar strings no vacíos', () => {
      expect(isNonEmptyString('hello')).toBe(true);
      expect(isNonEmptyString('  text  ')).toBe(true);
    });

    test('debe rechazar strings vacíos', () => {
      expect(isNonEmptyString('')).toBe(false);
      expect(isNonEmptyString('   ')).toBe(false);
      expect(isNonEmptyString(null)).toBe(false);
    });
  });

  describe('hasMinLength', () => {
    test('debe validar longitud mínima', () => {
      expect(hasMinLength('hello', 3)).toBe(true);
      expect(hasMinLength('test', 4)).toBe(true);
      expect(hasMinLength('ab', 5)).toBe(false);
    });
  });

  describe('hasMaxLength', () => {
    test('debe validar longitud máxima', () => {
      expect(hasMaxLength('hello', 10)).toBe(true);
      expect(hasMaxLength('test', 4)).toBe(true);
      expect(hasMaxLength('toolong', 5)).toBe(false);
    });
  });

  // ========== ENUM VALIDATION ==========
  describe('isValidEnum', () => {
    test('debe validar valores en enum', () => {
      const validStatuses = ['active', 'inactive', 'pending'];
      expect(isValidEnum('active', validStatuses)).toBe(true);
      expect(isValidEnum('pending', validStatuses)).toBe(true);
      expect(isValidEnum('deleted', validStatuses)).toBe(false);
    });
  });

  // ========== RANGE VALIDATION ==========
  describe('isInRange', () => {
    test('debe validar rangos numéricos', () => {
      expect(isInRange(5, 1, 10)).toBe(true);
      expect(isInRange(1, 1, 10)).toBe(true);
      expect(isInRange(10, 1, 10)).toBe(true);
      expect(isInRange(0, 1, 10)).toBe(false);
      expect(isInRange(11, 1, 10)).toBe(false);
    });
  });

  // ========== OBJECT VALIDATION ==========
  describe('hasRequiredProperties', () => {
    test('debe validar propiedades requeridas', () => {
      const obj = { name: 'Test', age: 25 };
      const result = hasRequiredProperties(obj, ['name', 'age']);
      expect(result.isValid).toBe(true);
      expect(result.missingProps).toEqual([]);
    });

    test('debe detectar propiedades faltantes', () => {
      const obj = { name: 'Test' };
      const result = hasRequiredProperties(obj, ['name', 'age', 'email']);
      expect(result.isValid).toBe(false);
      expect(result.missingProps).toEqual(['age', 'email']);
    });

    test('debe rechazar null/undefined como faltantes', () => {
      const obj = { name: 'Test', age: null, email: undefined };
      const result = hasRequiredProperties(obj, ['name', 'age', 'email']);
      expect(result.isValid).toBe(false);
      expect(result.missingProps).toContain('age');
      expect(result.missingProps).toContain('email');
    });
  });

  // ========== SANITIZATION ==========
  describe('sanitizeString', () => {
    test('debe remover caracteres peligrosos', () => {
      expect(sanitizeString('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
      expect(sanitizeString('Hello<>World')).toBe('HelloWorld');
    });

    test('debe hacer trim del string', () => {
      expect(sanitizeString('  hello  ')).toBe('hello');
    });

    test('debe manejar valores no string', () => {
      expect(sanitizeString(null)).toBe('');
      expect(sanitizeString(undefined)).toBe('');
      expect(sanitizeString(123)).toBe('');
    });
  });

  // ========== VALIDATE FIELDS ==========
  describe('validateFields', () => {
    test('debe validar múltiples campos correctamente', () => {
      const data = {
        email: 'test@example.com',
        password: 'Password123',
        age: 25
      };

      const rules = {
        email: { 
          required: true,
          validator: isValidEmail, 
          message: 'Email inválido' 
        },
        password: { 
          required: true,
          validator: isValidPassword, 
          message: 'Contraseña inválida' 
        },
        age: { 
          required: true,
          validator: (v) => isPositiveNumber(v), 
          message: 'Edad debe ser positiva' 
        }
      };

      const result = validateFields(data, rules);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    test('debe detectar errores de validación', () => {
      const data = {
        email: 'invalid-email',
        password: 'weak',
        age: -5
      };

      const rules = {
        email: { 
          required: true,
          validator: isValidEmail, 
          message: 'Email inválido' 
        },
        password: { 
          required: true,
          validator: isValidPassword, 
          message: 'Contraseña inválida' 
        },
        age: { 
          required: true,
          validator: (v) => isPositiveNumber(v), 
          message: 'Edad debe ser positiva' 
        }
      };

      const result = validateFields(data, rules);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveProperty('email');
      expect(result.errors).toHaveProperty('password');
      expect(result.errors).toHaveProperty('age');
    });

    test('debe detectar campos requeridos faltantes', () => {
      const data = { email: 'test@example.com' };

      const rules = {
        email: { required: true, validator: isValidEmail },
        name: { required: true, requiredMessage: 'Nombre es requerido' }
      };

      const result = validateFields(data, rules);
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBe('Nombre es requerido');
    });
  });
});
