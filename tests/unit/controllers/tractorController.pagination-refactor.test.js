import { beforeEach, describe, expect, jest, test } from "@jest/globals";

const mockApplyPagination = jest.fn();
const mockGetAll = jest.fn();
const mockGetAvailable = jest.fn();

jest.unstable_mockModule("../../../src/utils/pagination.util.js", () => ({
  applyPagination: mockApplyPagination,
}));

jest.unstable_mockModule("../../../src/models/Tractor.js", () => ({
  default: {
    getAll: mockGetAll,
    getAvailable: mockGetAvailable,
  },
  __esModule: true,
}));

jest.unstable_mockModule("../../../src/models/Recommendation.js", () => ({
  default: {
    findByTractor: jest.fn(),
  },
  __esModule: true,
}));

jest.unstable_mockModule("../../../src/services/notificationService.js", () => ({
  notifyUsersAboutNewTractor: jest.fn(),
  __esModule: true,
}));

const { getAllTractors, getAvailableTractors } = await import(
  "../../../src/controllers/tractorController.js"
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

describe("tractorController pagination refactor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApplyPagination.mockReturnValue({
      data: [{ tractor_id: 1 }],
      pagination: { page: 1, limit: 10, total: 1, pages: 1 },
    });
  });

  test("getAllTractors delegates pagination to shared utility", async () => {
    const req = { pagination: { page: 1, limit: 5 } };
    const res = createMockRes();
    mockGetAll.mockResolvedValue([{ tractor_id: 1 }]);

    await callHandler(getAllTractors, req, res);

    expect(mockApplyPagination).toHaveBeenCalledWith(
      [{ tractor_id: 1 }],
      1,
      1,
      5,
    );
  });

  test("getAvailableTractors delegates pagination to shared utility", async () => {
    const req = { pagination: { page: 1, limit: 20 } };
    const res = createMockRes();
    mockGetAvailable.mockResolvedValue([{ tractor_id: 2 }]);

    await callHandler(getAvailableTractors, req, res);

    expect(mockApplyPagination).toHaveBeenCalledWith(
      [{ tractor_id: 2 }],
      1,
      1,
      20,
    );
  });
});
