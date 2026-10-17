import { describe, it, expect } from "bun:test";
import { calculatePagination } from "./pagination";

describe("pagination", () => {
  it("calculates first page offsets and total pages correctly", () => {
    const res = calculatePagination(25, { page: 1, pageSize: 10 });
    expect(res).toEqual({
      page: 1,
      pageSize: 10,
      offset: 0,
      totalPages: 3,
      hasMore: true,
    });
  });

  it("calculates middle and last page correctly", () => {
    const p2 = calculatePagination(25, { page: 2, pageSize: 10 });
    expect(p2).toEqual({
      page: 2,
      pageSize: 10,
      offset: 10,
      totalPages: 3,
      hasMore: true,
    });

    const p3 = calculatePagination(25, { page: 3, pageSize: 10 });
    expect(p3).toEqual({
      page: 3,
      pageSize: 10,
      offset: 20,
      totalPages: 3,
      hasMore: false,
    });
  });

  it("handles zero items", () => {
    const res = calculatePagination(0, { page: 1, pageSize: 10 });
    expect(res).toEqual({
      page: 1,
      pageSize: 10,
      offset: 0,
      totalPages: 0,
      hasMore: false,
    });
  });

  it("clamps invalid negative pages and caps max page sizes", () => {
    const res = calculatePagination(100, { page: -5, pageSize: 200, maxPageSize: 50 });
    expect(res.page).toBe(1);
    expect(res.pageSize).toBe(50);
    expect(res.offset).toBe(0);
  });
});
