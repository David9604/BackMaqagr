/**
 * API Client Helper
 * Wrapper de supertest con funcionalidades comunes para tests E2E
 */

import request from 'supertest';

/**
 * Crea un request con autenticación JWT
 * @param {Object} app - Express application
 * @param {string} token - JWT token
 * @returns {Object} Supertest request con header Authorization
 */
export const authenticatedRequest = (app, token) => {
  return {
    get: (url) => request(app).get(url).set('Authorization', `Bearer ${token}`),
    post: (url) => request(app).post(url).set('Authorization', `Bearer ${token}`),
    put: (url) => request(app).put(url).set('Authorization', `Bearer ${token}`),
    patch: (url) => request(app).patch(url).set('Authorization', `Bearer ${token}`),
    delete: (url) => request(app).delete(url).set('Authorization', `Bearer ${token}`)
  };
};

/**
 * Realiza login y retorna el token
 * @param {Object} app - Express application
 * @param {string} email - Email del usuario
 * @param {string} password - Password del usuario
 * @returns {Promise<string>} JWT token
 */
export const loginUser = async (app, email, password) => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  if (response.status !== 200 || !response.body.data?.token) {
    throw new Error(`Login failed: ${response.body.message || 'Unknown error'}`);
  }

  return response.body.data.token;
};

/**
 * Registra un nuevo usuario y retorna el token
 * @param {Object} app - Express application
 * @param {Object} userData - Datos del usuario
 * @returns {Promise<Object>} { user, token }
 */
export const registerUser = async (app, userData) => {
  const response = await request(app)
    .post('/api/auth/register')
    .send(userData);

  if (response.status !== 201 || !response.body.data?.token) {
    throw new Error(`Registration failed: ${response.body.message || 'Unknown error'}`);
  }

  return {
    user: response.body.data.user,
    token: response.body.data.token
  };
};

/**
 * Verifica que una respuesta tenga el formato JSend correcto
 * @param {Object} response - Supertest response
 * @param {boolean} shouldSucceed - Si la respuesta debe ser exitosa
 */
export const expectJSendFormat = (response, shouldSucceed = true) => {
  expect(response.body).toHaveProperty('success');
  // message es opcional en JSend - algunos endpoints como GET /history pueden omitirlo
  expect(response.body.success).toBe(shouldSucceed);

  if (shouldSucceed) {
    expect(response.body).toHaveProperty('data');
  }
};

export default {
  authenticatedRequest,
  loginUser,
  registerUser,
  expectJSendFormat
};
