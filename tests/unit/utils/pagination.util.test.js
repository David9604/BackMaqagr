import { describe, expect, test } from "@jest/globals";

import { applyPagination } from "../../../src/utils/pagination.util.js";

describe("pagination.util", () => {
  test("returns data and pagination metadata with parsed numbers", () => {
    const rows = [{ id: 1 }, { id: 2 }];

    const result = applyPagination(rows, 25, "2", "10");

    expect(result).toEqual({
      data: rows,
      pagination: {
        page: 2,
        limit: 10,
        total: 25,
        pages: 3,
      },
    });
  });

  test("rounds up pages when total is not divisible by limit", () => {
    const result = applyPagination([{ id: 99 }], 11, 1, 5);

    expect(result.pagination.pages).toBe(3);
  });
});
