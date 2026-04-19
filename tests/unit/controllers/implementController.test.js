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
  getAvailableImplements,
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
      const req = createMockReq({}, {}, { limit: "10", page: "1" });
      req.pagination = { limit: 10, page: 1, sort: null, order: null };
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

    test("ordena por campo string con order desc", async () => {
      const req = createMockReq();
      req.pagination = { limit: 10, page: 1, sort: "name", order: "desc" };
      const res = createMockRes();
      const next = createMockNext();

      mockGetAll.mockResolvedValue([
        { implement_id: 1, name: "Alpha" },
        { implement_id: 2, name: "zeta" },
      ]);

      await callHandler(getAllImplements, req, res, next);

      const payload = res.json.mock.calls[0][0];
      expect(payload.data[0].name).toBe("zeta");
      expect(payload.data[1].name).toBe("Alpha");
    });

    test("ordena por campo numerico con order asc", async () => {
      const req = createMockReq();
      req.pagination = { limit: 10, page: 1, sort: "width", order: "asc" };
      const res = createMockRes();
      const next = createMockNext();

      mockGetAll.mockResolvedValue([
        { implement_id: 1, width: 5 },
        { implement_id: 2, width: 2 },
      ]);

      await callHandler(getAllImplements, req, res, next);

      const payload = res.json.mock.calls[0][0];
      expect(payload.data[0].width).toBe(2);
      expect(payload.data[1].width).toBe(5);
    });
  });

  describe("getAvailableImplements()", () => {
    test("retorna implementos disponibles paginados", async () => {
      const req = createMockReq();
      req.pagination = { limit: 10, page: 1, sort: null, order: "asc" };
      const res = createMockRes();
      const next = createMockNext();

      mockGetAvailable.mockResolvedValue([mockImplement]);

      await callHandler(getAvailableImplements, req, res, next);

      expect(mockGetAvailable).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: [expect.objectContaining({ implement_id: 1 })],
          pagination: expect.objectContaining({ total: 1, totalPages: 1 }),
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
          code: "VALIDATION_ERROR",
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
          code: "NOT_FOUND",
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

    test("retorna 400 cuando power_requirement_hp está fuera de rango", async () => {
      const req = createMockReq({}, { ...mockImplement, power_requirement_hp: 700 });
      const res = createMockRes();
      const next = createMockNext();

      await callHandler(createImplement, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: "VALIDATION_ERROR",
          message: "La potencia requerida debe estar entre 10 y 500 HP",
        }),
      );
      expect(mockCreate).not.toHaveBeenCalled();
    });

    test("normaliza valores numéricos y deja undefined cuando recibe null", async () => {
      const req = createMockReq(
        {},
        {
          implement_name: "Sembradora",
          brand: "Agro",
          power_requirement_hp: "120",
          working_width_m: null,
          soil_type: "loam",
          working_depth_cm: "25",
          weight_kg: null,
          implement_type: "seeder",
          status: "available",
        },
      );
      const res = createMockRes();
      const next = createMockNext();

      mockCreate.mockResolvedValue({ implement_id: 2 });

      await callHandler(createImplement, req, res, next);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          power_requirement_hp: 120,
          working_width_m: undefined,
          working_depth_cm: 25,
          weight_kg: undefined,
        }),
      );
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

    test("retorna 400 cuando power_requirement_hp está fuera de rango", async () => {
      const req = createMockReq({ id: "1" }, { power_requirement_hp: 9 });
      const res = createMockRes();
      const next = createMockNext();

      mockFindById.mockResolvedValue(mockImplement);

      await callHandler(updateImplement, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: "VALIDATION_ERROR",
          message: "La potencia requerida debe estar entre 10 y 500 HP",
        }),
      );
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    test("normaliza updateData con valores numéricos opcionales", async () => {
      const req = createMockReq(
        { id: "1" },
        {
          power_requirement_hp: "130",
          working_width_m: null,
          working_depth_cm: "30",
          weight_kg: null,
        },
      );
      const res = createMockRes();
      const next = createMockNext();

      mockFindById.mockResolvedValue(mockImplement);
      mockUpdate.mockResolvedValue({ ...mockImplement, power_requirement_hp: 130 });

      await callHandler(updateImplement, req, res, next);

      expect(mockUpdate).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          power_requirement_hp: 130,
          working_width_m: undefined,
          working_depth_cm: 30,
          weight_kg: undefined,
        }),
      );
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
        { q: "arado", limit: "10", page: "1" },
      );
      req.pagination = { limit: 10, page: 1 };
      const res = createMockRes();
      const next = createMockNext();

      mockAdvancedSearch.mockResolvedValue({ data: [mockImplement], total: 1 });

      await callHandler(searchImplements, req, res, next);

      expect(mockAdvancedSearch).toHaveBeenCalledWith(
        ObjectContaining({ q: "arado", limit: 10, offset: 0, page: 1 }),
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
      req.pagination = { limit: 10, page: 1 };
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
      req.pagination = { limit: 10, page: 1 };
      const res = createMockRes();
      const next = createMockNext();

      const mockTractor = { tractor_id: 1, engine_power_hp: 120 };
      mockTractorFindById.mockResolvedValue(mockTractor);
      mockAdvancedSearch.mockResolvedValue({ data: [mockImplement], total: 1 });

      await callHandler(searchImplements, req, res, next);

      expect(mockTractorFindById).toHaveBeenCalledWith(1);
      expect(mockAdvancedSearch).toHaveBeenCalledWith(
        ObjectContaining({
          q: null,
          type: null,
          minWidth: null,
          maxWidth: null,
          requiredPower: null,
          limit: 10,
          offset: 0,
          page: 1,
        }),
        120,
      );
    });

    test("retorna 400 si tractorId no es numérico", async () => {
      const ObjectContaining = expect.objectContaining;
      const req = createMockReq({}, {}, { tractorId: "abc" });
      req.pagination = { limit: 10, page: 1 };
      const res = createMockRes();
      const next = createMockNext();

      await callHandler(searchImplements, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        ObjectContaining({ success: false, code: "VALIDATION_ERROR" }),
      );
    });

    test("retorna 404 si tractorId no existe", async () => {
      const ObjectContaining = expect.objectContaining;
      const req = createMockReq({}, {}, { tractorId: "999" });
      req.pagination = { limit: 10, page: 1 };
      const res = createMockRes();
      const next = createMockNext();

      mockTractorFindById.mockResolvedValue(null);

      await callHandler(searchImplements, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        ObjectContaining({
          success: false,
          code: "NOT_FOUND",
          message: "Tractor referenciado no encontrado",
        }),
      );
    });

    test("retorna 400 si minWidth > maxWidth", async () => {
      const ObjectContaining = expect.objectContaining;
      const req = createMockReq({}, {}, { minWidth: "10", maxWidth: "5" });
      req.pagination = { limit: 10, page: 1 };
      const res = createMockRes();
      const next = createMockNext();

      await callHandler(searchImplements, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        ObjectContaining({ success: false, code: "VALIDATION_ERROR" }),
      );
    });

    test("retorna 400 si minWidth es inválido", async () => {
      const ObjectContaining = expect.objectContaining;
      const req = createMockReq({}, {}, { minWidth: "abc" });
      req.pagination = { limit: 10, page: 1 };
      const res = createMockRes();
      const next = createMockNext();

      await callHandler(searchImplements, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        ObjectContaining({ success: false, code: "VALIDATION_ERROR" }),
      );
    });

    test("retorna 400 si requiredPower es inválido", async () => {
      const req = createMockReq({}, {}, { requiredPower: "abc" });
      req.pagination = { limit: 10, page: 1 };
      const res = createMockRes();
      const next = createMockNext();

      await callHandler(searchImplements, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: "VALIDATION_ERROR",
          message: "requiredPower debe ser un número positivo",
        }),
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

    test("con ID inválido → 400", async () => {
      const req = createMockReq({ id: "bad" });
      const res = createMockRes();
      const next = createMockNext();

      await callHandler(deleteImplement, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: "VALIDATION_ERROR",
          message: "ID de implemento inválido",
        }),
      );
    });
  });
});
