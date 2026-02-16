/**
 * Tests para asyncHandler.util.js
 * Cobertura: asyncHandler y asyncHandlerStrict
 * Tipo: Unit Testing
 * 
 * Estrategia:
 * - Validar captura de errores async (Promise rejections)
 * - Validar captura de errores síncronos con asyncHandlerStrict
 * - Verificar que funciones exitosas no llamen next()
 * - Testear edge cases: non-functions, múltiples llamadas, error propagation
 */

import { jest } from '@jest/globals';
import { asyncHandler, asyncHandlerStrict } from '../../../utils/asyncHandler.util.js';

describe('asyncHandler.util.js', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      params: {},
      body: {},
      query: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('asyncHandler - Happy Path', () => {
    test('debe ejecutar función async exitosa sin llamar next()', async () => {
      // Arrange
      const successFn = jest.fn(async (req, res) => {
        res.json({ success: true });
      });
      const wrapped = asyncHandler(successFn);

      // Act
      await wrapped(mockReq, mockRes, mockNext);

      // Assert
      expect(successFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
      expect(successFn).toHaveBeenCalledTimes(1);
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({ success: true });
    });

    test('debe funcionar con función que retorna Promise directamente', async () => {
      // Arrange
      const promiseFn = jest.fn((req, res) => {
        return Promise.resolve().then(() => {
          res.json({ data: 'test' });
        });
      });
      const wrapped = asyncHandler(promiseFn);

      // Act
      await wrapped(mockReq, mockRes, mockNext);

      // Assert
      expect(promiseFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({ data: 'test' });
    });

    test('debe pasar correctamente req, res, next a la función envuelta', async () => {
      // Arrange
      mockReq.params.id = '123';
      mockReq.body.name = 'Test';
      const fn = jest.fn(async (req, res, next) => {
        expect(req.params.id).toBe('123');
        expect(req.body.name).toBe('Test');
        expect(typeof next).toBe('function');
      });
      const wrapped = asyncHandler(fn);

      // Act
      await wrapped(mockReq, mockRes, mockNext);

      // Assert
      expect(fn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
    });

    test('debe funcionar con función que no retorna nada', async () => {
      // Arrange
      const voidFn = jest.fn(async (req, res) => {
        res.status(204).send();
        // No return statement
      });
      const wrapped = asyncHandler(voidFn);

      // Act
      await wrapped(mockReq, mockRes, mockNext);

      // Assert
      expect(voidFn).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(204);
    });
  });

  describe('asyncHandler - Error Handling', () => {
    test('debe capturar Promise rejection y pasar error a next()', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      const failingFn = jest.fn(async () => {
        throw error;
      });
      const wrapped = asyncHandler(failingFn);

      // Act
      await wrapped(mockReq, mockRes, mockNext);

      // Assert
      expect(failingFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    test('debe capturar error con Promise.reject()', async () => {
      // Arrange
      const error = new Error('Rejected promise');
      const rejectFn = jest.fn(() => Promise.reject(error));
      const wrapped = asyncHandler(rejectFn);

      // Act
      await wrapped(mockReq, mockRes, mockNext);

      // Assert
      expect(rejectFn).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(error);
    });

    test('debe preservar stack trace del error original', async () => {
      // Arrange
      const originalError = new Error('Original error');
      const stackBefore = originalError.stack;
      const errorFn = jest.fn(async () => {
        throw originalError;
      });
      const wrapped = asyncHandler(errorFn);

      // Act
      await wrapped(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(originalError);
      const passedError = mockNext.mock.calls[0][0];
      expect(passedError.stack).toBe(stackBefore);
    });

    test('debe manejar error con propiedades custom (statusCode, code, etc.)', async () => {
      // Arrange
      const customError = new Error('Custom error');
      customError.statusCode = 404;
      customError.code = 'NOT_FOUND';
      const errorFn = jest.fn(async () => {
        throw customError;
      });
      const wrapped = asyncHandler(errorFn);

      // Act
      await wrapped(mockReq, mockRes, mockNext);

      // Assert
      const passedError = mockNext.mock.calls[0][0];
      expect(passedError.statusCode).toBe(404);
      expect(passedError.code).toBe('NOT_FOUND');
    });

    test('debe manejar error lanzado después de operaciones async', async () => {
      // Arrange
      const error = new Error('Delayed error');
      const delayedErrorFn = jest.fn(async () => {
        await Promise.resolve(); // Simular operación async
        await new Promise(resolve => setTimeout(resolve, 10));
        throw error;
      });
      const wrapped = asyncHandler(delayedErrorFn);

      // Act
      const promise = wrapped(mockReq, mockRes, mockNext);
      
      // Wait for all async operations to complete
      await new Promise(resolve => setTimeout(resolve, 50));

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('asyncHandler - Edge Cases', () => {
    test('debe lanzar TypeError si el argumento no es una función', () => {
      // Arrange & Act & Assert
      expect(() => asyncHandler(null)).toThrow(TypeError);
      expect(() => asyncHandler(null)).toThrow('asyncHandler espera una función como argumento');
      expect(() => asyncHandler(undefined)).toThrow(TypeError);
      expect(() => asyncHandler('not a function')).toThrow(TypeError);
      expect(() => asyncHandler(123)).toThrow(TypeError);
      expect(() => asyncHandler({})).toThrow(TypeError);
    });

    test('debe funcionar con función síncrona que retorna valor directamente', async () => {
      // Arrange
      const syncFn = jest.fn((req, res) => {
        res.json({ sync: true });
        return 'sync value'; // Retorno síncrono
      });
      const wrapped = asyncHandler(syncFn);

      // Act
      await wrapped(mockReq, mockRes, mockNext);

      // Assert
      expect(syncFn).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({ sync: true });
    });

    test('NO debe capturar error síncrono lanzado antes de Promise.resolve()', async () => {
      // Arrange
      const syncError = new Error('Immediate sync error');
      const syncErrorFn = jest.fn(() => {
        throw syncError; // Error lanzado síncronamente
      });
      const wrapped = asyncHandler(syncErrorFn);

      // Act & Assert
      // Este es un caso edge conocido: Promise.resolve() no captura errores síncronos inmediatos
      // La función lanzará el error y no será capturado por el .catch()
      let errorThrown = false;
      try {
        await wrapped(mockReq, mockRes, mockNext);
      } catch (error) {
        errorThrown = true;
        expect(error).toBe(syncError);
      }
      
      expect(errorThrown).toBe(true);
      // El error se propaga sin pasar por next()
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('debe manejar múltiples llamadas independientes', async () => {
      // Arrange
      let callCount = 0;
      const countFn = jest.fn(async (req, res) => {
        callCount++;
        res.json({ count: callCount });
      });
      const wrapped = asyncHandler(countFn);

      // Act
      await wrapped(mockReq, mockRes, mockNext);
      await wrapped(mockReq, mockRes, mockNext);
      await wrapped(mockReq, mockRes, mockNext);

      // Assert
      expect(countFn).toHaveBeenCalledTimes(3);
      expect(callCount).toBe(3);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('debe funcionar con async function que llama next() manualmente', async () => {
      // Arrange
      const manualNextFn = jest.fn(async (req, res, next) => {
        // Caso donde el controller llama next() para pasar a siguiente middleware
        next();
      });
      const wrapped = asyncHandler(manualNextFn);

      // Act
      await wrapped(mockReq, mockRes, mockNext);

      // Assert
      expect(manualNextFn).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(); // Sin argumentos
    });
  });

  describe('asyncHandlerStrict - Enhanced Error Handling', () => {
    test('debe capturar errores síncronos inmediatos con try-catch', async () => {
      // Arrange
      const syncError = new Error('Sync error');
      const syncErrorFn = jest.fn(() => {
        throw syncError; // Error antes de Promise
      });
      const wrapped = asyncHandlerStrict(syncErrorFn);

      // Act
      await wrapped(mockReq, mockRes, mockNext);

      // Assert
      expect(syncErrorFn).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(syncError);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    test('debe capturar errores async igual que asyncHandler', async () => {
      // Arrange
      const asyncError = new Error('Async error');
      const asyncErrorFn = jest.fn(async () => {
        throw asyncError;
      });
      const wrapped = asyncHandlerStrict(asyncErrorFn);

      // Act
      await wrapped(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(asyncError);
    });

    test('debe funcionar con funciones exitosas igual que asyncHandler', async () => {
      // Arrange
      const successFn = jest.fn(async (req, res) => {
        res.json({ success: true });
      });
      const wrapped = asyncHandlerStrict(successFn);

      // Act
      await wrapped(mockReq, mockRes, mockNext);

      // Assert
      expect(successFn).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({ success: true });
    });

    test('debe lanzar TypeError si no recibe función', () => {
      // Arrange & Act & Assert
      expect(() => asyncHandlerStrict(null)).toThrow(TypeError);
      expect(() => asyncHandlerStrict(null)).toThrow('asyncHandlerStrict espera una función como argumento');
    });

    test('debe capturar errores síncronos en validaciones iniciales', async () => {
      // Arrange - Simula validación que falla síncronamente
      const validationError = new Error('Validation failed');
      const validationFn = jest.fn((req, res) => {
        if (!req.body.required) {
          throw validationError; // Error síncrono en validación
        }
        return Promise.resolve(res.json({ valid: true }));
      });
      const wrapped = asyncHandlerStrict(validationFn);

      // Act
      await wrapped(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(validationError);
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });

  describe('asyncHandler vs asyncHandlerStrict - Diferencias', () => {
    test('asyncHandler NO captura sync errors, asyncHandlerStrict SÍ', async () => {
      // Arrange
      const error = new Error('Test error');
      const throwSync = () => { throw error; };

      const wrappedNormal = asyncHandler(throwSync);
      const wrappedStrict = asyncHandlerStrict(throwSync);

      // Act & Assert - asyncHandler deja pasar el error
      let normalThrew = false;
      try {
        await wrappedNormal(mockReq, mockRes, mockNext);
      } catch (err) {
        normalThrew = true;
        expect(err).toBe(error);
      }
      expect(normalThrew).toBe(true);
      expect(mockNext).not.toHaveBeenCalled();

      // Reset mocks
      mockNext.mockClear();

      // asyncHandlerStrict captura el error
      await wrappedStrict(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(error);
    });

    test('ambos manejan Promise rejections de la misma manera', async () => {
      // Arrange
      const error = new Error('Promise error');
      const rejectFn = () => Promise.reject(error);

      const wrappedNormal = asyncHandler(rejectFn);
      const wrappedStrict = asyncHandlerStrict(rejectFn);

      // Act
      await wrappedNormal(mockReq, mockRes, mockNext);
      const normalCalls = mockNext.mock.calls.length;

      mockNext.mockClear();

      await wrappedStrict(mockReq, mockRes, mockNext);
      const strictCalls = mockNext.mock.calls.length;

      // Assert - Ambos capturan el error
      expect(normalCalls).toBe(1);
      expect(strictCalls).toBe(1);
    });
  });

  describe('Integration Patterns', () => {
    test('debe integrarse correctamente con Express error handling middleware', async () => {
      // Arrange - Simula un controller completo
      const dbError = new Error('Database error');
      dbError.code = '23505'; // PostgreSQL unique violation
      
      const controller = asyncHandler(async (req, res) => {
        // Simular operación que falla
        throw dbError;
      });

      // Act
      await controller(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(dbError);
      expect(mockNext.mock.calls[0][0].code).toBe('23505');
    });

    test('debe permitir encadenamiento de middlewares', async () => {
      // Arrange
      const middleware1 = asyncHandler(async (req, res, next) => {
        req.step1 = true;
        next(); // Pasar al siguiente
      });

      const middleware2 = asyncHandler(async (req, res, next) => {
        expect(req.step1).toBe(true);
        req.step2 = true;
        next();
      });

      // Act
      await middleware1(mockReq, mockRes, mockNext);
      
      // Simular que Express llama al siguiente middleware
      expect(mockNext).toHaveBeenCalledWith();
      
      // Reset y ejecutar segundo middleware
      mockNext.mockClear();
      await middleware2(mockReq, mockRes, mockNext);

      // Assert
      expect(mockReq.step1).toBe(true);
      expect(mockReq.step2).toBe(true);
      expect(mockNext).toHaveBeenCalledWith();
    });

    test('debe funcionar con controllers que usan response utilities', async () => {
      // Arrange
      const controller = asyncHandler(async (req, res) => {
        // Simular uso de response utility
        const data = { id: 1, name: 'Test' };
        return res.status(200).json({
          success: true,
          message: 'Datos obtenidos',
          data
        });
      });

      // Act
      await controller(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Datos obtenidos',
        data: { id: 1, name: 'Test' }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
