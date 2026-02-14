/**
 * Tests de Integración - Flujo de Autenticación
 * 
 * Verifica el flujo completo de autenticación end-to-end:
 * - Registro de usuarios
 * - Inicio de sesión
 * - Acceso a perfil protegido
 * - Cierre de sesión
 * - Manejo de errores (duplicados, credenciales inválidas, sin token)
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import {
  request,
  TEST_USER,
  resetTestDB,
  closePool,
} from './helpers/testHelpers.js';

describe('Flujo de Autenticación - Integración', () => {
  // ============================================
  // SETUP / TEARDOWN
  // ============================================

  beforeAll(async () => {
    await resetTestDB();
  });

  afterAll(async () => {
    await closePool();
  });

  // Variables compartidas entre tests del flujo secuencial
  let registeredToken;
  let registeredUser;

  // ============================================
  // POST /api/auth/register
  // ============================================

  describe('POST /api/auth/register', () => {
    it('debería registrar un nuevo usuario → 201 + usuario creado en DB', async () => {
      const res = await request
        .post('/api/auth/register')
        .send(TEST_USER);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data.user.email).toBe(TEST_USER.email.toLowerCase());
      expect(res.body.data.user.name).toBe(TEST_USER.name);
      expect(res.body.data.user.role_id).toBe(2); // Usuario común
      expect(res.body.data.user.status).toBe('active');
      expect(res.body.data.user).toHaveProperty('user_id');
      expect(res.body.data.user).toHaveProperty('registration_date');

      // Guardar para tests posteriores
      registeredToken = res.body.data.token;
      registeredUser = res.body.data.user;
    });

    it('debería rechazar registro con email duplicado → 409', async () => {
      const res = await request
        .post('/api/auth/register')
        .send(TEST_USER);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/email.*registrado/i);
    });

    it('debería rechazar registro sin campos obligatorios → 400', async () => {
      const res = await request
        .post('/api/auth/register')
        .send({ email: 'incomplete@test.com' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('debería rechazar registro con email inválido → 400', async () => {
      const res = await request
        .post('/api/auth/register')
        .send({
          name: 'Invalid Email',
          email: 'not-an-email',
          password: 'ValidPass1',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('debería rechazar registro con contraseña débil → 400', async () => {
      const res = await request
        .post('/api/auth/register')
        .send({
          name: 'Weak Password',
          email: 'weak@test.com',
          password: '123',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ============================================
  // POST /api/auth/login
  // ============================================

  describe('POST /api/auth/login', () => {
    it('debería iniciar sesión correctamente → 200 + token válido', async () => {
      const res = await request
        .post('/api/auth/login')
        .send({
          email: TEST_USER.email,
          password: TEST_USER.password,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.token).toBeTruthy();
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data.user.email).toBe(TEST_USER.email.toLowerCase());
      expect(res.body.data.user.name).toBe(TEST_USER.name);

      // Actualizar token para tests posteriores
      registeredToken = res.body.data.token;
    });

    it('debería rechazar login con contraseña incorrecta → 401', async () => {
      const res = await request
        .post('/api/auth/login')
        .send({
          email: TEST_USER.email,
          password: 'WrongPassword1',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/credenciales.*inválidas/i);
    });

    it('debería rechazar login con email no registrado → 401', async () => {
      const res = await request
        .post('/api/auth/login')
        .send({
          email: 'noexiste@test.com',
          password: 'AnyPass1',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('debería rechazar login sin campos obligatorios → 400', async () => {
      const res = await request
        .post('/api/auth/login')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ============================================
  // GET /api/auth/profile
  // ============================================

  describe('GET /api/auth/profile', () => {
    it('debería obtener perfil con token válido → 200 + datos del usuario', async () => {
      const res = await request
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${registeredToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe(TEST_USER.email.toLowerCase());
      expect(res.body.data.user.name).toBe(TEST_USER.name);
      expect(res.body.data.user).toHaveProperty('user_id');
      expect(res.body.data.user).toHaveProperty('role_id');
      expect(res.body.data.user).toHaveProperty('status');
      // No debe incluir la contraseña
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('debería rechazar acceso sin token → 401', async () => {
      const res = await request
        .get('/api/auth/profile');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/token/i);
    });

    it('debería rechazar acceso con token inválido → 401', async () => {
      const res = await request
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer token.invalido.aqui');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('debería rechazar acceso con formato de Authorization incorrecto → 401', async () => {
      const res = await request
        .get('/api/auth/profile')
        .set('Authorization', registeredToken); // Sin 'Bearer '

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // ============================================
  // POST /api/auth/logout
  // ============================================

  describe('POST /api/auth/logout', () => {
    it('debería cerrar sesión exitosamente → 200', async () => {
      const res = await request
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${registeredToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/sesión.*cerrada/i);
    });
  });

  // ============================================
  // FLUJO COMPLETO END-TO-END
  // ============================================

  describe('Flujo completo E2E', () => {
    const newUser = {
      name: 'E2E User',
      email: 'e2e@integration.test',
      password: 'E2ePassword1',
    };

    it('debería completar flujo: register → login → profile → logout', async () => {
      // 1. Registrar
      const registerRes = await request
        .post('/api/auth/register')
        .send(newUser);

      expect(registerRes.status).toBe(201);
      const registerToken = registerRes.body.data.token;

      // 2. Login con las credenciales
      const loginRes = await request
        .post('/api/auth/login')
        .send({
          email: newUser.email,
          password: newUser.password,
        });

      expect(loginRes.status).toBe(200);
      const loginToken = loginRes.body.data.token;

      // 3. Acceder al perfil con token de login
      const profileRes = await request
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${loginToken}`);

      expect(profileRes.status).toBe(200);
      expect(profileRes.body.data.user.email).toBe(newUser.email.toLowerCase());

      // 4. Cerrar sesión
      const logoutRes = await request
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${loginToken}`);

      expect(logoutRes.status).toBe(200);
    });
  });
});
