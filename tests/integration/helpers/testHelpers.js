/**
 * Helpers para Tests de Integración
 * 
 * Funciones utilitarias para crear datos de prueba,
 * autenticación y limpieza.
 */

import supertest from 'supertest';
import app from '../../../src/app.js';
import { pool } from '../../../src/config/db.js';
import { cleanTestDB, seedTestDB } from '../../../src/config/db.test.js';

// Cliente HTTP de test
export const request = supertest(app);

// ============================================
// DATOS DE PRUEBA
// ============================================

export const TEST_USER = {
  name: 'Test User',
  email: 'testuser@integration.test',
  password: 'TestPassword1',
};

export const TEST_ADMIN = {
  name: 'Admin Test',
  email: 'admin@integration.test',
  password: 'AdminPassword1',
};

export const TEST_TERRAIN = {
  name: 'Parcela Norte Test',
  altitude_meters: 1500,
  slope_percentage: 12,
  soil_type: 'Loam',
  temperature_celsius: 22,
};

export const TEST_TERRAIN_STEEP = {
  name: 'Parcela Montaña Test',
  altitude_meters: 2500,
  slope_percentage: 25,
  soil_type: 'Clay',
  temperature_celsius: 15,
};

// ============================================
// FUNCIONES DE AYUDA
// ============================================

/**
 * Registra un usuario y devuelve el token JWT
 * @param {Object} userData - Datos del usuario
 * @returns {Promise<{token: string, user: Object}>}
 */
export async function registerAndGetToken(userData = TEST_USER) {
  const res = await request
    .post('/api/auth/register')
    .send(userData);

  if (res.status !== 201) {
    throw new Error(`Register failed: ${res.status} - ${JSON.stringify(res.body)}`);
  }

  return {
    token: res.body.data.token,
    user: res.body.data.user,
  };
}

/**
 * Hace login y devuelve el token JWT
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{token: string, user: Object}>}
 */
export async function loginAndGetToken(email, password) {
  const res = await request
    .post('/api/auth/login')
    .send({ email, password });

  if (res.status !== 200) {
    throw new Error(`Login failed: ${res.status} - ${JSON.stringify(res.body)}`);
  }

  return {
    token: res.body.data.token,
    user: res.body.data.user,
  };
}

/**
 * Crea un terreno para un usuario autenticado
 * @param {string} token - JWT del usuario
 * @param {Object} terrainData - Datos del terreno
 * @returns {Promise<Object>} Terreno creado
 */
export async function createTestTerrain(token, terrainData = TEST_TERRAIN) {
  const res = await request
    .post('/api/terrains')
    .set('Authorization', `Bearer ${token}`)
    .send(terrainData);

  if (res.status !== 201) {
    throw new Error(`Create terrain failed: ${res.status} - ${JSON.stringify(res.body)}`);
  }

  return res.body.data;
}

/**
 * Crea un admin en la DB y devuelve su token
 * Se usa para operaciones que requieren rol admin
 * @returns {Promise<{token: string, user: Object}>}
 */
export async function createAdminAndGetToken() {
  // Registrar usuario normalmente
  const { token, user } = await registerAndGetToken(TEST_ADMIN);

  // Actualizar rol a admin directamente en DB
  await pool.query(
    'UPDATE users SET role_id = 1 WHERE user_id = $1',
    [user.user_id]
  );

  // Re-login para obtener token con role_id actualizado
  const loginResult = await loginAndGetToken(TEST_ADMIN.email, TEST_ADMIN.password);
  return loginResult;
}

/**
 * Resetea la base de datos de test (limpia y re-siembra)
 */
export async function resetTestDB() {
  await cleanTestDB(pool);
  await seedTestDB(pool);
}

/**
 * Cierra el pool de conexiones
 */
export async function closePool() {
  await pool.end();
}

export default {
  request,
  TEST_USER,
  TEST_ADMIN,
  TEST_TERRAIN,
  TEST_TERRAIN_STEEP,
  registerAndGetToken,
  loginAndGetToken,
  createTestTerrain,
  createAdminAndGetToken,
  resetTestDB,
  closePool,
};
