/**
 * Tests para Middleware de Validación de Cálculos
 * Valida los middlewares validatePowerLossRequest y validateImplementRequirement
 */

import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { 
  validatePowerLossRequest, 
  validateImplementRequirement 
} from '../middleware/calculationValidation.middleware.js';

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

  // ========== VALIDATE IMPLEMENT REQUIREMENT ==========
  describe('validateImplementRequirement - casos exitosos', () => {
    
    test('debe pasar validación con implement_id y terrain_id correctos', () => {
      mockReq.body = {
        implement_id: 1,
        terrain_id: 5
      };

      validateImplementRequirement(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('debe aceptar working_depth_m válido (0.5m)', () => {
      mockReq.body = {
        implement_id: 1,
        terrain_id: 1,
        working_depth_m: 0.5
      };

      validateImplementRequirement(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.body.working_depth_m).toBe(0.5);
    });

    test('debe aceptar working_depth_m en el límite (1.0m)', () => {
      mockReq.body = {
        implement_id: 1,
        terrain_id: 1,
        working_depth_m: 1.0
      };

      validateImplementRequirement(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.body.working_depth_m).toBe(1.0);
    });

    test('debe aceptar sin working_depth_m (campo opcional)', () => {
      mockReq.body = {
        implement_id: 1,
        terrain_id: 1
      };

      validateImplementRequirement(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.body.working_depth_m).toBeUndefined();
    });
  });

  describe('validateImplementRequirement - validación implement_id', () => {
    
    test('debe rechazar si implement_id falta', () => {
      mockReq.body = {
        terrain_id: 1
      };

      validateImplementRequirement(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'implement_id es requerido'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('debe rechazar implement_id = 0', () => {
      mockReq.body = {
        implement_id: 0,
        terrain_id: 1
      };

      validateImplementRequirement(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'implement_id debe ser un entero mayor a 0'
      });
    });

    test('debe rechazar implement_id negativo', () => {
      mockReq.body = {
        implement_id: -1,
        terrain_id: 1
      };

      validateImplementRequirement(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'implement_id debe ser un entero mayor a 0'
      });
    });

    test('debe rechazar implement_id no numérico', () => {
      mockReq.body = {
        implement_id: 'abc',
        terrain_id: 1
      };

      validateImplementRequirement(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('validateImplementRequirement - validación terrain_id', () => {
    
    test('debe rechazar si terrain_id falta', () => {
      mockReq.body = {
        implement_id: 1
      };

      validateImplementRequirement(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'terrain_id es requerido'
      });
    });

    test('debe rechazar terrain_id = 0', () => {
      mockReq.body = {
        implement_id: 1,
        terrain_id: 0
      };

      validateImplementRequirement(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'terrain_id debe ser un entero mayor a 0'
      });
    });

    test('debe rechazar terrain_id negativo', () => {
      mockReq.body = {
        implement_id: 1,
        terrain_id: -5
      };

      validateImplementRequirement(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('validateImplementRequirement - validación working_depth_m', () => {
    
    test('debe rechazar working_depth_m = 0', () => {
      mockReq.body = {
        implement_id: 1,
        terrain_id: 1,
        working_depth_m: 0
      };

      validateImplementRequirement(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'working_depth_m debe ser un número mayor a 0'
      });
    });

    test('debe rechazar working_depth_m negativo', () => {
      mockReq.body = {
        implement_id: 1,
        terrain_id: 1,
        working_depth_m: -0.5
      };

      validateImplementRequirement(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('debe rechazar working_depth_m > 1.0 metros', () => {
      mockReq.body = {
        implement_id: 1,
        terrain_id: 1,
        working_depth_m: 1.5
      };

      validateImplementRequirement(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'working_depth_m no puede exceder 1.0 metros (profundidad agrícola máxima)'
      });
    });

    test('debe rechazar working_depth_m excesivo (5 metros)', () => {
      mockReq.body = {
        implement_id: 1,
        terrain_id: 1,
        working_depth_m: 5
      };

      validateImplementRequirement(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('debe rechazar working_depth_m no numérico', () => {
      mockReq.body = {
        implement_id: 1,
        terrain_id: 1,
        working_depth_m: 'profundo'
      };

      validateImplementRequirement(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('validateImplementRequirement - conversión de tipos', () => {
    
    test('debe convertir IDs strings a números', () => {
      mockReq.body = {
        implement_id: '1',
        terrain_id: '5'
      };

      validateImplementRequirement(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(typeof mockReq.body.implement_id).toBe('number');
      expect(typeof mockReq.body.terrain_id).toBe('number');
    });

    test('debe convertir working_depth_m string a número', () => {
      mockReq.body = {
        implement_id: '1',
        terrain_id: '5',
        working_depth_m: '0.75'
      };

      validateImplementRequirement(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(typeof mockReq.body.working_depth_m).toBe('number');
      expect(mockReq.body.working_depth_m).toBe(0.75);
    });

    test('valores convertidos deben ser correctos', () => {
      mockReq.body = {
        implement_id: '10',
        terrain_id: '20',
        working_depth_m: '0.3'
      };

      validateImplementRequirement(mockReq, mockRes, mockNext);

      expect(mockReq.body.implement_id).toBe(10);
      expect(mockReq.body.terrain_id).toBe(20);
      expect(mockReq.body.working_depth_m).toBe(0.3);
    });
  });

  describe('validateImplementRequirement - formato de respuesta', () => {
    
    test('debe usar formato {success: false, error} (diferente a validatePowerLoss)', () => {
      mockReq.body = {
        implement_id: -1,
        terrain_id: 1
      };

      validateImplementRequirement(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.any(String)
        })
      );
      // Verificar que NO tiene el formato antiguo (sin success)
      const callArg = mockRes.json.mock.calls[0][0];
      expect(callArg).toHaveProperty('success', false);
      expect(callArg).toHaveProperty('error');
    });
  });
});
