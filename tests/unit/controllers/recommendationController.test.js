import { jest, describe, test, expect, beforeEach } from "@jest/globals";

// ==================== DECLARACIÓN DE MOCKS ====================

const mockFindById = jest.fn();
jest.unstable_mockModule("../../../src/models/Implement.js", () => ({
  default: { findById: mockFindById },
  __esModule: true,
}));

const mockFindTerrain = jest.fn();
jest.unstable_mockModule("../../../src/models/Terrain.js", () => ({
  default: { findByIdAndUser: mockFindTerrain },
  __esModule: true,
}));

const mockGetAll = jest.fn();
jest.unstable_mockModule("../../../src/models/Tractor.js", () => ({
  default: { getAll: mockGetAll },
  __esModule: true,
}));

const mockClient = {
  query: jest.fn().mockResolvedValue({ rows: [{ query_id: 100 }] }),
  release: jest.fn(),
};
const mockConnect = jest.fn().mockResolvedValue(mockClient);
const mockQuery = jest.fn();

jest.unstable_mockModule("../../../src/config/db.js", () => ({
  pool: { connect: mockConnect, query: mockQuery },
  __esModule: true,
}));

const mockGenerateAdvancedRec = jest.fn();
jest.unstable_mockModule(
  "../../../src/services/recommendationService.js",
  () => ({
    generateAdvancedRecommendation: mockGenerateAdvancedRec,
    generateRecommendation: jest.fn(),
    analyzeTerrain: jest.fn().mockReturnValue({ slopeClass: "FLAT" }),
    __esModule: true,
  }),
);

jest.unstable_mockModule("../../../src/config/logger.js", () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
  __esModule: true,
}));

// ==================== IMPORT DEL CONTROLLER ====================

const controller =
  await import("../../../src/controllers/recommendationController.js");
const { generateAdvancedRecommendation } = controller;

// ==================== HELPERS ====================
const callHandler = async (handler, req, res, next = jest.fn()) => {
  handler(req, res, next);
  await new Promise((resolve) => setImmediate(resolve));
  if (next.mock.calls.length > 0) {
    console.log("CAUGHT ERROR:", next.mock.calls[0][0]);
  }
};

describe("recommendationController", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
      user: { user_id: 1 },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockConnect.mockResolvedValue(mockClient);
    mockClient.query.mockResolvedValue({ rows: [{ query_id: 100 }] });

    mockFindTerrain.mockResolvedValue({
      terrain_id: 1,
      user_id: 1,
      status: "active",
      soil_type: "loam",
      slope_percentage: 5,
      name: "Field 1",
    });

    mockFindById.mockResolvedValue({
      implement_id: 1,
      implement_name: "Plow",
      power_requirement_hp: 80,
      working_depth_cm: 25,
    });

    mockGetAll.mockResolvedValue([
      {
        tractor_id: 1,
        name: "Tractor A",
        brand: "BrandX",
        status: "available",
        engine_power_hp: 100,
        price_usd: 50000,
      },
      {
        tractor_id: 2,
        name: "Tractor B",
        brand: "BrandY",
        status: "available",
        engine_power_hp: 120,
        price_usd: 80000,
      },
    ]);

    mockQuery.mockImplementation((query) => {
      if (query.includes("FROM terrain")) {
        return Promise.resolve({
          rows: [
            {
              terrain_id: 1,
              user_id: 1,
              soil_type: "loam",
              slope_percentage: 5,
              name: "Field 1",
            },
          ],
        });
      }
      return Promise.resolve({ rows: [] });
    });

    mockGenerateAdvancedRec.mockReturnValue({
      success: true,
      recommendations: [
        {
          rank: 1,
          tractor: { id: 1, name: "Tractor A", engine_power_hp: 100 },
          score: {
            total: 85,
            breakdown: {
              power_match: 40,
              price: 30,
              brand_preference: 10,
              fuel_efficiency: 5,
            },
          },
          compatibility: { surplusHP: 20 },
          classification: { label: "OPTIMAL" },
          explanation: ["Explicacion"],
        },
      ],
      terrainAnalysis: { classification: { slopeClass: "FLAT" } },
      summary: { compatibleCount: 1 },
    });
  });

  describe("generateAdvancedRecommendation", () => {
    test("retorna 400 si faltan campos requeridos", async () => {
      req.body = { terrain_id: 1 };

      await callHandler(generateAdvancedRecommendation, req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("Campos requeridos"),
        }),
      );
    });

    test("llama a generateAdvancedRec en el servicio con los filtros y customWeights", async () => {
      req.body = {
        terrain_id: 1,
        implement_id: 1,
        filters: { budget: 60000, brandPreference: "BrandX" },
        customWeights: {
          power_match: 10,
          price: 80,
          brand_preference: 5,
          fuel_efficiency: 5,
        },
      };

      await callHandler(generateAdvancedRecommendation, req, res);

      console.log("TEST RESPONSE:", res.json.mock.calls);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining("exitosamente"),
        }),
      );

      expect(mockGenerateAdvancedRec).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: { budget: 60000, brandPreference: "BrandX" },
          customWeights: {
            power_match: 10,
            price: 80,
            brand_preference: 5,
            fuel_efficiency: 5,
          },
        }),
      );
    });

    test("guarda la recomendacion de forma transaccional", async () => {
      req.body = { terrain_id: 1, implement_id: 1 };

      await callHandler(generateAdvancedRecommendation, req, res);

      expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO query"),
        expect.any(Array),
      );
      expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
    });
  });
});
