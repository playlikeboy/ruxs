/**
 * Pure pagination rules: safe page clamps, bounded page sizes, and offset calculations.
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  defaultPageSize?: number;
  maxPageSize?: number;
}

export interface PaginationResult {
  page: number;
  pageSize: number;
  offset: number;
  totalPages: number;
  hasMore: boolean;
}

export function calculatePagination(
  total: number,
  params?: PaginationParams
): PaginationResult {
  const defaultPageSize = params?.defaultPageSize ?? 10;
  const maxPageSize = params?.maxPageSize ?? 50;

  const rawPage = Number.isFinite(params?.page) ? (params?.page as number) : 1;
  const rawPageSize = Number.isFinite(params?.pageSize)
    ? (params?.pageSize as number)
    : defaultPageSize;

  const page = Math.max(1, Math.floor(rawPage));
  const pageSize = Math.max(1, Math.min(maxPageSize, Math.floor(rawPageSize)));
  const safeTotal = Math.max(0, Math.floor(Number.isFinite(total) ? total : 0));
  const totalPages = Math.ceil(safeTotal / pageSize);
  const offset = (page - 1) * pageSize;
  const hasMore = page < totalPages;

  return {
    page,
    pageSize,
    offset,
    totalPages,
    hasMore,
  };
}
