import { beforeEach, describe, expect, jest, test } from "@jest/globals";

const mockApplyPagination = jest.fn();
const mockFindByUserId = jest.fn();

jest.unstable_mockModule("../../../src/utils/pagination.util.js", () => ({
  applyPagination: mockApplyPagination,
}));

jest.unstable_mockModule("../../../src/models/Terrain.js", () => ({
  default: {
    findByUserId: mockFindByUserId,
    findByIdAndUser: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  __esModule: true,
}));

const { getAllTerrains } = await import(
  "../../../src/controllers/terrainController.js"
);

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const callHandler = async (handler, req, res, next = jest.fn()) => {
  handler(req, res, next);
  await new Promise((resolve) => setImmediate(resolve));
};

describe("terrainController pagination refactor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApplyPagination.mockReturnValue({
      data: [{ terrain_id: 1 }],
      pagination: { page: 1, limit: 10, total: 1, pages: 1 },
    });
  });

  test("getAllTerrains delegates pagination to shared utility", async () => {
    const req = { user: { user_id: 44 }, pagination: { page: 1, limit: 30 } };
    const res = createMockRes();
    mockFindByUserId.mockResolvedValue([{ terrain_id: 7 }]);

    await callHandler(getAllTerrains, req, res);

    expect(mockApplyPagination).toHaveBeenCalledWith(
      [{ terrain_id: 7 }],
      1,
      1,
      30,
    );
  });
});
