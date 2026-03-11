import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import {
  request,
  registerAndGetToken,
  resetTestDB,
  closePool,
} from './helpers/testHelpers.js';
import { pool } from '../../src/config/db.js';

const binaryParser = (res, callback) => {
  res.setEncoding('binary');
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    callback(null, Buffer.from(data, 'binary'));
  });
};

describe('Exports - Integración', () => {
  let userToken;
  let userId;

  beforeAll(async () => {
    await resetTestDB();

    const login = await registerAndGetToken({
      name: 'Export User',
      email: 'export.user@integration.test',
      password: 'TestPassword1',
    });

    userToken = login.token;
    userId = login.user.user_id;

    const terrainResult = await pool.query(
      `
        INSERT INTO terrain (
          user_id, name, altitude_meters, slope_percentage, soil_type, temperature_celsius, status
        )
        VALUES ($1, 'Terreno Export', 1200, 6, 'Loam', 21, 'active')
        RETURNING terrain_id
      `,
      [userId],
    );
    const terrainId = terrainResult.rows[0].terrain_id;

    const tractorResult = await pool.query(
      'SELECT tractor_id FROM tractor ORDER BY tractor_id ASC LIMIT 1',
    );
    const implementResult = await pool.query(
      'SELECT implement_id FROM implement ORDER BY implement_id ASC LIMIT 1',
    );

    await pool.query(
      `
        INSERT INTO recommendation (
          user_id, terrain_id, tractor_id, implement_id,
          compatibility_score, observations, work_type
        )
        VALUES ($1, $2, $3, $4, 92.8, 'export test', 'general')
      `,
      [
        userId,
        terrainId,
        tractorResult.rows[0].tractor_id,
        implementResult.rows[0].implement_id,
      ],
    );
  });

  afterAll(async () => {
    await closePool();
  });

  describe('GET /api/exports/tractors?format=csv', () => {
    it('debe requerir autenticación', async () => {
      const res = await request.get('/api/exports/tractors?format=csv');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('debe exportar catálogo de tractores en CSV con attachment', async () => {
      const res = await request
        .get('/api/exports/tractors?format=csv')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/csv/);
      expect(res.headers['content-disposition']).toMatch(/attachment/);
      expect(res.text).toContain('"name","brand","power","year","price"');
      expect(res.text).toContain('John Deere 5075E');
      expect(res.text).toContain('2023');
      expect(res.text).toContain('65000');
    });

    it('debe rechazar formato inválido', async () => {
      const res = await request
        .get('/api/exports/tractors?format=pdf')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/format=csv/i);
    });
  });

  describe('GET /api/exports/recommendations?format=pdf', () => {
    it('debe requerir autenticación', async () => {
      const res = await request.get('/api/exports/recommendations?format=pdf');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('debe generar PDF de recomendaciones del usuario', async () => {
      const res = await request
        .get('/api/exports/recommendations?format=pdf')
        .set('Authorization', `Bearer ${userToken}`)
        .buffer(true)
        .parse(binaryParser);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/application\/pdf/);
      expect(res.headers['content-disposition']).toMatch(/attachment/);
      expect(Buffer.isBuffer(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(1000);
      expect(res.body.toString('utf8', 0, 5)).toBe('%PDF-');
    });

    it('debe rechazar formato inválido', async () => {
      const res = await request
        .get('/api/exports/recommendations?format=csv')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/format=pdf/i);
    });
  });
});
