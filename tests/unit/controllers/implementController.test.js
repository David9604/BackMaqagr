/**
 * Tests unitarios para implementController
 * Verifica: getAllImplements, getImplementById, createImplement, updateImplement, deleteImplement
 *
 * Mocks: Implement model
 */

import { jest, describe, test, expect, beforeEach } from "@jest/globals";

// ==================== DECLARACIÓN DE MOCKS ====================

const mockGetAll = jest.fn();
const mockFindById = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockGetAvailable = jest.fn();
const mockAdvancedSearch = jest.fn();

// Mock de Implement model
jest.unstable_mockModule("../../../src/models/Implement.js", () => ({
  default: {
    getAll: mockGetAll,
    findById: mockFindById,
    create: mockCreate,
    update: mockUpdate,
    delete: mockDelete,
    getAvailable: mockGetAvailable,
    advancedSearch: mockAdvancedSearch,
  },
  __esModule: true,
}));

// Mock de Tractor model
const mockTractorFindById = jest.fn();
jest.unstable_mockModule("../../../src/models/Tractor.js", () => ({
  default: {
    findById: mockTractorFindById,
  },
  __esModule: true,
}));

// ==================== IMPORT DEL CONTROLLER ====================

const controller =
  await import("../../../src/controllers/implementController.js");
const {
  getAllImplements,
  getImplementById,
  searchImplements,
  createImplement,
  updateImplement,
  deleteImplement,
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

const mockImplement = {
  implement_id: 1,
  implement_name: "Arado de discos",
  brand: "John Deere",
  implement_type: "Arado",
  power_requirement_hp: 80,
  status: "available",
};

// ==================== TESTS ====================

describe("implementController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ========================================================
  // GET ALL IMPLEMENTS
  // ========================================================
  describe("getAllImplements()", () => {
    test("retorna 200 y lista de implementos con paginación", async () => {
      const req = createMockReq({}, {}, { limit: "10", offset: "0" });
      const res = createMockRes();
      const next = createMockNext();

      mockGetAll.mockResolvedValue([mockImplement]);

      await callHandler(getAllImplements, req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.arrayContaining([
            expect.objectContaining({ implement_id: 1 }),
          ]),
          pagination: expect.objectContaining({ total: 1 }),
        }),
      );
    });
  });

  // ========================================================
  // GET IMPLEMENT BY ID
  // ========================================================
  describe("getImplementById()", () => {
    test("con ID válido → 200 + datos", async () => {
      const req = createMockReq({ id: "1" });
      const res = createMockRes();
      const next = createMockNext();

      mockFindById.mockResolvedValue(mockImplement);

      await callHandler(getImplementById, req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ implement_id: 1 }),
        }),
      );
    });

    test("con ID inválido (texto) → 400", async () => {
      const req = createMockReq({ id: "abc" });
      const res = createMockRes();
      const next = createMockNext();

      await callHandler(getImplementById, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "ID de implemento inválido",
        }),
      );
    });

    test("con ID inexistente → 404", async () => {
      const req = createMockReq({ id: "999" });
      const res = createMockRes();
      const next = createMockNext();

      mockFindById.mockResolvedValue(null);

      await callHandler(getImplementById, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Implemento no encontrado",
        }),
      );
    });
  });

  // ========================================================
  // CREATE IMPLEMENT
  // ========================================================
  describe("createImplement()", () => {
    test("con datos válidos → 201 + creado", async () => {
      const req = createMockReq({}, { ...mockImplement });
      const res = createMockRes();
      const next = createMockNext();

      mockCreate.mockResolvedValue(mockImplement);

      await callHandler(createImplement, req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ implement_id: 1 }),
        }),
      );
    });

    test("maneja error del modelo → next(error)", async () => {
      const req = createMockReq({}, { ...mockImplement });
      const res = createMockRes();
      const next = createMockNext();

      const error = new Error("DB Error");
      mockCreate.mockRejectedValue(error);

      await callHandler(createImplement, req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  // ========================================================
  // UPDATE IMPLEMENT
  // ========================================================
  describe("updateImplement()", () => {
    test("con ID válido → 200 + actualizado", async () => {
      const req = createMockReq(
        { id: "1" },
        { implement_name: "Updated Name" },
      );
      const res = createMockRes();
      const next = createMockNext();

      mockFindById.mockResolvedValue(mockImplement);
      mockUpdate.mockResolvedValue({
        ...mockImplement,
        implement_name: "Updated Name",
      });

      await callHandler(updateImplement, req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ implement_name: "Updated Name" }),
        }),
      );
    });

    test("con ID inválido → 400", async () => {
      const req = createMockReq({ id: "invalid" });
      const res = createMockRes();
      const next = createMockNext();

      await callHandler(updateImplement, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("con ID inexistente → 404", async () => {
      const req = createMockReq({ id: "999" });
      const res = createMockRes();
      const next = createMockNext();

      mockFindById.mockResolvedValue(null);

      await callHandler(updateImplement, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ========================================================
  // SEARCH IMPLEMENTS
  // ========================================================
  describe("searchImplements()", () => {
    test("búsqueda con q → llama advancedSearch con término", async () => {
      const ObjectContaining = expect.objectContaining;
      const ArrayContaining = expect.arrayContaining;

      const req = createMockReq(
        {},
        {},
        { q: "arado", limit: "10", offset: "0" },
      );
      req.pagination = { limit: 10, offset: 0, page: 1 };
      const res = createMockRes();
      const next = createMockNext();

      mockAdvancedSearch.mockResolvedValue({ data: [mockImplement], total: 1 });

      await callHandler(searchImplements, req, res, next);

      expect(mockAdvancedSearch).toHaveBeenCalledWith(
        ObjectContaining({ q: "arado", limit: 10, offset: 0 }),
        null,
      );
      expect(res.json).toHaveBeenCalledWith(
        ObjectContaining({
          success: true,
          data: ArrayContaining([
            ObjectContaining({ implement_name: "Arado de discos" }),
          ]),
          pagination: ObjectContaining({ total: 1, limit: 10, page: 1 }),
          filters: ObjectContaining({ q: "arado", type: null }),
        }),
      );
    });

    test("búsqueda con filtros combinados (minWidth, maxWidth, requiredPower)", async () => {
      const ObjectContaining = expect.objectContaining;
      const req = createMockReq(
        {},
        {},
        { type: "plow", minWidth: "2", maxWidth: "5", requiredPower: "100" },
      );
      req.pagination = { limit: 10, offset: 0, page: 1 };
      const res = createMockRes();
      const next = createMockNext();

      mockAdvancedSearch.mockResolvedValue({ data: [mockImplement], total: 1 });

      await callHandler(searchImplements, req, res, next);

      expect(mockAdvancedSearch).toHaveBeenCalledWith(
        ObjectContaining({
          type: "plow",
          minWidth: 2,
          maxWidth: 5,
          requiredPower: 100,
        }),
        null,
      );
    });

    test("búsqueda con tractorId y compatibilidad", async () => {
      const ObjectContaining = expect.objectContaining;
      const req = createMockReq({}, {}, { tractorId: "1" });
      req.pagination = { limit: 10, offset: 0, page: 1 };
      const res = createMockRes();
      const next = createMockNext();

      const mockTractor = { tractor_id: 1, engine_power_hp: 120 };
      mockTractorFindById.mockResolvedValue(mockTractor);
      mockAdvancedSearch.mockResolvedValue({ data: [mockImplement], total: 1 });

      await callHandler(searchImplements, req, res, next);

      expect(mockTractorFindById).toHaveBeenCalledWith(1);
      expect(mockAdvancedSearch).toHaveBeenCalledWith(
        ObjectContaining({ tractorId: undefined }),
        120,
      );
    });

    test("retorna 400 si tractorId no es numérico", async () => {
      const ObjectContaining = expect.objectContaining;
      const req = createMockReq({}, {}, { tractorId: "abc" });
      req.pagination = { limit: 10, offset: 0, page: 1 };
      const res = createMockRes();
      const next = createMockNext();

      await callHandler(searchImplements, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        ObjectContaining({ success: false }),
      );
    });

    test("retorna 404 si tractorId no existe", async () => {
      const ObjectContaining = expect.objectContaining;
      const req = createMockReq({}, {}, { tractorId: "999" });
      req.pagination = { limit: 10, offset: 0, page: 1 };
      const res = createMockRes();
      const next = createMockNext();

      mockTractorFindById.mockResolvedValue(null);

      await callHandler(searchImplements, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        ObjectContaining({
          success: false,
          message: "Tractor referenciado no encontrado",
        }),
      );
    });

    test("retorna 400 si minWidth > maxWidth", async () => {
      const ObjectContaining = expect.objectContaining;
      const req = createMockReq({}, {}, { minWidth: "10", maxWidth: "5" });
      req.pagination = { limit: 10, offset: 0, page: 1 };
      const res = createMockRes();
      const next = createMockNext();

      await callHandler(searchImplements, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        ObjectContaining({ success: false }),
      );
    });

    test("retorna 400 si minWidth es inválido", async () => {
      const ObjectContaining = expect.objectContaining;
      const req = createMockReq({}, {}, { minWidth: "abc" });
      req.pagination = { limit: 10, offset: 0, page: 1 };
      const res = createMockRes();
      const next = createMockNext();

      await callHandler(searchImplements, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        ObjectContaining({ success: false }),
      );
    });
  });

  // ========================================================
  // DELETE IMPLEMENT
  // ========================================================
  describe("deleteImplement()", () => {
    test("con ID válido → 200", async () => {
      const req = createMockReq({ id: "1" });
      const res = createMockRes();
      const next = createMockNext();

      mockFindById.mockResolvedValue(mockImplement);
      mockUpdate.mockResolvedValue({ ...mockImplement, status: "inactive" });

      await callHandler(deleteImplement, req, res, next);

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

      await callHandler(deleteImplement, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
