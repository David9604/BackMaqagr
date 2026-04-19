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
const mockAdvancedSearch = jest.fn();
const mockFindRecommendationsByTractor = jest.fn();
const mockNotifyUsersAboutNewTractor = jest.fn();

// Mock de Tractor model
jest.unstable_mockModule("../../../src/models/Tractor.js", () => ({
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

jest.unstable_mockModule("../../../src/models/Recommendation.js", () => ({
  default: {
    findByTractor: mockFindRecommendationsByTractor,
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

jest.unstable_mockModule("../../../src/services/notificationService.js", () => ({
  notifyUsersAboutNewTractor: mockNotifyUsersAboutNewTractor,
  __esModule: true,
}));

// ==================== IMPORT DEL CONTROLLER (después de mocks) ====================

const controller =
  await import("../../../src/controllers/tractorController.js");
const {
  getAllTractors,
  getTractorById,
  searchTractors,
  getAvailableTractors,
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
    mockFindRecommendationsByTractor.mockResolvedValue([]);
    mockNotifyUsersAboutNewTractor.mockResolvedValue(undefined);
  });

  // ========================================================
  // GET ALL TRACTORS
  // ========================================================
  describe("getAllTractors()", () => {
    test("retorna 200 y lista de tractores con paginación", async () => {
      const req = createMockReq({}, {}, { limit: "10", page: "1" });
      req.pagination = { page: 1, limit: 10, sort: null, order: null };
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

    test("ordena por string con order desc", async () => {
      const req = createMockReq();
      req.pagination = {
        page: 1,
        limit: 10,
        sort: "name",
        order: "desc",
      };
      const res = createMockRes();
      const next = createMockNext();

      mockGetAll.mockResolvedValue([
        { tractor_id: 1, name: "alpha" },
        { tractor_id: 2, name: "Zulu" },
      ]);

      await callHandler(getAllTractors, req, res, next);

      const data = res.json.mock.calls[0][0].data;
      expect(data[0].name).toBe("Zulu");
      expect(data[1].name).toBe("alpha");
    });

    test("mantiene orden cuando los valores comparados son iguales", async () => {
      const req = createMockReq();
      req.pagination = {
        page: 1,
        limit: 10,
        sort: "name",
        order: "asc",
      };
      const res = createMockRes();
      const next = createMockNext();

      mockGetAll.mockResolvedValue([
        { tractor_id: 1, name: "same" },
        { tractor_id: 2, name: "same" },
      ]);

      await callHandler(getAllTractors, req, res, next);

      const data = res.json.mock.calls[0][0].data;
      expect(data).toHaveLength(2);
      expect(data[0].tractor_id).toBe(1);
      expect(data[1].tractor_id).toBe(2);
    });
  });

  describe("getAvailableTractors()", () => {
    test("retorna 200 y solo tractores disponibles con paginación", async () => {
      const req = {
        pagination: {
          page: 1,
          limit: 5,
        },
      };
      const res = createMockRes();
      const next = createMockNext();

      mockGetAvailable.mockResolvedValue([mockTractor]);

      await callHandler(getAvailableTractors, req, res, next);

      expect(mockGetAvailable).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: [expect.objectContaining({ tractor_id: 1 })],
          pagination: expect.objectContaining({ total: 1, totalPages: 1 }),
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
          code: "VALIDATION_ERROR",
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
          code: "NOT_FOUND",
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

    test("con potencia fuera de rango → 400", async () => {
      const req = createMockReq({}, { ...mockTractor, engine_power_hp: 5 });
      const res = createMockRes();
      const next = createMockNext();

      await callHandler(createTractor, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: "VALIDATION_ERROR",
          message: "La potencia del motor debe estar entre 10 y 500 HP",
        }),
      );
      expect(mockCreate).not.toHaveBeenCalled();
    });

    test("notifica cuando el tractor creado está disponible", async () => {
      const req = createMockReq({}, { ...mockTractor, status: "available" });
      const res = createMockRes();
      const next = createMockNext();

      mockCreate.mockResolvedValue({ ...mockTractor, status: "available" });

      await callHandler(createTractor, req, res, next);

      expect(mockNotifyUsersAboutNewTractor).toHaveBeenCalledWith(
        expect.objectContaining({ tractor_id: 1 }),
      );
    });

    test("no notifica cuando el tractor creado no está disponible", async () => {
      const req = createMockReq({}, { ...mockTractor, status: "maintenance" });
      const res = createMockRes();
      const next = createMockNext();

      mockCreate.mockResolvedValue({ ...mockTractor, status: "maintenance" });

      await callHandler(createTractor, req, res, next);

      expect(mockNotifyUsersAboutNewTractor).not.toHaveBeenCalled();
    });

    test("convierte numéricos opcionales y deja undefined para null", async () => {
      const req = createMockReq(
        {},
        {
          name: "T",
          brand: "B",
          model: "M",
          model_year: null,
          engine_power_hp: "120",
          price: null,
          weight_kg: null,
          traction_force_kn: null,
          traction_type: "4x4",
          tire_type: "std",
          tire_width_mm: null,
          tire_diameter_mm: null,
          tire_pressure_psi: null,
          status: "available",
        },
      );
      const res = createMockRes();
      const next = createMockNext();

      mockCreate.mockResolvedValue({ ...mockTractor, status: "available" });

      await callHandler(createTractor, req, res, next);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model_year: undefined,
          engine_power_hp: 120,
          price: undefined,
          weight_kg: undefined,
          traction_force_kn: undefined,
          tire_width_mm: undefined,
          tire_diameter_mm: undefined,
          tire_pressure_psi: undefined,
        }),
      );
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

    test("con potencia fuera de rango → 400", async () => {
      const req = createMockReq({ id: "1" }, { engine_power_hp: 700 });
      const res = createMockRes();
      const next = createMockNext();

      mockFindById.mockResolvedValue(mockTractor);

      await callHandler(updateTractor, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: "VALIDATION_ERROR",
          message: "La potencia del motor debe estar entre 10 y 500 HP",
        }),
      );
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    test("notifica cuando pasa de inactivo a active", async () => {
      const req = createMockReq({ id: "1" }, { status: "active" });
      const res = createMockRes();
      const next = createMockNext();

      mockFindById.mockResolvedValue({ ...mockTractor, status: "inactive" });
      mockUpdate.mockResolvedValue({ ...mockTractor, status: "active" });

      await callHandler(updateTractor, req, res, next);

      expect(mockNotifyUsersAboutNewTractor).toHaveBeenCalledWith(
        expect.objectContaining({ status: "active" }),
      );
    });

    test("no notifica cuando ya estaba available", async () => {
      const req = createMockReq({ id: "1" }, { status: "available" });
      const res = createMockRes();
      const next = createMockNext();

      mockFindById.mockResolvedValue({ ...mockTractor, status: "available" });
      mockUpdate.mockResolvedValue({ ...mockTractor, status: "available" });

      await callHandler(updateTractor, req, res, next);

      expect(mockNotifyUsersAboutNewTractor).not.toHaveBeenCalled();
    });

    test("convierte updateData numérico y deja undefined cuando recibe null", async () => {
      const req = createMockReq(
        { id: "1" },
        {
          model_year: null,
          engine_power_hp: "130",
          price: null,
          weight_kg: null,
          traction_force_kn: null,
          tire_width_mm: null,
          tire_diameter_mm: null,
          tire_pressure_psi: null,
        },
      );
      const res = createMockRes();
      const next = createMockNext();

      mockFindById.mockResolvedValue({ ...mockTractor, status: "inactive" });
      mockUpdate.mockResolvedValue({ ...mockTractor, engine_power_hp: 130, status: "inactive" });

      await callHandler(updateTractor, req, res, next);

      expect(mockUpdate).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          model_year: undefined,
          engine_power_hp: 130,
          price: undefined,
          weight_kg: undefined,
          traction_force_kn: undefined,
          tire_width_mm: undefined,
          tire_diameter_mm: undefined,
          tire_pressure_psi: undefined,
        }),
      );
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

    test("con recomendaciones activas → 400 y no se elimina", async () => {
      const req = createMockReq({ id: "1" });
      const res = createMockRes();
      const next = createMockNext();

      mockFindById.mockResolvedValue(mockTractor);
      mockFindRecommendationsByTractor.mockResolvedValue([{ recommendation_id: 33 }]);

      await callHandler(deleteTractor, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: "VALIDATION_ERROR",
          message:
            "No se puede eliminar el tractor porque tiene recomendaciones asociadas",
        }),
      );
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    test("con ID inválido → 400", async () => {
      const req = createMockReq({ id: "abc" });
      const res = createMockRes();
      const next = createMockNext();

      await callHandler(deleteTractor, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: "VALIDATION_ERROR",
          message: "ID de tractor inválido",
        }),
      );
    });
  });

  // ========================================================
  // SEARCH TRACTORS (búsqueda avanzada)
  // ========================================================
  describe("searchTractors()", () => {
    const mockSearchResults = {
      data: [
        {
          tractor_id: 1,
          name: "John Deere 5075E",
          brand: "John Deere",
          model: "5075E",
          engine_power_hp: 75,
        },
        {
          tractor_id: 2,
          name: "John Deere 6130M",
          brand: "John Deere",
          model: "6130M",
          engine_power_hp: 130,
        },
      ],
      total: 2,
    };

    const createSearchReq = (query = {}) => ({
      query,
      pagination: {
        page: 1,
        limit: 10,
        sort: "engine_power_hp",
        order: "asc",
      },
    });

    test("búsqueda con q → llama advancedSearch con término", async () => {
      const req = createSearchReq({ q: "John Deere" });
      const res = createMockRes();
      const next = createMockNext();

      mockAdvancedSearch.mockResolvedValue(mockSearchResults);

      await callHandler(searchTractors, req, res, next);

      expect(mockAdvancedSearch).toHaveBeenCalledWith(
        expect.objectContaining({ q: "John Deere" }),
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.arrayContaining([
            expect.objectContaining({ tractor_id: 1 }),
          ]),
          pagination: expect.objectContaining({ total: 2, totalPages: 1 }),
          filters: expect.objectContaining({ q: "John Deere" }),
        }),
      );
    });

    test("búsqueda con q + minPower + maxPower → filtros combinados", async () => {
      const req = createSearchReq({
        q: "deere",
        minPower: "70",
        maxPower: "200",
      });
      const res = createMockRes();
      const next = createMockNext();

      mockAdvancedSearch.mockResolvedValue(mockSearchResults);

      await callHandler(searchTractors, req, res, next);

      expect(mockAdvancedSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          q: "deere",
          minPower: 70,
          maxPower: 200,
        }),
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true }),
      );
    });

    test("búsqueda con brand exacto → filtro de marca", async () => {
      const req = createSearchReq({ brand: "John Deere" });
      const res = createMockRes();
      const next = createMockNext();

      mockAdvancedSearch.mockResolvedValue({
        data: [mockSearchResults.data[0]],
        total: 1,
      });

      await callHandler(searchTractors, req, res, next);

      expect(mockAdvancedSearch).toHaveBeenCalledWith(
        expect.objectContaining({ brand: "John Deere" }),
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({ brand: "John Deere" }),
        }),
      );
    });

    test("búsqueda con todos los filtros combinados", async () => {
      const req = createSearchReq({
        q: "deere",
        brand: "John Deere",
        minPower: "70",
        maxPower: "200",
        type: "4x4",
      });
      const res = createMockRes();
      const next = createMockNext();

      mockAdvancedSearch.mockResolvedValue(mockSearchResults);

      await callHandler(searchTractors, req, res, next);

      expect(mockAdvancedSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          q: "deere",
          brand: "John Deere",
          minPower: 70,
          maxPower: 200,
          type: "4x4",
        }),
      );
    });

    test("minPower inválido → 400", async () => {
      const req = createSearchReq({ minPower: "abc" });
      const res = createMockRes();
      const next = createMockNext();

      await callHandler(searchTractors, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: "VALIDATION_ERROR",
          message: "minPower debe ser un número positivo",
        }),
      );
    });

    test("maxPower inválido → 400", async () => {
      const req = createSearchReq({ maxPower: "abc" });
      const res = createMockRes();
      const next = createMockNext();

      await callHandler(searchTractors, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: "VALIDATION_ERROR",
          message: "maxPower debe ser un número positivo",
        }),
      );
    });

    test("minPower > maxPower → 400", async () => {
      const req = createSearchReq({ minPower: "200", maxPower: "100" });
      const res = createMockRes();
      const next = createMockNext();

      await callHandler(searchTractors, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: "VALIDATION_ERROR",
          message: "minPower no puede ser mayor que maxPower",
        }),
      );
    });

    test("sin parámetros → retorna todos con paginación", async () => {
      const req = createSearchReq({});
      const res = createMockRes();
      const next = createMockNext();

      mockAdvancedSearch.mockResolvedValue({
        data: [mockSearchResults.data[0]],
        total: 1,
      });

      await callHandler(searchTractors, req, res, next);

      expect(mockAdvancedSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          q: null,
          brand: null,
          minPower: null,
          maxPower: null,
          type: null,
        }),
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          pagination: expect.objectContaining({ page: 1, limit: 10 }),
        }),
      );
    });
  });
});
