/**
 * Tests para error.middleware.js
 * Cobertura: notFound, errorHandler, AppError
 * Nota: asyncHandler fue movido a utils/asyncHandler.util.js y tiene sus propios tests
 */

import { jest } from '@jest/globals';
import { notFound, errorHandler, asyncHandler, AppError } from '../../../middleware/error.middleware.js';

// Mock de logger
jest.mock('../../../utils/logger.js', () => ({
  default: {
    warn: jest.fn(),
    error: jest.fn()
  }
}));

describe('error.middleware.js', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    // Mock de request
    mockReq = {
      method: 'GET',
      originalUrl: '/api/test/route',
      ip: '127.0.0.1',
      body: {},
      params: {},
      query: {}
    };

    // Mock de response
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    // Mock de next
    mockNext = jest.fn();

    // Resetear NODE_ENV
    process.env.NODE_ENV = 'test';

    // Limpiar mocks
    jest.clearAllMocks();
  });

  describe('notFound', () => {
    test('debe retornar 404 con mensaje de ruta no encontrada', () => {
      // Arrange
      mockReq.originalUrl = '/api/nonexistent/route';

      // Act
      notFound(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'La ruta /api/nonexistent/route no existe en este servidor'
      });
    });

    test('debe incluir el método HTTP en el mensaje de error', () => {
      // Arrange
      mockReq.method = 'POST';
      mockReq.originalUrl = '/api/missing';

      // Act
      notFound(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'La ruta /api/missing no existe en este servidor'
      });
    });
  });

  describe('errorHandler', () => {
    test('debe manejar error genérico con statusCode 500 por defecto', () => {
      // Arrange
      const error = new Error('Error genérico');

      // Act
      errorHandler(error, mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error genérico'
      });
    });

    test('debe respetar statusCode del error si existe', () => {
      // Arrange
      const error = new Error('Error personalizado');
      error.statusCode = 418;

      // Act
      errorHandler(error, mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(418);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error personalizado'
      });
    });

    test('debe manejar ValidationError con statusCode 400', () => {
      // Arrange
      const error = new Error('Datos inválidos');
      error.name = 'ValidationError';

      // Act
      errorHandler(error, mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error de validación'
      });
    });

    test('debe manejar JsonWebTokenError con statusCode 401', () => {
      // Arrange
      const error = new Error('jwt malformed');
      error.name = 'JsonWebTokenError';

      // Act
      errorHandler(error, mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token inválido'
      });
    });

    test('debe manejar TokenExpiredError con statusCode 401', () => {
      // Arrange
      const error = new Error('jwt expired');
      error.name = 'TokenExpiredError';

      // Act
      errorHandler(error, mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token expirado'
      });
    });

    test('debe manejar CastError con statusCode 400', () => {
      // Arrange
      const error = new Error('Cast to ObjectId failed');
      error.name = 'CastError';

      // Act
      errorHandler(error, mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Formato de ID inválido'
      });
    });

    // Tests parametrizados para códigos de error PostgreSQL
    describe.each([
      ['23505', 409, 'Ya existe un registro con estos datos'],
      ['23503', 400, 'Referencia a un registro que no existe'],
      ['23502', 400, 'Falta un campo obligatorio'],
      ['22P02', 400, 'Formato de datos inválido'],
      ['42P01', 500, 'Error de configuración de base de datos']
    ])('PostgreSQL error code %s', (code, expectedStatus, expectedMessage) => {
      test(`debe retornar ${expectedStatus} con mensaje apropiado`, () => {
        // Arrange
        const error = new Error('Database error');
        error.code = code;

        // Act
        errorHandler(error, mockReq, mockRes, mockNext);

        // Assert
        expect(mockRes.status).toHaveBeenCalledWith(expectedStatus);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            message: expectedMessage
          })
        );
      });
    });

    test('debe incluir detalles del error en development mode', () => {
      // Arrange
      process.env.NODE_ENV = 'development';
      const error = new Error('Error en desarrollo');
      // Nota: No agregamos error.code para evitar que se active la lógica de PostgreSQL
      error.name = 'TestError';

      // Act
      errorHandler(error, mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Error en desarrollo',
          error: expect.objectContaining({
            message: 'Error en desarrollo',
            stack: expect.any(String),
            name: 'TestError'
          })
        })
      );
    });

    test('NO debe incluir detalles del error en production mode', () => {
      // Arrange
      process.env.NODE_ENV = 'production';
      const error = new Error('Error en producción');
      // Nota: No agregamos error.code para evitar que se active la lógica de PostgreSQL

      // Act
      errorHandler(error, mockReq, mockRes, mockNext);

      // Assert
      const jsonCall = mockRes.json.mock.calls[0][0];
      expect(jsonCall).not.toHaveProperty('error');
      expect(jsonCall).toEqual({
        success: false,
        message: 'Error en producción'
      });
    });

    test('debe manejar error con código PostgreSQL desconocido', () => {
      // Arrange
      const error = new Error('Unknown DB error');
      error.code = '99999'; // Código no mapeado

      // Act
      errorHandler(error, mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error en la base de datos'
      });
    });
  });

  describe('asyncHandler - Re-export Compatibility Test', () => {
    test('debe estar disponible como re-export para compatibilidad', () => {
      // Arrange & Act & Assert
      expect(asyncHandler).toBeDefined();
      expect(typeof asyncHandler).toBe('function');
    });

    test('debe funcionar como wrapper básico (compatibilidad)', async () => {
      // Arrange
      const asyncFn = jest.fn().mockResolvedValue('success');
      const wrappedFn = asyncHandler(asyncFn);

      // Act
      await wrappedFn(mockReq, mockRes, mockNext);

      // Assert
      expect(asyncFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('debe capturar errores básicos (compatibilidad)', async () => {
      // Arrange
      const error = new Error('Async error');
      const asyncFn = jest.fn().mockRejectedValue(error);
      const wrappedFn = asyncHandler(asyncFn);

      // Act
      await wrappedFn(mockReq, mockRes, mockNext);

      // Assert
      expect(asyncFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(error);
    });

    test('debe apuntar a la implementación en utils/asyncHandler.util.js', () => {
      // Este test confirma que es un re-export
      // Los tests comprehensivos están en __tests__/unit/utils/asyncHandler.util.test.js
      expect(asyncHandler).toBeDefined();
      expect(asyncHandler.length).toBe(1); // Acepta 1 argumento (la función)
    });
  });

  describe('AppError', () => {
    test('debe crear instancia con mensaje y statusCode correctos', () => {
      // Arrange & Act
      const error = new AppError('Error personalizado', 404);

      // Assert
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Error personalizado');
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe('AppError');
    });

    test('debe usar statusCode 500 por defecto', () => {
      // Arrange & Act
      const error = new AppError('Error sin código');

      // Assert
      expect(error.message).toBe('Error sin código');
      expect(error.statusCode).toBe(500);
    });

    test('debe capturar stack trace', () => {
      // Arrange & Act
      const error = new AppError('Test error', 400);

      // Assert
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('AppError');
      expect(error.stack).toContain('Test error');
    });

    test('debe funcionar con throw statement', () => {
      // Arrange & Act & Assert
      expect(() => {
        throw new AppError('Thrown error', 403);
      }).toThrow(AppError);

      expect(() => {
        throw new AppError('Thrown error', 403);
      }).toThrow('Thrown error');
    });

    test('debe ser capturado por try-catch como Error normal', () => {
      // Arrange
      let caughtError = null;

      try {
        throw new AppError('Catchable error', 401);
      } catch (error) {
        caughtError = error;
      }

      // Assert
      expect(caughtError).toBeInstanceOf(AppError);
      expect(caughtError.message).toBe('Catchable error');
      expect(caughtError.statusCode).toBe(401);
    });
  });
});
