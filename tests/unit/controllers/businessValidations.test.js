import { jest, describe, test, expect, beforeEach } from "@jest/globals";

// ==================== MOCKS ====================

const mockTractorGetAll = jest.fn().mockResolvedValue([]);
const mockFindTractor = jest.fn();
const mockUpdateTractor = jest.fn();
jest.unstable_mockModule("../../../src/models/Tractor.js", () => ({
  default: {
    findById: mockFindTractor,
    update: mockUpdateTractor,
    getAll: mockTractorGetAll,
  },
  __esModule: true,
}));

const mockFindRecByTractor = jest.fn();
jest.unstable_mockModule("../../../src/models/Recommendation.js", () => ({
  default: { findByTractor: mockFindRecByTractor },
  __esModule: true,
}));

const mockUserDelete = jest.fn();
jest.unstable_mockModule("../../../src/models/User.js", () => ({
  default: { dlt: mockUserDelete, delete: mockUserDelete, findById: jest.fn() },
  __esModule: true,
}));

const mockTerrainCreate = jest.fn();
const mockTerrainUpdate = jest.fn();
const mockTerrainFindAndUser = jest.fn();
jest.unstable_mockModule("../../../src/models/Terrain.js", () => ({
  default: {
    create: mockTerrainCreate,
    update: mockTerrainUpdate,
    findByIdAndUser: mockTerrainFindAndUser,
    findByUserId: jest.fn().mockResolvedValue([]),
  },
  __esModule: true,
}));

const mockImplementCreate = jest.fn();
const mockImplementUpdate = jest.fn();
const mockImplementFind = jest.fn();
jest.unstable_mockModule("../../../src/models/Implement.js", () => ({
  default: {
    create: mockImplementCreate,
    update: mockImplementUpdate,
    findById: mockImplementFind,
    getAll: jest.fn().mockResolvedValue([]),
  },
  __esModule: true,
}));

const mockQuery = jest.fn();
const mockConnect = jest.fn();
jest.unstable_mockModule("../../../src/config/db.js", () => ({
  pool: { query: mockQuery, connect: mockConnect },
  __esModule: true,
}));

const mockCalcPower = jest.fn();
jest.unstable_mockModule(
  "../../../src/services/minimumPowerService.js",
  () => ({
    calculateMinimumPower: mockCalcPower,
    __esModule: true,
  }),
);

const mockGenerateRec = jest.fn();
const mockGenerateAdvancedRec = jest.fn();
jest.unstable_mockModule(
  "../../../src/services/recommendationService.js",
  () => ({
    generateRecommendation: mockGenerateRec,
    generateAdvancedRecommendation: mockGenerateAdvancedRec,
    analyzeTerrain: jest.fn().mockReturnValue({ slopeClass: "FLAT" }),
    __esModule: true,
  }),
);

jest.unstable_mockModule("../../../src/utils/jwt.util.js", () => ({
  extractUserId: jest.fn().mockReturnValue(1),
  generateToken: jest.fn(),
  __esModule: true,
}));

jest.unstable_mockModule("../../../src/config/logger.js", () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
  __esModule: true,
}));

// ==================== IMPORTS ====================

const tractorController =
  await import("../../../src/controllers/tractorController.js");
const authController =
  await import("../../../src/controllers/authController.js");
const terrainController =
  await import("../../../src/controllers/terrainController.js");
const implementController =
  await import("../../../src/controllers/implementController.js");
const recommendationController =
  await import("../../../src/controllers/recommendationController.js");

// ==================== HELPERS ====================

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const req = (body = {}, params = {}) => ({
  body: {
    ...body,
    terrain_id: body.terrain_id || body.terrainId,
    implement_id: body.implement_id || body.implementId,
  },
  params,
  user: { user_id: 1, userId: 1 },
});

const wait = () => new Promise((resolve) => setImmediate(resolve));

// ==================== TESTS ====================

describe("Advanced Business Validations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Basic Validations", () => {
    test("Tractor: Power range", async () => {
      const r = req({ engine_power_hp: 5 });
      const s = mockRes();
      await tractorController.createTractor(r, s, jest.fn());
      await wait();
      expect(s.status).toHaveBeenCalledWith(400);
    });

    test("Tractor: Active recommendations deletion constraint", async () => {
      mockFindTractor.mockResolvedValue({ tractor_id: 1 });
      mockFindRecByTractor.mockResolvedValue([{ recommendation_id: 100 }]);
      const s = mockRes();
      await tractorController.deleteTractor(req({}, { id: "1" }), s, jest.fn());
      await wait();
      expect(s.status).toHaveBeenCalledWith(400);
    });
  });

  describe("Comprehensive Business Validations", () => {
    const mockTractors = [
      { tractor_id: 1, engine_power_hp: 50, status: "available", name: "T1" },
      { tractor_id: 2, engine_power_hp: 150, status: "available", name: "T2" },
    ];

    test("Recommendation Compatibility Filtering", async () => {
      mockTerrainFindAndUser.mockResolvedValue({
        terrain_id: 1,
        user_id: 1,
        soil_type: "loam",
        slope_percentage: 5,
        name: "T",
        status: "active",
      });
      mockImplementFind.mockResolvedValue({
        implement_id: 1,
        power_requirement_hp: 100,
        implement_name: "I",
      });

      mockTractorGetAll.mockResolvedValue(mockTractors);

      const qh = (sql) => {
        const s = sql.toLowerCase();
        if (s.includes("insert into query"))
          return Promise.resolve({ rows: [{ query_id: 100 }] });
        return Promise.resolve({ rows: [] });
      };
      mockQuery.mockImplementation(qh);
      mockConnect.mockResolvedValue({
        query: jest.fn().mockImplementation(qh),
        release: jest.fn(),
      });

      mockCalcPower.mockReturnValue({
        minimumPowerHP: 100,
        factors: {},
        calculatedPowerHP: 90,
      });

      const mockResult = {
        success: true,
        recommendations: [
          {
            tractor: mockTractors[0],
            rank: 1,
            score: { total: 50, breakdown: { efficiency: 50 } },
            compatibility: { utilizationPercent: 50 },
            classification: { label: "BAD" },
          },
          {
            tractor: mockTractors[1],
            rank: 2,
            score: { total: 80, breakdown: { efficiency: 80 } },
            compatibility: { utilizationPercent: 90 },
            classification: { label: "GOOD" },
          },
        ],
        terrainAnalysis: { classification: { slopeClass: "FLAT" } },
        summary: { totalAnalyzed: 2 },
      };
      mockGenerateRec.mockReturnValue(mockResult);
      mockGenerateAdvancedRec.mockReturnValue(mockResult);

      const r = req({ terrain_id: 1, implement_id: 1 });
      const s = mockRes();
      await recommendationController.generateRecommendation(r, s, jest.fn());
      await wait();
      expect(s.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true }),
      );
      const resData = s.json.mock.calls[0][0].data;
      expect(resData.recommendations.length).toBe(1);
    });

    test("User: Deletion with associated terrains", async () => {
      mockQuery.mockResolvedValue({ rows: [{ terrain_id: 50 }] });
      const s = mockRes();
      await authController.deleteUser(req({}, { id: "1" }), s, jest.fn());
      await wait();
      expect(s.status).toHaveBeenCalledWith(400);
    });

    test("Terrain: Area range validation (too large)", async () => {
      const s = mockRes();
      await terrainController.createTerrain(
        req({ area_hectares: 15000 }),
        s,
        jest.fn(),
      );
      await wait();
      expect(s.status).toHaveBeenCalledWith(400);
    });

    test("Implement: Power range validation (too low)", async () => {
      const r = req({ power_requirement_hp: 2 });
      const s = mockRes();
      await implementController.createImplement(r, s, jest.fn());
      await wait();
      expect(s.status).toHaveBeenCalledWith(400);
    });
  });
});
