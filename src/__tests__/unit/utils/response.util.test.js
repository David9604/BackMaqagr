/**
 * Tests para response.util.js
 * Cobertura: funciones de respuesta estandarizadas
 */

import { jest } from '@jest/globals';
import {
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
} from '../../../utils/response.util.js';

describe('response.util.js', () => {
  let mockRes;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
  });

  describe('successResponse', () => {
    test('debe retornar respuesta exitosa con statusCode 200 por defecto', () => {
      const data = { id: 1, name: 'Test' };
      const message = 'Datos obtenidos';

      successResponse(mockRes, data, message);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Datos obtenidos',
        data: { id: 1, name: 'Test' }
      });
    });

    test('debe usar mensaje por defecto si no se proporciona', () => {
      const data = { test: true };

      successResponse(mockRes, data);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Operación exitosa',
        data: { test: true }
      });
    });

    test('debe aceptar statusCode personalizado', () => {
      const data = { result: 'ok' };

      successResponse(mockRes, data, 'Custom message', 202);

      expect(mockRes.status).toHaveBeenCalledWith(202);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Custom message',
        data: { result: 'ok' }
      });
    });

    test('debe manejar data como array', () => {
      const data = [1, 2, 3];

      successResponse(mockRes, data, 'Array data');

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Array data',
        data: [1, 2, 3]
      });
    });

    test('debe manejar data null', () => {
      successResponse(mockRes, null, 'No data');

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'No data',
        data: null
      });
    });
  });

  describe('errorResponse', () => {
    test('debe retornar respuesta de error con statusCode 500 por defecto', () => {
      errorResponse(mockRes, 'Error interno');

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error interno'
      });
    });

    test('debe usar mensaje por defecto si no se proporciona', () => {
      errorResponse(mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error en el servidor'
      });
    });

    test('debe aceptar statusCode personalizado', () => {
      errorResponse(mockRes, 'Bad request', 400);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Bad request'
      });
    });

    test('debe incluir errors adicionales si se proporcionan', () => {
      const errors = { field1: 'Invalid', field2: 'Required' };

      errorResponse(mockRes, 'Validation failed', 400, errors);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: { field1: 'Invalid', field2: 'Required' }
      });
    });

    test('NO debe incluir errors si es null', () => {
      errorResponse(mockRes, 'Error', 500, null);

      const callArg = mockRes.json.mock.calls[0][0];
      expect(callArg).not.toHaveProperty('errors');
      expect(callArg).toEqual({
        success: false,
        message: 'Error'
      });
    });
  });

  describe('createdResponse', () => {
    test('debe retornar respuesta con statusCode 201', () => {
      const data = { id: 1, name: 'New Resource' };

      createdResponse(mockRes, data, 'Recurso creado');

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Recurso creado',
        data: { id: 1, name: 'New Resource' }
      });
    });

    test('debe usar mensaje por defecto', () => {
      createdResponse(mockRes, { id: 2 });

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Recurso creado exitosamente',
        data: { id: 2 }
      });
    });
  });

  describe('noContentResponse', () => {
    test('debe retornar statusCode 204 sin body', () => {
      noContentResponse(mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.send).toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });

  describe('validationErrorResponse', () => {
    test('debe retornar statusCode 400 con errors', () => {
      const errors = ['Campo requerido', 'Formato inválido'];

      validationErrorResponse(mockRes, errors, 'Datos inválidos');

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Datos inválidos',
        errors: ['Campo requerido', 'Formato inválido']
      });
    });

    test('debe usar mensaje por defecto', () => {
      const errors = { email: 'Invalid email' };

      validationErrorResponse(mockRes, errors);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error de validación',
        errors: { email: 'Invalid email' }
      });
    });
  });

  describe('unauthorizedResponse', () => {
    test('debe retornar statusCode 401', () => {
      unauthorizedResponse(mockRes, 'Token inválido');

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token inválido'
      });
    });

    test('debe usar mensaje por defecto', () => {
      unauthorizedResponse(mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'No autorizado'
      });
    });
  });

  describe('forbiddenResponse', () => {
    test('debe retornar statusCode 403', () => {
      forbiddenResponse(mockRes, 'Permiso denegado');

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Permiso denegado'
      });
    });

    test('debe usar mensaje por defecto', () => {
      forbiddenResponse(mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Acceso denegado'
      });
    });
  });

  describe('notFoundResponse', () => {
    test('debe retornar statusCode 404', () => {
      notFoundResponse(mockRes, 'Usuario no encontrado');

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Usuario no encontrado'
      });
    });

    test('debe usar mensaje por defecto', () => {
      notFoundResponse(mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Recurso no encontrado'
      });
    });
  });

  describe('conflictResponse', () => {
    test('debe retornar statusCode 409', () => {
      conflictResponse(mockRes, 'Email ya existe');

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Email ya existe'
      });
    });

    test('debe usar mensaje por defecto', () => {
      conflictResponse(mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Conflicto con el estado actual del recurso'
      });
    });
  });

  describe('paginatedResponse', () => {
    test('debe retornar respuesta paginada completa', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const pagination = { page: 1, limit: 10, total: 25 };

      paginatedResponse(mockRes, data, pagination, 'Lista obtenida');

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Lista obtenida',
        data: [{ id: 1 }, { id: 2 }],
        pagination: {
          currentPage: 1,
          totalPages: 3,
          pageSize: 10,
          totalItems: 25,
          hasNextPage: true,
          hasPreviousPage: false
        }
      });
    });

    test('debe calcular totalPages correctamente', () => {
      const pagination = { page: 1, limit: 10, total: 23 };

      paginatedResponse(mockRes, [], pagination);

      const callArg = mockRes.json.mock.calls[0][0];
      expect(callArg.pagination.totalPages).toBe(3); // Math.ceil(23/10) = 3
    });

    test('debe indicar hasNextPage = false en última página', () => {
      const pagination = { page: 3, limit: 10, total: 25 };

      paginatedResponse(mockRes, [], pagination);

      const callArg = mockRes.json.mock.calls[0][0];
      expect(callArg.pagination.hasNextPage).toBe(false);
      expect(callArg.pagination.hasPreviousPage).toBe(true);
    });

    test('debe indicar hasPreviousPage = true cuando page > 1', () => {
      const pagination = { page: 2, limit: 10, total: 25 };

      paginatedResponse(mockRes, [], pagination);

      const callArg = mockRes.json.mock.calls[0][0];
      expect(callArg.pagination.hasPreviousPage).toBe(true);
    });

    test('debe usar mensaje por defecto', () => {
      const pagination = { page: 1, limit: 10, total: 5 };

      paginatedResponse(mockRes, [], pagination);

      const callArg = mockRes.json.mock.calls[0][0];
      expect(callArg.message).toBe('Datos obtenidos exitosamente');
    });

    test('debe manejar caso donde total = 0', () => {
      const pagination = { page: 1, limit: 10, total: 0 };

      paginatedResponse(mockRes, [], pagination);

      const callArg = mockRes.json.mock.calls[0][0];
      expect(callArg.pagination.totalPages).toBe(0);
      expect(callArg.pagination.hasNextPage).toBe(false);
      expect(callArg.pagination.hasPreviousPage).toBe(false);
    });

    test('debe manejar caso de una sola página', () => {
      const pagination = { page: 1, limit: 10, total: 5 };

      paginatedResponse(mockRes, [1, 2, 3, 4, 5], pagination);

      const callArg = mockRes.json.mock.calls[0][0];
      expect(callArg.pagination.totalPages).toBe(1);
      expect(callArg.pagination.hasNextPage).toBe(false);
      expect(callArg.pagination.hasPreviousPage).toBe(false);
    });
  });
});
