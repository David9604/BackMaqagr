import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import {
  request,
  registerAndGetToken,
  createAdminAndGetToken,
  resetTestDB,
  closePool,
} from './helpers/testHelpers.js';
import { pool } from '../../src/config/db.js';

describe('Admin Analytics - Integración', () => {
  let adminToken;
  let userToken;
  let adminUserId;
  let normalUserId;
  let inactiveUserId;
  let terrainUserId;
  let terrainAdminId;
  let tractorIds;
  let implementIds;

  beforeAll(async () => {
    await resetTestDB();

    const adminLogin = await createAdminAndGetToken();
    adminToken = adminLogin.token;
    const adminUserResult = await pool.query(
      'SELECT user_id FROM users WHERE email = $1',
      ['admin@integration.test'],
    );
    adminUserId = adminUserResult.rows[0]?.user_id;

    const normalUser = await registerAndGetToken({
      name: 'Analytics User',
      email: 'analytics.user@integration.test',
      password: 'TestPassword1',
    });
    userToken = normalUser.token;
    normalUserId = normalUser.user.user_id;

    const inactiveUser = await registerAndGetToken({
      name: 'Inactive Analytics User',
      email: 'inactive.analytics@integration.test',
      password: 'TestPassword1',
    });
    inactiveUserId = inactiveUser.user.user_id;

    await pool.query(
      "UPDATE users SET status = 'inactive' WHERE user_id = $1",
      [inactiveUserId],
    );

    const terrainUserResult = await pool.query(
      `
        INSERT INTO terrain (
          user_id, name, altitude_meters, slope_percentage, soil_type, temperature_celsius, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'active')
        RETURNING terrain_id
      `,
      [normalUserId, 'Terreno Analytics Usuario', 1300, 8, 'Loam', 22],
    );
    terrainUserId = terrainUserResult.rows[0].terrain_id;

    const terrainAdminResult = await pool.query(
      `
        INSERT INTO terrain (
          user_id, name, altitude_meters, slope_percentage, soil_type, temperature_celsius, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'active')
        RETURNING terrain_id
      `,
      [adminUserId, 'Terreno Analytics Admin', 980, 4, 'Clay', 20],
    );
    terrainAdminId = terrainAdminResult.rows[0].terrain_id;

    const tractorsResult = await pool.query(
      'SELECT tractor_id FROM tractor ORDER BY tractor_id ASC LIMIT 3',
    );
    tractorIds = tractorsResult.rows.map((row) => row.tractor_id);

    const implementsResult = await pool.query(
      'SELECT implement_id FROM implement ORDER BY implement_id ASC LIMIT 3',
    );
    implementIds = implementsResult.rows.map((row) => row.implement_id);

    await pool.query(
      `
        INSERT INTO query (
          user_id, terrain_id, tractor_id, implement_id,
          pto_distance_m, carried_objects_weight_kg, working_speed_kmh,
          query_type, status, query_date
        )
        VALUES
          ($1, $2, $3, $4, 1.1, 10, 4, 'recommendation', 'completed', NOW() - INTERVAL '1 day'),
          ($1, $2, $5, $6, 1.3, 8, 5, 'power_loss', 'completed', NOW() - INTERVAL '8 days'),
          ($7, $8, $9, $10, 1.0, 5, 3, 'minimum_power', 'completed', NOW() - INTERVAL '20 days')
      `,
      [
        normalUserId,
        terrainUserId,
        tractorIds[0],
        implementIds[0],
        tractorIds[1],
        implementIds[1],
        adminUserId,
        terrainAdminId,
        tractorIds[2],
        implementIds[2],
      ],
    );

    await pool.query(
      `
        INSERT INTO recommendation (
          user_id, terrain_id, tractor_id, implement_id,
          compatibility_score, observations, work_type, recommendation_date
        )
        VALUES
          ($1, $2, $3, $4, 95.5, 'obs 1', 'tillage', NOW() - INTERVAL '1 day'),
          ($1, $2, $5, $6, 88.2, 'obs 2', 'planting', NOW() - INTERVAL '2 days'),
          ($7, $8, $9, $10, 91.4, 'obs 3', 'general', NOW() - INTERVAL '3 days'),
          ($7, $8, $5, $6, 86.9, 'obs 4', 'transport', NOW() - INTERVAL '4 days')
      `,
      [
        normalUserId,
        terrainUserId,
        tractorIds[0],
        implementIds[0],
        tractorIds[1],
        implementIds[1],
        adminUserId,
        terrainAdminId,
        tractorIds[2],
        implementIds[2],
      ],
    );
  });

  afterAll(async () => {
    await closePool();
  });

  describe('Acceso a endpoints admin', () => {
    it('debe rechazar si no hay token en /admin/stats/overview', async () => {
      const res = await request.get('/api/admin/stats/overview');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('debe rechazar usuario no admin en /admin/stats/overview', async () => {
      const res = await request
        .get('/api/admin/stats/overview')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/admin/i);
    });

    it('debe rechazar usuario no admin en /admin/stats/recommendations', async () => {
      const res = await request
        .get('/api/admin/stats/recommendations')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/admin/i);
    });

    it('debe rechazar usuario no admin en /admin/stats/users', async () => {
      const res = await request
        .get('/api/admin/stats/users')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/admin/i);
    });
  });

  describe('GET /api/admin/stats/overview', () => {
    it('debe retornar estadísticas generales con agregaciones', async () => {
      const res = await request
        .get('/api/admin/stats/overview')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.totals).toBeDefined();
      expect(res.body.data.totals.users.total).toBe(3);
      expect(res.body.data.totals.users.active).toBe(2);
      expect(res.body.data.totals.users.inactive).toBe(1);
      expect(res.body.data.totals.tractors).toBe(3);
      expect(res.body.data.totals.implements).toBe(3);
      expect(res.body.data.totals.terrains).toBe(2);
      expect(res.body.data.totals.queries).toBe(3);
      expect(res.body.data.totals.recommendations).toBe(4);

      expect(res.body.data.queriesTrend.byDay.labels.length).toBe(30);
      expect(res.body.data.queriesTrend.byDay.series.length).toBe(30);
      expect(Array.isArray(res.body.data.queriesTrend.byWeek.data)).toBe(true);
      expect(Array.isArray(res.body.data.queriesTrend.byMonth.data)).toBe(true);
      expect(res.body.data.cacheTTLSeconds).toBe(3600);
      expect(res.body.data).toHaveProperty('generatedAt');
    });
  });

  describe('GET /api/admin/stats/recommendations', () => {
    it('debe retornar distribución y top 10 en formato para charts', async () => {
      const res = await request
        .get('/api/admin/stats/recommendations')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();

      expect(Array.isArray(res.body.data.topTractors.labels)).toBe(true);
      expect(Array.isArray(res.body.data.topTractors.series)).toBe(true);
      expect(Array.isArray(res.body.data.topTractors.data)).toBe(true);
      expect(res.body.data.topTractors.data.length).toBeGreaterThan(0);

      expect(Array.isArray(res.body.data.topImplements.labels)).toBe(true);
      expect(Array.isArray(res.body.data.terrainDistribution.labels)).toBe(true);
      expect(Array.isArray(res.body.data.powerRangeDistribution.labels)).toBe(true);
      expect(res.body.data.averageRecommendedPowerHp).toBeGreaterThan(0);
    });
  });

  describe('GET /api/admin/stats/users', () => {
    it('debe retornar métricas de actividad y promedios de usuario', async () => {
      const res = await request
        .get('/api/admin/stats/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.users.total).toBe(3);
      expect(res.body.data.users.active).toBe(2);
      expect(res.body.data.users.inactive).toBe(1);
      expect(res.body.data.averages.terrainsPerUser).toBeGreaterThan(0);
      expect(res.body.data.averages.queriesPerUser).toBeGreaterThan(0);

      expect(Array.isArray(res.body.data.usersRegisteredByMonth.labels)).toBe(true);
      expect(Array.isArray(res.body.data.usersRegisteredByMonth.series)).toBe(true);
      expect(res.body.data).toHaveProperty('generatedAt');
    });
  });
});
