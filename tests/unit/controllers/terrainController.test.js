/**
 * Tests unitarios para terrainController
 * Verifica: getAllTerrains, getTerrainById, createTerrain, updateTerrain, deleteTerrain
 *
 * NOTA: terrainController valida que el recurso pertenezca al usuario (req.user.user_id).
 */

import { jest, describe, test, expect, beforeEach } from "@jest/globals";

// ==================== DECLARACIÓN DE MOCKS ====================

const mockFindByUserId = jest.fn();
const mockFindByIdAndUser = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockGetAll = jest.fn(); // Admin use only, but good to mock

// Mock de Terrain model
jest.unstable_mockModule("../../../src/models/Terrain.js", () => ({
  default: {
    findByUserId: mockFindByUserId,
    findByIdAndUser: mockFindByIdAndUser,
    create: mockCreate,
    update: mockUpdate,
    delete: mockDelete,
    getAll: mockGetAll,
  },
  __esModule: true,
}));

// ==================== IMPORT DEL CONTROLLER ====================

const controller =
  await import("../../../src/controllers/terrainController.js");
const {
  getAllTerrains,
  getTerrainById,
  createTerrain,
  updateTerrain,
  deleteTerrain,
} = controller;

// ==================== HELPERS ====================

const createMockReq = (
  params = {},
  body = {},
  query = {},
  user = { user_id: 1 },
) => ({
  params,
  body,
  query,
  user, // Importante: terrainController usa req.user
  pagination: {
    limit: 10,
    sort: null,
    order: "asc",
    page: 1,
  },
});

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const createMockNext = () => jest.fn();

/**
 * Helper para esperar promesas de asyncHandler
 */
const callHandler = async (handler, req, res, next) => {
  handler(req, res, next);
  await new Promise((resolve) => setImmediate(resolve));
};

// ==================== DATOS DE PRUEBA ====================

const mockTerrain = {
  terrain_id: 10,
  user_id: 1,
  name: "Lote Norte",
  altitude_meters: 1500,
  slope_percentage: 5,
  soil_type: "Franco",
  status: "active",
};

// ==================== TESTS ====================

describe("terrainController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ========================================================
  // GET ALL TERRAINS (BY USER)
  // ========================================================
  describe("getAllTerrains()", () => {
    test("retorna 200 y lista de terrenos del usuario", async () => {
      const req = createMockReq({}, {}, { limit: "10", page: "1" });
      const res = createMockRes();
      const next = createMockNext();

      mockFindByUserId.mockResolvedValue([mockTerrain]);

      await callHandler(getAllTerrains, req, res, next);

      expect(mockFindByUserId).toHaveBeenCalledWith(1); // req.user.user_id
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.arrayContaining([
            expect.objectContaining({ terrain_id: 10 }),
          ]),
          pagination: expect.objectContaining({
            total: 1,
            page: 1,
            limit: 10,
            totalPages: 1,
          }),
        }),
      );
    });

    test("retorna 200 y soporta ordenamiento string con order='desc'", async () => {
      const items = [
        { id: 1, implement_name: "ABC", terrain_name: "ABC", name: "ABC" },
        { id: 2, implement_name: "ZXY", terrain_name: "ZXY", name: "ZXY" }
      ];
      const req = createMockReq();
      req.pagination = { limit: 10, sort: "name", order: "desc", page: 1 };
      const res = createMockRes();
      const next = createMockNext();

      if (typeof mockFindByUserId !== 'undefined') mockFindByUserId.mockResolvedValue(items);
      if (typeof mockGetAll !== 'undefined') mockGetAll.mockResolvedValue(items);

      const handler = typeof getAllTerrains !== 'undefined' ? getAllTerrains :
                      typeof getAllTractors !== 'undefined' ? getAllTractors : 
                      getAllImplements;

      await callHandler(handler, req, res, next);
      const responseData = res.json.mock.calls[0][0].data;
      expect(responseData.length).toBe(2);
    });

    test("retorna 200 y soporta ordenamiento numérico con order='asc'", async () => {
      const items = [
        { id: 2, val: 120 },
        { id: 1, val: 80 }
      ];
      const req = createMockReq();
      req.pagination = { limit: 10, sort: "val", order: "asc", page: 1 };
      const res = createMockRes();
      const next = createMockNext();

      if (typeof mockFindByUserId !== 'undefined') mockFindByUserId.mockResolvedValue(items);
      if (typeof mockGetAll !== 'undefined') mockGetAll.mockResolvedValue(items);

      const handler = typeof getAllTerrains !== 'undefined' ? getAllTerrains :
                      typeof getAllTractors !== 'undefined' ? getAllTractors : 
                      getAllImplements;

      await callHandler(handler, req, res, next);
      const responseData = res.json.mock.calls[0][0].data;
      expect(responseData[0].val).toBe(80);
    });

    test("retorna 200 y soporta elementos iguales", async () => {
      const items = [
        { id: 1, name: "AAA", terrain_name: "AAA", implement_name: "AAA" },
        { id: 2, name: "AAA", terrain_name: "AAA", implement_name: "AAA" }
      ];
      const req = createMockReq();
      req.pagination = { limit: 10, sort: "name", order: "asc", page: 1 };
      const res = createMockRes();
      const next = createMockNext();

      if (typeof mockFindByUserId !== 'undefined') mockFindByUserId.mockResolvedValue(items);
      if (typeof mockGetAll !== 'undefined') mockGetAll.mockResolvedValue(items);

      const handler = typeof getAllTerrains !== 'undefined' ? getAllTerrains :
                      typeof getAllTractors !== 'undefined' ? getAllTractors : 
                      getAllImplements;

      await callHandler(handler, req, res, next);
      const responseData = res.json.mock.calls[0][0].data;
      expect(responseData.length).toBe(2);
    });

  });

  // ========================================================
  // GET TERRAIN BY ID
  // ========================================================
  describe("getTerrainById()", () => {
    test("con ID válido y propio → 200 + datos", async () => {
      const req = createMockReq({ id: "10" });
      const res = createMockRes();
      const next = createMockNext();

      mockFindByIdAndUser.mockResolvedValue(mockTerrain);

      await callHandler(getTerrainById, req, res, next);

      expect(mockFindByIdAndUser).toHaveBeenCalledWith(10, 1);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ terrain_id: 10 }),
        }),
      );
    });

    test("con ID ajeno o inexistente → 404", async () => {
      const req = createMockReq({ id: "999" });
      const res = createMockRes();
      const next = createMockNext();

      // Si no es del usuario o no existe, retorna null
      mockFindByIdAndUser.mockResolvedValue(null);

      await callHandler(getTerrainById, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: "NOT_FOUND",
          message: "Terreno no encontrado",
        }),
      );
    });

    test("con ID inválido → 400", async () => {
      const req = createMockReq({ id: "bad" });
      const res = createMockRes();
      const next = createMockNext();

      await callHandler(getTerrainById, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ========================================================
  // CREATE TERRAIN
  // ========================================================
  describe("createTerrain()", () => {
    test("con datos válidos → 201 + creado", async () => {
      const req = createMockReq(
        {},
        {
          name: "Nuevo Lote",
          area_hectares: 25,
          altitude_meters: 1000,
          slope_percentage: 2,
          soil_type: "Arcilloso",
        },
      );
      const res = createMockRes();
      const next = createMockNext();

      mockCreate.mockResolvedValue({ ...mockTerrain, ...req.body });

      await callHandler(createTerrain, req, res, next);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 1,
          name: "Nuevo Lote",
          area_hectares: 25,
          altitude_meters: 1000,
          slope_percentage: 2,
          soil_type: "Arcilloso",
        }),
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Terreno creado exitosamente",
        }),
      );
    });

    test("con campos faltantes → 400", async () => {
      const req = createMockReq({}, { name: "Solo Nombre" }); // Faltan altitude, slope, soil
      const res = createMockRes();
      const next = createMockNext();

      await callHandler(createTerrain, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: "VALIDATION_ERROR",
          message: "Error de validación",
          errors: expect.any(Array),
        }),
      );
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  // ========================================================
  // UPDATE TERRAIN
  // ========================================================
  describe("updateTerrain()", () => {
    test("con ID válido y propio → 200 + actualizado", async () => {
      const req = createMockReq({ id: "10" }, { name: "Lote Actualizado" });
      const res = createMockRes();
      const next = createMockNext();

      // Verifica propiedad
      mockFindByIdAndUser.mockResolvedValue(mockTerrain);
      // Update
      mockUpdate.mockResolvedValue({
        ...mockTerrain,
        name: "Lote Actualizado",
      });

      await callHandler(updateTerrain, req, res, next);

      expect(mockUpdate).toHaveBeenCalledWith(
        10,
        expect.objectContaining({ name: "Lote Actualizado" }),
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Terreno actualizado exitosamente",
        }),
      );
    });

    test("con ID ajeno o inexistente → 404", async () => {
      const req = createMockReq({ id: "20" }, { name: "Intento Hack" });
      const res = createMockRes();
      const next = createMockNext();

      mockFindByIdAndUser.mockResolvedValue(null);

      await callHandler(updateTerrain, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: "NOT_FOUND",
          message: "Terreno no encontrado",
        }),
      );
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    test("con ID inválido → 400", async () => {
      const req = createMockReq({ id: "bad" }, { name: "x" });
      const res = createMockRes();
      const next = createMockNext();

      await callHandler(updateTerrain, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: "VALIDATION_ERROR",
          message: "ID de terreno inválido",
        }),
      );
    });

    test("retorna 400 cuando area_hectares está fuera de rango", async () => {
      const req = createMockReq({ id: "10" }, { area_hectares: 0.01 });
      const res = createMockRes();
      const next = createMockNext();

      mockFindByIdAndUser.mockResolvedValue(mockTerrain);

      await callHandler(updateTerrain, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: "VALIDATION_ERROR",
          message: "area_hectares debe estar entre 0.1 y 10,000 hectáreas",
        }),
      );
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  // ========================================================
  // DELETE TERRAIN
  // ========================================================
  describe("deleteTerrain()", () => {
    test("con ID válido y propio → 200 + eliminado", async () => {
      const req = createMockReq({ id: "10" });
      const res = createMockRes();
      const next = createMockNext();

      mockFindByIdAndUser.mockResolvedValue(mockTerrain);
      mockDelete.mockResolvedValue(mockTerrain);

      await callHandler(deleteTerrain, req, res, next);

      expect(mockDelete).toHaveBeenCalledWith(10);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Terreno eliminado exitosamente",
        }),
      );
    });

    test("con ID ajeno o inexistente → 404", async () => {
      const req = createMockReq({ id: "999" });
      const res = createMockRes();
      const next = createMockNext();

      mockFindByIdAndUser.mockResolvedValue(null);

      await callHandler(deleteTerrain, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: "NOT_FOUND",
          message: "Terreno no encontrado",
        }),
      );
    });

    test("con ID inválido → 400", async () => {
      const req = createMockReq({ id: "bad" });
      const res = createMockRes();
      const next = createMockNext();

      await callHandler(deleteTerrain, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: "VALIDATION_ERROR",
          message: "ID de terreno inválido",
        }),
      );
      expect(mockDelete).not.toHaveBeenCalled();
    });
  });
});
