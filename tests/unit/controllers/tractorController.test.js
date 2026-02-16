/**
 * Tests unitarios para tractorController
 * Verifica: getAllTractors, getTractorById, createTractor, updateTractor, deleteTractor
 *
 * Mocks: Tractor model
 */

import { jest, describe, test, expect, beforeEach } from "@jest/globals";

// ==================== DECLARACIÓN DE MOCKS ====================

const mockGetAll = jest.fn();
const mockFindById = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockGetAvailable = jest.fn();

// Mock de Tractor model
jest.unstable_mockModule("../../../src/models/Tractor.js", () => ({
  default: {
    getAll: mockGetAll,
    findById: mockFindById,
    create: mockCreate,
    update: mockUpdate,
    delete: mockDelete,
    getAvailable: mockGetAvailable,
  },
  __esModule: true,
}));

// Mock de logger (opcional, por si el controller lo usas)
jest.unstable_mockModule("../../../src/utils/logger.js", () => ({
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// ==================== IMPORT DEL CONTROLLER (después de mocks) ====================

const controller =
  await import("../../../src/controllers/tractorController.js");
const {
  getAllTractors,
  getTractorById,
  createTractor,
  updateTractor,
  deleteTractor,
} = controller;

// ==================== HELPERS ====================

const createMockReq = (params = {}, body = {}, query = {}) => ({
  params,
  body,
  query,
});

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const createMockNext = () => jest.fn();

/**
 * Helper para esperar a que las promesas de asyncHandler se resuelvan
 */
const callHandler = async (handler, req, res, next) => {
  handler(req, res, next);
  await new Promise((resolve) => setImmediate(resolve));
};

// ==================== DATOS DE PRUEBA ====================

const mockTractor = {
  tractor_id: 1,
  name: "John Deere 5075E",
  brand: "John Deere",
  model: "5075E",
  engine_power_hp: 75,
  status: "available",
};

// ==================== TESTS ====================

describe("tractorController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ========================================================
  // GET ALL TRACTORS
  // ========================================================
  describe("getAllTractors()", () => {
    test("retorna 200 y lista de tractores con paginación", async () => {
      const req = createMockReq({}, {}, { limit: "10", offset: "0" });
      const res = createMockRes();
      const next = createMockNext();

      mockGetAll.mockResolvedValue([mockTractor]);

      await callHandler(getAllTractors, req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.arrayContaining([
            expect.objectContaining({ tractor_id: 1 }),
          ]),
          pagination: expect.objectContaining({ total: 1 }),
        }),
      );
    });
  });

  // ========================================================
  // GET TRACTOR BY ID
  // ========================================================
  describe("getTractorById()", () => {
    test("con ID válido → 200 + datos", async () => {
      const req = createMockReq({ id: "1" });
      const res = createMockRes();
      const next = createMockNext();

      mockFindById.mockResolvedValue(mockTractor);

      await callHandler(getTractorById, req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ tractor_id: 1 }),
        }),
      );
    });

    test("con ID inválido (texto) → 400", async () => {
      const req = createMockReq({ id: "abc" });
      const res = createMockRes();
      const next = createMockNext();

      await callHandler(getTractorById, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "ID de tractor inválido",
        }),
      );
    });

    test("con ID inexistente → 404", async () => {
      const req = createMockReq({ id: "999" });
      const res = createMockRes();
      const next = createMockNext();

      mockFindById.mockResolvedValue(null);

      await callHandler(getTractorById, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Tractor no encontrado",
        }),
      );
    });
  });

  // ========================================================
  // CREATE TRACTOR
  // ========================================================
  describe("createTractor()", () => {
    test("con datos válidos → 201 + creado", async () => {
      const req = createMockReq({}, { ...mockTractor });
      const res = createMockRes();
      const next = createMockNext();

      mockCreate.mockResolvedValue(mockTractor);

      await callHandler(createTractor, req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ tractor_id: 1 }),
        }),
      );
    });

    test("maneja error del modelo → next(error)", async () => {
      const req = createMockReq({}, { ...mockTractor });
      const res = createMockRes();
      const next = createMockNext();

      const error = new Error("DB Error");
      mockCreate.mockRejectedValue(error);

      await callHandler(createTractor, req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  // ========================================================
  // UPDATE TRACTOR
  // ========================================================
  describe("updateTractor()", () => {
    test("con ID válido → 200 + actualizado", async () => {
      const req = createMockReq({ id: "1" }, { name: "Updated Name" });
      const res = createMockRes();
      const next = createMockNext();

      // Primero verifica si existe
      mockFindById.mockResolvedValue(mockTractor);
      // Luego actualiza
      mockUpdate.mockResolvedValue({ ...mockTractor, name: "Updated Name" });

      await callHandler(updateTractor, req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ name: "Updated Name" }),
        }),
      );
    });

    test("con ID inválido → 400", async () => {
      const req = createMockReq({ id: "invalid" });
      const res = createMockRes();
      const next = createMockNext();

      await callHandler(updateTractor, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("con ID inexistente → 404", async () => {
      const req = createMockReq({ id: "999" });
      const res = createMockRes();
      const next = createMockNext();

      mockFindById.mockResolvedValue(null);

      await callHandler(updateTractor, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ========================================================
  // DELETE TRACTOR
  // ========================================================
  describe("deleteTractor()", () => {
    test("con ID válido → 200", async () => {
      const req = createMockReq({ id: "1" });
      const res = createMockRes();
      const next = createMockNext();

      mockFindById.mockResolvedValue(mockTractor);
      mockUpdate.mockResolvedValue({ ...mockTractor, status: "inactive" });

      await callHandler(deleteTractor, req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ status: "inactive" }),
        }),
      );
    });

    test("con ID inexistente → 404", async () => {
      const req = createMockReq({ id: "999" });
      const res = createMockRes();
      const next = createMockNext();

      mockFindById.mockResolvedValue(null);

      await callHandler(deleteTractor, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
