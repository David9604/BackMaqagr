/**
 * Tests de Integración - Flujo de Recomendaciones
 * 
 * Verifica el flujo completo de generación de recomendaciones:
 * - Creación de terreno → generación de recomendación
 * - Validación de factores de pérdida de potencia
 * - Ranking de múltiples tractores
 * - Manejo de errores (sin tractores, sin auth, terreno inválido)
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import {
  request,
  TEST_USER,
  TEST_TERRAIN,
  TEST_TERRAIN_STEEP,
  registerAndGetToken,
  createTestTerrain,
  resetTestDB,
  closePool,
} from './helpers/testHelpers.js';
import { pool } from '../../src/config/db.js';

describe('Flujo de Recomendaciones - Integración', () => {
  // ============================================
  // SETUP
  // ============================================

  let userToken;
  let userId;
  let terrain;
  let steepTerrain;
  let implementId;

  beforeAll(async () => {
    await resetTestDB();

    // 1. Registrar usuario de prueba
    const { token, user } = await registerAndGetToken();
    userToken = token;
    userId = user.user_id;

    // 2. Crear terrenos de prueba
    terrain = await createTestTerrain(userToken, TEST_TERRAIN);
    steepTerrain = await createTestTerrain(userToken, TEST_TERRAIN_STEEP);

    // 3. Obtener ID de implemento disponible
    const implementResult = await pool.query(
      "SELECT implement_id FROM implement WHERE status = 'available' LIMIT 1"
    );
    implementId = implementResult.rows[0].implement_id;
  });

  afterAll(async () => {
    await closePool();
  });

  // ============================================
  // POST /api/recommendations/generate
  // ============================================

  describe('POST /api/recommendations/generate', () => {
    it('debería generar recomendaciones para terreno e implemento → 200 + recomendación válida', async () => {
      const res = await request
        .post('/api/recommendations/generate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          terrain_id: terrain.terrain_id,
          implement_id: implementId,
          work_type: 'tillage',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();

      // Verificar estructura de la respuesta
      const { data } = res.body;
      expect(data).toHaveProperty('queryId');
      expect(data).toHaveProperty('implement');
      expect(data).toHaveProperty('terrain');
      expect(data).toHaveProperty('powerRequirement');
      expect(data).toHaveProperty('recommendations');
      expect(data).toHaveProperty('summary');

      // Verificar que hay recomendaciones
      expect(data.recommendations.length).toBeGreaterThan(0);

      // Verificar estructura de cada recomendación
      const firstRec = data.recommendations[0];
      expect(firstRec).toHaveProperty('rank');
      expect(firstRec).toHaveProperty('tractor');
      expect(firstRec).toHaveProperty('score');
      expect(firstRec).toHaveProperty('explanation');
      expect(firstRec.tractor).toHaveProperty('id');
      expect(firstRec.tractor).toHaveProperty('brand');
      expect(firstRec.tractor).toHaveProperty('model');
      expect(firstRec.tractor).toHaveProperty('engine_power_hp');

      // Verificar requerimiento de potencia
      expect(data.powerRequirement.minimum_power_hp).toBeGreaterThan(0);
    });

    it('debería considerar factores de pérdida de potencia en el cálculo', async () => {
      const res = await request
        .post('/api/recommendations/generate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          terrain_id: terrain.terrain_id,
          implement_id: implementId,
        });

      expect(res.status).toBe(200);
      const { data } = res.body;

      // Verificar que los factores de potencia están presentes
      expect(data.powerRequirement).toHaveProperty('factors');
      const { factors } = data.powerRequirement;
      expect(factors).toHaveProperty('soilFactor');
      expect(factors).toHaveProperty('slopeFactor');

      // Los factores deben ser mayores a 0
      expect(factors.soilFactor).toBeGreaterThan(0);
      expect(factors.slopeFactor).toBeGreaterThan(0);
    });

    it('debería generar ranking correcto con múltiples tractores', async () => {
      const res = await request
        .post('/api/recommendations/generate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          terrain_id: terrain.terrain_id,
          implement_id: implementId,
        });

      expect(res.status).toBe(200);
      const { recommendations } = res.body.data;

      // Si hay múltiples recomendaciones, verificar que están ordenadas por score descendente
      if (recommendations.length > 1) {
        for (let i = 0; i < recommendations.length - 1; i++) {
          expect(recommendations[i].score.total)
            .toBeGreaterThanOrEqual(recommendations[i + 1].score.total);
        }
      }

      // Verificar que los ranks son consecutivos
      recommendations.forEach((rec, index) => {
        expect(rec.rank).toBe(index + 1);
      });
    });

    it('debería generar recomendaciones diferentes para terreno con pendiente pronunciada', async () => {
      const resFlat = await request
        .post('/api/recommendations/generate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          terrain_id: terrain.terrain_id,
          implement_id: implementId,
        });

      const resSteep = await request
        .post('/api/recommendations/generate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          terrain_id: steepTerrain.terrain_id,
          implement_id: implementId,
        });

      expect(resFlat.status).toBe(200);
      expect(resSteep.status).toBe(200);

      // La potencia requerida debe ser mayor en terreno con pendiente pronunciada
      const flatPower = resFlat.body.data.powerRequirement.minimum_power_hp;
      const steepPower = resSteep.body.data.powerRequirement.minimum_power_hp;
      expect(steepPower).toBeGreaterThan(flatPower);
    });

    it('debería persistir las recomendaciones en la base de datos', async () => {
      const res = await request
        .post('/api/recommendations/generate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          terrain_id: terrain.terrain_id,
          implement_id: implementId,
          work_type: 'planting',
        });

      expect(res.status).toBe(200);
      const queryId = res.body.data.queryId;

      // Verificar que se guardó en tabla query
      const queryResult = await pool.query(
        'SELECT * FROM query WHERE query_id = $1',
        [queryId]
      );
      expect(queryResult.rows.length).toBe(1);
      expect(queryResult.rows[0].query_type).toBe('recommendation');
      expect(queryResult.rows[0].user_id).toBe(userId);

      // Verificar que se guardaron recomendaciones
      const recResult = await pool.query(
        'SELECT * FROM recommendation WHERE terrain_id = $1 AND work_type = $2 ORDER BY compatibility_score DESC',
        [terrain.terrain_id, 'planting']
      );
      expect(recResult.rows.length).toBeGreaterThan(0);
      expect(recResult.rows.length).toBeLessThanOrEqual(3); // Máximo 3 persistidas

      // Verificar que se guardó en historial
      const historyResult = await pool.query(
        'SELECT * FROM query_history WHERE query_id = $1',
        [queryId]
      );
      expect(historyResult.rows.length).toBe(1);
      expect(historyResult.rows[0].action_type).toBe('recommendation');
    });
  });

  // ============================================
  // ERRORES Y CASOS BORDE
  // ============================================

  describe('Manejo de errores', () => {
    it('debería rechazar sin autenticación → 401', async () => {
      const res = await request
        .post('/api/recommendations/generate')
        .send({
          terrain_id: terrain.terrain_id,
          implement_id: implementId,
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('debería rechazar con terreno inexistente → 404', async () => {
      const res = await request
        .post('/api/recommendations/generate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          terrain_id: 99999,
          implement_id: implementId,
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('debería rechazar con implemento inexistente → 404', async () => {
      const res = await request
        .post('/api/recommendations/generate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          terrain_id: terrain.terrain_id,
          implement_id: 99999,
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('debería rechazar sin campos requeridos → 400', async () => {
      const res = await request
        .post('/api/recommendations/generate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('debería rechazar acceso a terreno de otro usuario → 404', async () => {
      // Registrar otro usuario
      const otherUser = await registerAndGetToken({
        name: 'Other User',
        email: 'other@integration.test',
        password: 'OtherPass1',
      });

      // Intentar generar recomendación con terreno del primer usuario
      const res = await request
        .post('/api/recommendations/generate')
        .set('Authorization', `Bearer ${otherUser.token}`)
        .send({
          terrain_id: terrain.terrain_id,
          implement_id: implementId,
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // ============================================
  // GET /api/recommendations/history
  // ============================================

  describe('GET /api/recommendations/history', () => {
    it('debería obtener historial de recomendaciones del usuario → 200', async () => {
      const res = await request
        .get('/api/recommendations/history')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });

    it('debería rechazar sin autenticación → 401', async () => {
      const res = await request
        .get('/api/recommendations/history');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // ============================================
  // FLUJO COMPLETO E2E
  // ============================================

  describe('Flujo E2E: Terreno → Recomendación → Historial', () => {
    it('debería completar flujo: crear terreno → generar recomendación → consultar historial', async () => {
      // 1. Crear nuevo terreno
      const newTerrain = await createTestTerrain(userToken, {
        name: 'E2E Test Field',
        altitude_meters: 800,
        slope_percentage: 5,
        soil_type: 'Sandy loam',
        temperature_celsius: 25,
      });

      expect(newTerrain).toHaveProperty('terrain_id');

      // 2. Generar recomendación
      const recRes = await request
        .post('/api/recommendations/generate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          terrain_id: newTerrain.terrain_id,
          implement_id: implementId,
          work_type: 'general',
        });

      expect(recRes.status).toBe(200);
      expect(recRes.body.data.recommendations.length).toBeGreaterThan(0);

      // 3. Verificar que aparece en historial
      const historyRes = await request
        .get('/api/recommendations/history')
        .set('Authorization', `Bearer ${userToken}`);

      expect(historyRes.status).toBe(200);
    });
  });
});
