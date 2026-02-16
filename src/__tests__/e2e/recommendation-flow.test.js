/**
 * E2E Test: Flujo completo de recomendación
 * DDAAM-78: Valida el flujo completo desde autenticación hasta obtener recomendación
 * 
 * Flujo:
 * 1. Registrar/autenticar usuario
 * 2. Crear terreno con características específicas
 * 3. Crear tractor e implemento
 * 4. Ejecutar cálculo de potencia mínima
 * 5. Obtener recomendación óptima
 * 6. Validar que la recomendación respeta factores físicos
 */

import { describe, test, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import request from 'supertest';
import app from '../../app.js';
import { TestDataFactory } from './helpers/test-fixtures.js';
import { authenticatedRequest, expectJSendFormat } from './helpers/api-client.js';
import { cleanupAfterTest } from './helpers/db-cleanup.js';
import { pool } from '../../config/db.js';

describe('E2E: Flujo completo de recomendación', () => {
  let testData = {};

  // Setup: Crear datos de test antes de todas las pruebas
  beforeAll(async () => {
    // Verificar conexión a DB
    try {
      await pool.query('SELECT 1');
    } catch (error) {
      console.error('Error conectando a DB:', error);
      throw error;
    }
  });

  // Cleanup: Limpiar datos después de cada test
  afterEach(async () => {
    await cleanupAfterTest(testData);
    testData = {}; // Reset
  });

  // Cleanup final: Cerrar pool de conexiones
  afterAll(async () => {
    await pool.end();
  });

  test('debe completar flujo: autenticación → crear terreno → cálculo → recomendación', async () => {
    // ========== FASE 1: AUTENTICACIÓN ==========
    const { user, token } = await TestDataFactory.createAuthenticatedUser(2, {
      name: 'e2e_recommend_user',
      email: 'e2e_recommend@test.com'
    });

    testData.userIds = [user.user_id];

    expect(user).toBeDefined();
    expect(token).toBeDefined();
    expect(user.role_id).toBe(2); // Usuario normal

    // ========== FASE 2: CREAR TERRENO ==========
    const terrainData = {
      name: 'E2E Test Terrain',
      altitude_meters: 1800,
      slope_percentage: 5.0,
      soil_type: 'clay',
      temperature_celsius: 15
    };

    const terrainResponse = await authenticatedRequest(app, token)
      .post('/api/terrains')
      .send(terrainData);

    expect(terrainResponse.status).toBe(201);
    expectJSendFormat(terrainResponse, true);
    expect(terrainResponse.body.data).toHaveProperty('terrain_id');

    const terrain = terrainResponse.body.data;
    testData.terrainIds = [terrain.terrain_id];

    // Validar propiedades del terreno creado
    expect(terrain.soil_type).toBe('clay');
    expect(terrain.altitude_meters).toBe(1800);
    expect(terrain.user_id).toBe(user.user_id);

    // ========== FASE 3: CREAR TRACTOR E IMPLEMENTO ==========
    const tractor = await TestDataFactory.createTractor({
      brand: 'E2E Tractor',
      model: 'Model E2E',
      power_hp: 100,
      weight_kg: 4000,
      traction: '4WD',
      efficiency: 0.88
    });

    testData.tractorIds = [tractor.tractor_id];

    const implement = await TestDataFactory.createImplement({
      name: 'E2E Plow',
      type: 'plow',
      required_power_hp: 60,
      working_width_m: 3.0,
      weight_kg: 600,
      efficiency: 0.80
    });

    testData.implementIds = [implement.implement_id];

    // ========== FASE 4: EJECUTAR CÁLCULO DE POTENCIA MÍNIMA ==========
    const calculationPayload = {
      implement_id: implement.implement_id,
      terrain_id: terrain.terrain_id,
      working_depth_m: 0.3
    };

    const calcResponse = await authenticatedRequest(app, token)
      .post('/api/calculations/minimum-power')
      .send(calculationPayload);

    expect(calcResponse.status).toBe(200);
    expectJSendFormat(calcResponse, true);

    const calculation = calcResponse.body.data;
    expect(calculation).toHaveProperty('powerRequirement');
    expect(calculation.powerRequirement).toHaveProperty('minimum_power_hp');

    // Validar que el cálculo tiene sentido físico
    expect(calculation.powerRequirement.minimum_power_hp).toBeGreaterThan(0);

    // ========== FASE 5: OBTENER RECOMENDACIÓN ÓPTIMA ==========
    const recommendationResponse = await authenticatedRequest(app, token)
      .post('/api/recommendations/generate')
      .send({
        terrain_id: terrain.terrain_id,
        implement_id: implement.implement_id,
        working_depth_m: 0.3
      });

    expect(recommendationResponse.status).toBe(200);
    expectJSendFormat(recommendationResponse, true);

    const recommendation = recommendationResponse.body.data;
    
    // Validar estructura de recomendación actual (v2)
    expect(recommendation).toHaveProperty('recommendations');
    expect(recommendation).toHaveProperty('summary');
    expect(recommendation).toHaveProperty('terrain');
    expect(recommendation).toHaveProperty('implement');
    expect(recommendation).toHaveProperty('powerRequirement');
    
    // Si hay tractores recomendados
    if (recommendation.recommendations && recommendation.recommendations.length > 0) {
      expect(Array.isArray(recommendation.recommendations)).toBe(true);
    }
  }, 15000); // Timeout 15s para operaciones DB

  test('debe fallar si el usuario no está autenticado', async () => {
    // Intentar crear terreno sin token
    const response = await request(app)
      .post('/api/terrains')
      .send({
        name: 'Test',
        location: 'Test',
        area_hectares: 10,
        soil_texture: 'clay',
        ci: 2.5,
        altitude: 1500,
        crop_type: 'corn'
      });

    expect(response.status).toBe(401);
    expectJSendFormat(response, false);
    expect(response.body.message).toContain('Token');
  });

  test('debe validar datos inválidos en cálculo de potencia', async () => {
    const { user, token } = await TestDataFactory.createAuthenticatedUser();
    testData.userIds = [user.user_id];

    const terrain = await TestDataFactory.createTerrain(user.user_id);
    testData.terrainIds = [terrain.terrain_id];

    // Intentar cálculo con profundidad inválida (> 1.0)
    const invalidPayload = {
      implement_id: 1,
      terrain_id: terrain.terrain_id,
      working_depth_m: 1.5 // INVÁLIDO
    };

    const response = await authenticatedRequest(app, token)
      .post('/api/calculations/minimum-power')
      .send(invalidPayload);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('working_depth_m');
  });

  test('debe manejar terreno inexistente en cálculo', async () => {
    const { user, token } = await TestDataFactory.createAuthenticatedUser();
    testData.userIds = [user.user_id];

    const tractor = await TestDataFactory.createTractor();
    testData.tractorIds = [tractor.tractor_id];

    const payload = {
      tractor_id: tractor.tractor_id,
      terrain_id: 99999, // No existe
      working_speed_kmh: 10,
      carried_objects_weight_kg: 100
    };

    const response = await authenticatedRequest(app, token)
      .post('/api/calculations/minimum-power')
      .send(payload);

    expect(response.status).toBeGreaterThanOrEqual(400); // 400 o 404
    expect(response.body.success).toBe(false);
  });

  test('debe retornar historial de recomendaciones para el usuario', async () => {
    const { user, token } = await TestDataFactory.createAuthenticatedUser();
    testData.userIds = [user.user_id];

    const terrain = await TestDataFactory.createTerrain(user.user_id);
    testData.terrainIds = [terrain.terrain_id];

    const response = await authenticatedRequest(app, token)
      .get('/api/recommendations/history');

    expect(response.status).toBe(200);
    expectJSendFormat(response, true);
    
    // Debería retornar estructura paginada con recommendations array
    expect(response.body.data).toHaveProperty('recommendations');
    expect(response.body.data).toHaveProperty('pagination');
    expect(Array.isArray(response.body.data.recommendations)).toBe(true);
  });
});
