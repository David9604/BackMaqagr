import { beforeEach, describe, expect, jest, test } from "@jest/globals";

const mockApplyPagination = jest.fn();
const mockGetAll = jest.fn();
const mockGetAvailable = jest.fn();

jest.unstable_mockModule("../../../src/utils/pagination.util.js", () => ({
  applyPagination: mockApplyPagination,
}));

jest.unstable_mockModule("../../../src/models/Implement.js", () => ({
  default: {
    getAll: mockGetAll,
    getAvailable: mockGetAvailable,
  },
  __esModule: true,
}));

jest.unstable_mockModule("../../../src/models/Tractor.js", () => ({
  default: {
    findById: jest.fn(),
  },
  __esModule: true,
}));

const { getAllImplements, getAvailableImplements } = await import(
  "../../../src/controllers/implementController.js"
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

describe("implementController pagination refactor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApplyPagination.mockReturnValue({
      data: [{ implement_id: 1 }],
      pagination: { page: 1, limit: 10, total: 1, pages: 1 },
    });
  });

  test("getAllImplements delegates pagination to shared utility", async () => {
    const req = { pagination: { page: 1, limit: 15 } };
    const res = createMockRes();
    mockGetAll.mockResolvedValue([{ implement_id: 1 }]);

    await callHandler(getAllImplements, req, res);

    expect(mockApplyPagination).toHaveBeenCalledWith(
      [{ implement_id: 1 }],
      1,
      1,
      15,
    );
  });

  test("getAvailableImplements delegates pagination to shared utility", async () => {
    const req = { pagination: { page: 1, limit: 8 } };
    const res = createMockRes();
    mockGetAvailable.mockResolvedValue([{ implement_id: 9 }]);

    await callHandler(getAvailableImplements, req, res);

    expect(mockApplyPagination).toHaveBeenCalledWith(
      [{ implement_id: 9 }],
      1,
      1,
      8,
    );
  });
});
