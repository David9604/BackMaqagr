/**
 * Tests unitarios para authController
 * Verifica: register, login, logout, getProfile, updateProfile, changePassword
 *
 * Mocks: pool (DB), User model, bcrypt, jwt.util, logger
 *
 * NOTA: asyncHandler NO retorna la promesa, así que usamos
 * una pequeña espera para que las microtareas async terminen.
 */

import { jest, describe, test, expect, beforeEach } from "@jest/globals";

// ==================== DECLARACIÓN DE MOCKS ====================

const mockPoolQuery = jest.fn();
const mockUserFindByEmail = jest.fn();
const mockUserFindById = jest.fn();
const mockUserUpdateLastSession = jest.fn();
const mockUserUpdatePassword = jest.fn();
const mockBcryptHash = jest.fn();
const mockBcryptCompare = jest.fn();
const mockGenerateToken = jest.fn();

// Mock de pool
jest.unstable_mockModule("../../../src/config/db.js", () => ({
  pool: { query: mockPoolQuery },
}));

// Mock de User model
jest.unstable_mockModule("../../../src/models/User.js", () => ({
  default: {
    findByEmail: mockUserFindByEmail,
    findById: mockUserFindById,
    updateLastSession: mockUserUpdateLastSession,
    updatePassword: mockUserUpdatePassword,
    create: jest.fn(),
    getAll: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  __esModule: true,
}));

// Mock de bcrypt
jest.unstable_mockModule("bcrypt", () => ({
  default: {
    hash: mockBcryptHash,
    compare: mockBcryptCompare,
    genSalt: jest.fn(),
  },
  hash: mockBcryptHash,
  compare: mockBcryptCompare,
  __esModule: true,
}));

// Mock de jwt.util
jest.unstable_mockModule("../../../src/utils/jwt.util.js", () => ({
  generateToken: mockGenerateToken,
  verifyToken: jest.fn(),
  refreshToken: jest.fn(),
  default: {
    generateToken: mockGenerateToken,
    verifyToken: jest.fn(),
    refreshToken: jest.fn(),
  },
}));

// Mock de logger
jest.unstable_mockModule("../../../src/utils/logger.js", () => ({
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    logRequest: jest.fn(),
    logResponse: jest.fn(),
    requestLogger: jest.fn(),
  },
}));

// ==================== IMPORT DEL CONTROLLER (después de mocks) ====================

const { register, login, logout, getProfile, updateProfile, changePassword } =
  await import("../../../src/controllers/authController.js");

// ==================== HELPERS ====================

const createMockReq = (body = {}, user = null) => ({
  body,
  user: user || {
    user_id: 1,
    email: "test@test.com",
    role_id: 2,
    name: "Test User",
  },
});

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

const createMockNext = () => jest.fn();

/**
 * Ejecuta un controller handler y espera a que las microtareas async terminen.
 * asyncHandler no retorna la promesa interna, así que necesitamos
 * esperar a que la cola de microtareas se vacíe.
 */
const callHandler = async (handler, req, res, next) => {
  handler(req, res, next);
  // Vaciar la cola de microtareas para que las promesas internas se resuelvan
  await new Promise((resolve) => setImmediate(resolve));
};

// ==================== DATOS DE PRUEBA ====================

const testUser = {
  user_id: 1,
  name: "Juan Pérez",
  email: "juan@test.com",
  password: "$2b$10$hashedPasswordAquí123456",
  role_id: 2,
  role_name: "user",
  status: "active",
  registration_date: "2026-01-15T00:00:00Z",
  last_session: "2026-02-13T10:00:00Z",
};

// ==================== TESTS ====================

describe("authController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ========================================================
  // REGISTER
  // ========================================================
  describe("register()", () => {
    test("con datos válidos → 201 + usuario creado + token", async () => {
      const req = createMockReq({
        name: "Juan Pérez",
        email: "juan@test.com",
        password: "Password123",
      });
      const res = createMockRes();
      const next = createMockNext();

      // Mock: email NO existe en BD → INSERT retorna usuario creado
      mockPoolQuery.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({
        rows: [
          {
            user_id: 1,
            name: "Juan Pérez",
            email: "juan@test.com",
            role_id: 2,
            status: "active",
            registration_date: "2026-01-15T00:00:00Z",
          },
        ],
      });

      mockBcryptHash.mockResolvedValue("$2b$10$hashedPassword");
      mockGenerateToken.mockReturnValue("fake-jwt-token-register");

      await callHandler(register, req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            user: expect.objectContaining({
              user_id: 1,
              name: "Juan Pérez",
              email: "juan@test.com",
            }),
            token: "fake-jwt-token-register",
          }),
        }),
      );
      expect(mockBcryptHash).toHaveBeenCalledWith("Password123", 10);
      expect(mockGenerateToken).toHaveBeenCalled();
    });

    test("con email duplicado → 409 conflict", async () => {
      const req = createMockReq({
        name: "Juan Pérez",
        email: "existente@test.com",
        password: "Password123",
      });
      const res = createMockRes();
      const next = createMockNext();

      // Mock: email YA existe en BD
      mockPoolQuery.mockResolvedValueOnce({
        rows: [{ user_id: 5 }],
      });

      await callHandler(register, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("ya está registrado"),
        }),
      );
      expect(mockBcryptHash).not.toHaveBeenCalled();
    });

    test("con datos incompletos (sin nombre) → 400 validation", async () => {
      const req = createMockReq({
        email: "test@test.com",
        password: "Password123",
      });
      const res = createMockRes();
      const next = createMockNext();

      await callHandler(register, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false }),
      );
      expect(mockPoolQuery).not.toHaveBeenCalled();
    });
  });

  // ========================================================
  // LOGIN
  // ========================================================
  describe("login()", () => {
    test("con credenciales correctas → 200 + token", async () => {
      const req = createMockReq({
        email: "juan@test.com",
        password: "Password123",
      });
      const res = createMockRes();
      const next = createMockNext();

      mockUserFindByEmail.mockResolvedValue({ ...testUser });
      mockBcryptCompare.mockResolvedValue(true);
      mockGenerateToken.mockReturnValue("fake-jwt-token-login");
      mockUserUpdateLastSession.mockResolvedValue({});

      await callHandler(login, req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            token: "fake-jwt-token-login",
            user: expect.objectContaining({
              email: "juan@test.com",
              name: "Juan Pérez",
            }),
          }),
        }),
      );
      expect(mockUserFindByEmail).toHaveBeenCalledWith("juan@test.com");
      expect(mockBcryptCompare).toHaveBeenCalledWith(
        "Password123",
        testUser.password,
      );
      expect(mockUserUpdateLastSession).toHaveBeenCalledWith(1);
    });

    test("con password incorrecto → 401 unauthorized", async () => {
      const req = createMockReq({
        email: "juan@test.com",
        password: "WrongPassword123",
      });
      const res = createMockRes();
      const next = createMockNext();

      mockUserFindByEmail.mockResolvedValue({ ...testUser });
      mockBcryptCompare.mockResolvedValue(false);

      await callHandler(login, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("Credenciales inválidas"),
        }),
      );
      expect(mockGenerateToken).not.toHaveBeenCalled();
    });

    test("con usuario no encontrado → 401 unauthorized", async () => {
      const req = createMockReq({
        email: "noexiste@test.com",
        password: "Password123",
      });
      const res = createMockRes();
      const next = createMockNext();

      mockUserFindByEmail.mockResolvedValue(null);

      await callHandler(login, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false }),
      );
      expect(mockBcryptCompare).not.toHaveBeenCalled();
    });
  });

  // ========================================================
  // LOGOUT
  // ========================================================
  describe("logout()", () => {
    test("retorna 200 + mensaje de éxito", async () => {
      const req = createMockReq();
      const res = createMockRes();
      const next = createMockNext();

      await callHandler(logout, req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining("Sesión cerrada"),
        }),
      );
    });
  });

  // ========================================================
  // GET PROFILE
  // ========================================================
  describe("getProfile()", () => {
    test("con usuario autenticado → 200 + datos del perfil", async () => {
      const req = createMockReq(
        {},
        { user_id: 1, email: "juan@test.com", role_id: 2 },
      );
      const res = createMockRes();
      const next = createMockNext();

      mockUserFindById.mockResolvedValue({ ...testUser });

      await callHandler(getProfile, req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            user: expect.objectContaining({
              user_id: 1,
              name: "Juan Pérez",
              email: "juan@test.com",
              role_id: 2,
            }),
          }),
        }),
      );
      expect(mockUserFindById).toHaveBeenCalledWith(1);
    });

    test("con usuario no encontrado → next(error) con status 404", async () => {
      const req = createMockReq(
        {},
        { user_id: 999, email: "ghost@test.com", role_id: 2 },
      );
      const res = createMockRes();
      const next = createMockNext();

      mockUserFindById.mockResolvedValue(null);

      await callHandler(getProfile, req, res, next);

      // asyncHandler captura el throw AppError y llama next(error)
      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(404);
      expect(error.message).toContain("Usuario no encontrado");
    });
  });

  // ========================================================
  // CHANGE PASSWORD
  // ========================================================
  describe("changePassword()", () => {
    test("con datos válidos → 200 + contraseña actualizada", async () => {
      const req = createMockReq(
        { currentPassword: "OldPassword1", newPassword: "NewPassword1" },
        { user_id: 1, email: "juan@test.com", role_id: 2 },
      );
      const res = createMockRes();
      const next = createMockNext();

      mockUserFindById.mockResolvedValue({
        user_id: 1,
        password: "$2b$10$oldHashedPassword",
      });
      mockBcryptCompare.mockResolvedValue(true);
      mockBcryptHash.mockResolvedValue("$2b$10$newHashedPassword");
      mockUserUpdatePassword.mockResolvedValue({ user_id: 1 });

      await callHandler(changePassword, req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining("Contraseña actualizada"),
        }),
      );
      expect(mockBcryptCompare).toHaveBeenCalledWith(
        "OldPassword1",
        "$2b$10$oldHashedPassword",
      );
      expect(mockBcryptHash).toHaveBeenCalledWith("NewPassword1", 10);
      expect(mockUserUpdatePassword).toHaveBeenCalledWith(
        1,
        "$2b$10$newHashedPassword",
      );
    });
  });
});
