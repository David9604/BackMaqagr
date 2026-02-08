/**
 * Tests para Middleware de Validación de Cálculos
 * Valida el middleware validatePowerLossRequest
 */

import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { validatePowerLossRequest } from '../middleware/calculationValidation.middleware.js';

describe('Calculation Validation Middleware Tests', () => {
  
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      body: {}
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();
  });

  // ========== VALIDATION SUCCESS ==========
  describe('validatePowerLossRequest - casos exitosos', () => {
    
    test('debe pasar validación con datos correctos', () => {
      mockReq.body = {
        tractor_id: 1,
        terrain_id: 5,
        working_speed_kmh: 10,
        carried_objects_weight_kg: 500
      };

      validatePowerLossRequest(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('debe aceptar peso 0 (sin carga)', () => {
      mockReq.body = {
        tractor_id: 1,
        terrain_id: 1,
        working_speed_kmh: 5,
        carried_objects_weight_kg: 0
      };

      validatePowerLossRequest(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    test('debe aceptar velocidad cercana al límite', () => {
      mockReq.body = {
        tractor_id: 1,
        terrain_id: 1,
        working_speed_kmh: 39.9,
        carried_objects_weight_kg: 0
      };

      validatePowerLossRequest(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  // ========== TRACTOR_ID VALIDATION ==========
  describe('validatePowerLossRequest - validación tractor_id', () => {
    
    test('debe rechazar si tractor_id falta', () => {
      mockReq.body = {
        terrain_id: 1,
        working_speed_kmh: 10,
        carried_objects_weight_kg: 500
      };

      validatePowerLossRequest(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('tractor_id es requerido')
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('debe rechazar tractor_id = 0', () => {
      mockReq.body = {
        tractor_id: 0,
        terrain_id: 1,
        working_speed_kmh: 10,
        carried_objects_weight_kg: 500
      };

      validatePowerLossRequest(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('entero mayor a 0')
        })
      );
    });

    test('debe rechazar tractor_id negativo', () => {
      mockReq.body = {
        tractor_id: -1,
        terrain_id: 1,
        working_speed_kmh: 10,
        carried_objects_weight_kg: 500
      };

      validatePowerLossRequest(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('debe rechazar tractor_id no numérico', () => {
      mockReq.body = {
        tractor_id: 'abc',
        terrain_id: 1,
        working_speed_kmh: 10,
        carried_objects_weight_kg: 500
      };

      validatePowerLossRequest(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  // ========== TERRAIN_ID VALIDATION ==========
  describe('validatePowerLossRequest - validación terrain_id', () => {
    
    test('debe rechazar si terrain_id falta', () => {
      mockReq.body = {
        tractor_id: 1,
        working_speed_kmh: 10,
        carried_objects_weight_kg: 500
      };

      validatePowerLossRequest(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('terrain_id es requerido')
        })
      );
    });

    test('debe rechazar terrain_id = 0', () => {
      mockReq.body = {
        tractor_id: 1,
        terrain_id: 0,
        working_speed_kmh: 10,
        carried_objects_weight_kg: 500
      };

      validatePowerLossRequest(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('debe rechazar terrain_id negativo', () => {
      mockReq.body = {
        tractor_id: 1,
        terrain_id: -5,
        working_speed_kmh: 10,
        carried_objects_weight_kg: 500
      };

      validatePowerLossRequest(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  // ========== WORKING_SPEED_KMH VALIDATION ==========
  describe('validatePowerLossRequest - validación working_speed_kmh', () => {
    
    test('debe rechazar si working_speed_kmh falta', () => {
      mockReq.body = {
        tractor_id: 1,
        terrain_id: 1,
        carried_objects_weight_kg: 500
      };

      validatePowerLossRequest(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('working_speed_kmh es requerido')
        })
      );
    });

    test('debe rechazar velocidad = 0', () => {
      mockReq.body = {
        tractor_id: 1,
        terrain_id: 1,
        working_speed_kmh: 0,
        carried_objects_weight_kg: 500
      };

      validatePowerLossRequest(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('mayor a 0')
        })
      );
    });

    test('debe rechazar velocidad negativa', () => {
      mockReq.body = {
        tractor_id: 1,
        terrain_id: 1,
        working_speed_kmh: -5,
        carried_objects_weight_kg: 500
      };

      validatePowerLossRequest(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('debe rechazar velocidad >= 40 km/h', () => {
      mockReq.body = {
        tractor_id: 1,
        terrain_id: 1,
        working_speed_kmh: 40,
        carried_objects_weight_kg: 500
      };

      validatePowerLossRequest(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('menor a 40')
        })
      );
    });

    test('debe rechazar velocidad excesiva (50 km/h)', () => {
      mockReq.body = {
        tractor_id: 1,
        terrain_id: 1,
        working_speed_kmh: 50,
        carried_objects_weight_kg: 500
      };

      validatePowerLossRequest(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  // ========== CARRIED_OBJECTS_WEIGHT_KG VALIDATION ==========
  describe('validatePowerLossRequest - validación carried_objects_weight_kg', () => {
    
    test('debe rechazar si carried_objects_weight_kg falta', () => {
      mockReq.body = {
        tractor_id: 1,
        terrain_id: 1,
        working_speed_kmh: 10
      };

      validatePowerLossRequest(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('carried_objects_weight_kg es requerido')
        })
      );
    });

    test('debe rechazar peso negativo', () => {
      mockReq.body = {
        tractor_id: 1,
        terrain_id: 1,
        working_speed_kmh: 10,
        carried_objects_weight_kg: -100
      };

      validatePowerLossRequest(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('mayor o igual a 0')
        })
      );
    });

    test('debe rechazar peso no numérico', () => {
      mockReq.body = {
        tractor_id: 1,
        terrain_id: 1,
        working_speed_kmh: 10,
        carried_objects_weight_kg: 'mucho'
      };

      validatePowerLossRequest(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  // ========== TYPE CONVERSION ==========
  describe('validatePowerLossRequest - conversión de tipos', () => {
    
    test('debe convertir valores numéricos strings a números', () => {
      mockReq.body = {
        tractor_id: '1',
        terrain_id: '5',
        working_speed_kmh: '10.5',
        carried_objects_weight_kg: '500'
      };

      validatePowerLossRequest(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(typeof mockReq.body.tractor_id).toBe('number');
      expect(typeof mockReq.body.terrain_id).toBe('number');
      expect(typeof mockReq.body.working_speed_kmh).toBe('number');
      expect(typeof mockReq.body.carried_objects_weight_kg).toBe('number');
    });

    test('valores convertidos deben ser correctos', () => {
      mockReq.body = {
        tractor_id: '1',
        terrain_id: '5',
        working_speed_kmh: '10.5',
        carried_objects_weight_kg: '500.75'
      };

      validatePowerLossRequest(mockReq, mockRes, mockNext);

      expect(mockReq.body.tractor_id).toBe(1);
      expect(mockReq.body.terrain_id).toBe(5);
      expect(mockReq.body.working_speed_kmh).toBe(10.5);
      expect(mockReq.body.carried_objects_weight_kg).toBe(500.75);
    });
  });
});
