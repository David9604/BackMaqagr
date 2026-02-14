/**
 * Tests de Integración - CRUD de Terrenos
 * 
 * Verifica operaciones CRUD completas sobre terrenos:
 * - Crear terreno (POST)
 * - Listar terrenos del usuario (GET)
 * - Obtener terreno por ID (GET /:id)
 * - Actualizar terreno (PUT /:id)
 * - Eliminar terreno (DELETE /:id)
 * - Validación de ownership (solo propios terrenos)
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import {
  request,
  TEST_USER,
  TEST_TERRAIN,
  registerAndGetToken,
  resetTestDB,
  closePool,
} from './helpers/testHelpers.js';

describe('CRUD de Terrenos - Integración', () => {
  // ============================================
  // SETUP
  // ============================================

  let userToken;
  let userId;
  let createdTerrainId;

  beforeAll(async () => {
    await resetTestDB();

    // Registrar usuario de prueba
    const { token, user } = await registerAndGetToken();
    userToken = token;
    userId = user.user_id;
  });

  afterAll(async () => {
    await closePool();
  });

  // ============================================
  // POST /api/terrains
  // ============================================

  describe('POST /api/terrains - Crear terreno', () => {
    it('debería crear un terreno exitosamente → 201', async () => {
      const res = await request
        .post('/api/terrains')
        .set('Authorization', `Bearer ${userToken}`)
        .send(TEST_TERRAIN);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.name).toBe(TEST_TERRAIN.name);
      expect(res.body.data.altitude_meters).toBe(TEST_TERRAIN.altitude_meters);
      expect(res.body.data.slope_percentage).toBe(TEST_TERRAIN.slope_percentage);
      expect(res.body.data.soil_type).toBe(TEST_TERRAIN.soil_type);
      expect(res.body.data).toHaveProperty('terrain_id');

      // Guardar ID para tests posteriores
      createdTerrainId = res.body.data.terrain_id;
    });

    it('debería rechazar creación sin campos obligatorios → 400', async () => {
      const res = await request
        .post('/api/terrains')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Incomplete' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('debería rechazar creación sin autenticación → 401', async () => {
      const res = await request
        .post('/api/terrains')
        .send(TEST_TERRAIN);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // ============================================
  // GET /api/terrains
  // ============================================

  describe('GET /api/terrains - Listar terrenos', () => {
    it('debería listar terrenos del usuario → 200', async () => {
      const res = await request
        .get('/api/terrains')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body).toHaveProperty('pagination');
    });

    it('debería soportar paginación', async () => {
      const res = await request
        .get('/api/terrains?limit=1&offset=0')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeLessThanOrEqual(1);
      expect(res.body.pagination.limit).toBe(1);
    });

    it('no debería mostrar terrenos de otros usuarios', async () => {
      // Crear otro usuario
      const { token: otherToken } = await registerAndGetToken({
        name: 'Other Terrain User',
        email: 'otherterrain@integration.test',
        password: 'OtherPass1',
      });

      const res = await request
        .get('/api/terrains')
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(200);
      // El otro usuario no debe ver los terrenos del primer usuario
      expect(res.body.data.length).toBe(0);
    });
  });

  // ============================================
  // GET /api/terrains/:id
  // ============================================

  describe('GET /api/terrains/:id - Obtener terreno por ID', () => {
    it('debería obtener terreno propio por ID → 200', async () => {
      const res = await request
        .get(`/api/terrains/${createdTerrainId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.terrain_id).toBe(createdTerrainId);
      expect(res.body.data.name).toBe(TEST_TERRAIN.name);
    });

    it('debería rechazar terreno inexistente → 404', async () => {
      const res = await request
        .get('/api/terrains/99999')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('debería rechazar ID inválido → 400', async () => {
      const res = await request
        .get('/api/terrains/abc')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ============================================
  // PUT /api/terrains/:id
  // ============================================

  describe('PUT /api/terrains/:id - Actualizar terreno', () => {
    it('debería actualizar terreno propio → 200', async () => {
      const updateData = {
        name: 'Parcela Norte Actualizada',
        altitude_meters: 1600,
        slope_percentage: 15,
        soil_type: 'Clay',
      };

      const res = await request
        .put(`/api/terrains/${createdTerrainId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(updateData.name);
    });

    it('debería rechazar actualización de terreno inexistente → 404', async () => {
      const res = await request
        .put('/api/terrains/99999')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'No Existe' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('debería rechazar actualización de terreno ajeno → 404', async () => {
      const { token: otherToken } = await registerAndGetToken({
        name: 'Intruder',
        email: 'intruder@integration.test',
        password: 'IntruderPass1',
      });

      const res = await request
        .put(`/api/terrains/${createdTerrainId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ name: 'Hackeado' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // ============================================
  // DELETE /api/terrains/:id
  // ============================================

  describe('DELETE /api/terrains/:id - Eliminar terreno', () => {
    let terrainToDeleteId;

    it('debería crear terreno para eliminar', async () => {
      const res = await request
        .post('/api/terrains')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Terreno a Eliminar',
          altitude_meters: 500,
          slope_percentage: 3,
          soil_type: 'Sand',
          temperature_celsius: 28,
        });

      expect(res.status).toBe(201);
      terrainToDeleteId = res.body.data.terrain_id;
    });

    it('debería eliminar terreno propio → 200', async () => {
      const res = await request
        .delete(`/api/terrains/${terrainToDeleteId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verificar que ya no existe
      const getRes = await request
        .get(`/api/terrains/${terrainToDeleteId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(getRes.status).toBe(404);
    });

    it('debería rechazar eliminación de terreno inexistente → 404', async () => {
      const res = await request
        .delete('/api/terrains/99999')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // ============================================
  // FLUJO COMPLETO E2E
  // ============================================

  describe('Flujo CRUD E2E', () => {
    it('debería completar flujo: crear → leer → actualizar → eliminar', async () => {
      // 1. Crear
      const createRes = await request
        .post('/api/terrains')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'CRUD E2E Terrain',
          altitude_meters: 1000,
          slope_percentage: 8,
          soil_type: 'Loam',
          temperature_celsius: 20,
        });

      expect(createRes.status).toBe(201);
      const id = createRes.body.data.terrain_id;

      // 2. Leer
      const readRes = await request
        .get(`/api/terrains/${id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(readRes.status).toBe(200);
      expect(readRes.body.data.name).toBe('CRUD E2E Terrain');

      // 3. Actualizar
      const updateRes = await request
        .put(`/api/terrains/${id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'CRUD E2E Updated' });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.name).toBe('CRUD E2E Updated');

      // 4. Eliminar
      const deleteRes = await request
        .delete(`/api/terrains/${id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(deleteRes.status).toBe(200);

      // 5. Verificar eliminación
      const verifyRes = await request
        .get(`/api/terrains/${id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(verifyRes.status).toBe(404);
    });
  });
});
