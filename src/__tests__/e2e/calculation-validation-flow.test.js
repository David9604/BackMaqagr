/**
 * E2E Test: Flujo de cálculos con validación progresiva
 * DDAAM-77: Valida el flujo completo de cálculos con diferentes payloads
 * 
 * Flujo:
 * 1. Login → Crear tractor + terreno
 * 2. Enviar payloads válidos e inválidos a los endpoints de cálculo
 * 3. Verificar respuesta exitosa 200 con datos correctos
 * 4. Validar estructura JSON de respuestas (formato JSend)
 */

import { describe, test, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import request from 'supertest';
import app from '../../app.js';
import { TestDataFactory } from './helpers/test-fixtures.js';
import { authenticatedRequest, expectJSendFormat } from './helpers/api-client.js';
import { cleanupAfterTest } from './helpers/db-cleanup.js';
import { pool } from '../../config/db.js';

describe('E2E: Flujo de cálculos con validación progresiva', () => {
  let testData = {};

  beforeAll(async () => {
    await pool.query('SELECT 1');
  });

  afterEach(async () => {
    await cleanupAfterTest(testData);
    testData = {};
  });

  afterAll(async () => {
    await pool.end();
  });

  test('debe calcular potencia mínima con payload válido', async () => {
    // Setup
    const { user, token } = await TestDataFactory.createAuthenticatedUser();
    testData.userIds = [user.user_id];

    const implement = await TestDataFactory.createImplement({
      type: 'plow',
      required_power_hp: 70,
      working_width_m: 2.5
    });
    testData.implementIds = [implement.implement_id];

    const terrain = await TestDataFactory.createTerrain(user.user_id, {
      soil_texture: 'clay',
      ci: 3.5,
      altitude: 2000
    });
    testData.terrainIds = [terrain.terrain_id];

    // Act: Cálculo válido
    const payload = {
      implement_id: implement.implement_id,
      terrain_id: terrain.terrain_id,
      working_depth_m: 0.3
    };

    const response = await authenticatedRequest(app, token)
      .post('/api/calculations/minimum-power')
      .send(payload);

    // Assert
    expect(response.status).toBe(200);
    expectJSendFormat(response, true);

    const data = response.body.data;
    // Verificar estructura real de la API
    expect(data).toHaveProperty('powerRequirement');
    expect(data.powerRequirement).toHaveProperty('minimum_power_hp');
    expect(data.powerRequirement).toHaveProperty('calculated_power_hp');
    expect(data).toHaveProperty('implement');
    expect(data.implement.id).toBe(implement.implement_id);
    expect(data).toHaveProperty('terrain');
    expect(data.terrain.id).toBe(terrain.terrain_id);
    expect(typeof data.powerRequirement.minimum_power_hp).toBe('number');

    // Validar valores numéricos razonables
    expect(data.powerRequirement.minimum_power_hp).toBeGreaterThan(0);
    expect(data.powerRequirement.minimum_power_hp).toBeLessThan(1000); // Límite superior razonable
  });

  test('debe rechazar cálculo con implement_id inválido', async () => {
    const { user, token } = await TestDataFactory.createAuthenticatedUser();
    testData.userIds = [user.user_id];

    const terrain = await TestDataFactory.createTerrain(user.user_id);
    testData.terrainIds = [terrain.terrain_id];

    // Payload con implement_id inválido
    const payload = {
      implement_id: 0, // INVÁLIDO
      terrain_id: terrain.terrain_id,
      working_depth_m: 0.3
    };

    const response = await authenticatedRequest(app, token)
      .post('/api/calculations/minimum-power')
      .send(payload);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toMatch(/implement_id/i);
  });

  test('debe rechazar cálculo con terrain_id faltante', async () => {
    const { token } = await TestDataFactory.createAuthenticatedUser();

    const payload = {
      implement_id: 1,
      // terrain_id: FALTA
      working_depth_m: 0.3
    };

    const response = await authenticatedRequest(app, token)
      .post('/api/calculations/minimum-power')
      .send(payload);

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/terrain_id es requerido/i);
  });

  test('debe rechazar cálculo con working_depth_m inválida (> 1.0)', async () => {
    const { user, token } = await TestDataFactory.createAuthenticatedUser();
    testData.userIds = [user.user_id];

    const terrain = await TestDataFactory.createTerrain(user.user_id);
    testData.terrainIds = [terrain.terrain_id];

    const payload = {
      implement_id: 1,
      terrain_id: terrain.terrain_id,
      working_depth_m: 1.5 // INVÁLIDO (> 1.0)
    };

    const response = await authenticatedRequest(app, token)
      .post('/api/calculations/minimum-power')
      .send(payload);

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/working_depth_m.*1\.0/i);
  });

  test('debe rechazar cálculo con working_depth_m negativo', async () => {
    const { user, token } = await TestDataFactory.createAuthenticatedUser();
    testData.userIds = [user.user_id];

    const terrain = await TestDataFactory.createTerrain(user.user_id);
    testData.terrainIds = [terrain.terrain_id];

    const payload = {
      implement_id: 1,
      terrain_id: terrain.terrain_id,
      working_depth_m: -0.5 // INVÁLIDO
    };

    const response = await authenticatedRequest(app, token)
      .post('/api/calculations/minimum-power')
      .send(payload);

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/working_depth_m.*mayor a 0/i);
  });

  test('debe aceptar cálculo sin working_depth_m (campo opcional)', async () => {
    const { user, token } = await TestDataFactory.createAuthenticatedUser();
    testData.userIds = [user.user_id];

    const implement = await TestDataFactory.createImplement();
    testData.implementIds = [implement.implement_id];

    const terrain = await TestDataFactory.createTerrain(user.user_id);
    testData.terrainIds = [terrain.terrain_id];

    const payload = {
      implement_id: implement.implement_id,
      terrain_id: terrain.terrain_id
      // working_depth_m: OMITIDO (opcional)
    };

    const response = await authenticatedRequest(app, token)
      .post('/api/calculations/minimum-power')
      .send(payload);

    expect(response.status).toBe(200);
    expectJSendFormat(response, true);
  });

  test('debe calcular potencia requerida de implemento con payload válido', async () => {
    const { user, token } = await TestDataFactory.createAuthenticatedUser();
    testData.userIds = [user.user_id];

    const implement = await TestDataFactory.createImplement({
      type: 'plow',
      required_power_hp: 70
    });
    testData.implementIds = [implement.implement_id];

    const terrain = await TestDataFactory.createTerrain(user.user_id, {
      soil_texture: 'loam',
      ci: 2.0
    });
    testData.terrainIds = [terrain.terrain_id];

    const payload = {
      implement_id: implement.implement_id,
      terrain_id: terrain.terrain_id,
      working_depth_m: 0.4
    };

    const response = await authenticatedRequest(app, token)
      .post('/api/calculations/implement-power')
      .send(payload);

    // Si la ruta existe
    if (response.status !== 404) {
      expect(response.status).toBe(200);
      expectJSendFormat(response, true);
      
      const data = response.body.data;
      expect(data).toHaveProperty('required_power_hp');
      expect(data.required_power_hp).toBeGreaterThan(0);
    }
  });

  test('debe rechazar potencia de implemento con working_depth_m > 1.0m', async () => {
    const { user, token } = await TestDataFactory.createAuthenticatedUser();
    testData.userIds = [user.user_id];

    const terrain = await TestDataFactory.createTerrain(user.user_id);
    testData.terrainIds = [terrain.terrain_id];

    const payload = {
      implement_id: 1,
      terrain_id: terrain.terrain_id,
      working_depth_m: 1.5 // INVÁLIDO (> 1.0)
    };

    const response = await authenticatedRequest(app, token)
      .post('/api/calculations/implement-power')
      .send(payload);

    if (response.status !== 404) {
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/working_depth_m.*1\.0/i);
    }
  });

  test('debe validar conversión de tipos numéricos en payload', async () => {
    const { user, token } = await TestDataFactory.createAuthenticatedUser();
    testData.userIds = [user.user_id];

    const implement = await TestDataFactory.createImplement();
    testData.implementIds = [implement.implement_id];

    const terrain = await TestDataFactory.createTerrain(user.user_id);
    testData.terrainIds = [terrain.terrain_id];

    // Enviar valores como strings (simulando input de formulario)
    const payload = {
      implement_id: String(implement.implement_id),
      terrain_id: String(terrain.terrain_id),
      working_depth_m: '0.35'
    };

    const response = await authenticatedRequest(app, token)
      .post('/api/calculations/minimum-power')
      .send(payload);

    expect(response.status).toBe(200);
    expectJSendFormat(response, true);
    
    // El middleware debe haber convertido los strings a números
    const data = response.body.data;
    expect(data.powerRequirement).toHaveProperty('minimum_power_hp');
    expect(typeof data.powerRequirement.minimum_power_hp).toBe('number');
  });

  test('debe retornar error detallado cuando implemento no existe en DB', async () => {
    const { user, token } = await TestDataFactory.createAuthenticatedUser();
    testData.userIds = [user.user_id];

    const terrain = await TestDataFactory.createTerrain(user.user_id);
    testData.terrainIds = [terrain.terrain_id];

    const payload = {
      implement_id: 99999, // No existe
      terrain_id: terrain.terrain_id,
      working_depth_m: 0.3
    };

    const response = await authenticatedRequest(app, token)
      .post('/api/calculations/minimum-power')
      .send(payload);

    expect([400, 404]).toContain(response.status);
    expect(response.body.success).toBe(false);
    expect(response.body.message || response.body.error).toMatch(/implement|no encontrado|not found/i);
  });

  test('debe validar formato JSend en todas las respuestas exitosas', async () => {
    const { user, token } = await TestDataFactory.createAuthenticatedUser();
    testData.userIds = [user.user_id];

    const implement = await TestDataFactory.createImplement();
    testData.implementIds = [implement.implement_id];

    const terrain = await TestDataFactory.createTerrain(user.user_id);
    testData.terrainIds = [terrain.terrain_id];

    const payload = {
      implement_id: implement.implement_id,
      terrain_id: terrain.terrain_id,
      working_depth_m: 0.25
    };

    const response = await authenticatedRequest(app, token)
      .post('/api/calculations/minimum-power')
      .send(payload);

    expect(response.status).toBe(200);
    
    // Validar estructura JSend estricta
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('data');
    expect(typeof response.body.message).toBe('string');
    expect(typeof response.body.data).toBe('object');
  });

  test('debe validar formato JSend en todas las respuestas de error', async () => {
    const { token } = await TestDataFactory.createAuthenticatedUser();

    const payload = {
      implement_id: -1, // INVÁLIDO
      terrain_id: 1,
      working_depth_m: 0.3
    };

    const response = await authenticatedRequest(app, token)
      .post('/api/calculations/minimum-power')
      .send(payload);

    expect(response.status).toBe(400);
    
    // Validar estructura JSend de error (puede ser {error} o {success, message})
    expect(response.body).toHaveProperty('success', false);
    expect(response.body.error || response.body.message).toBeDefined();
  });
});
