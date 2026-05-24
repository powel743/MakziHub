export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pages: number
  limit: number
}

export function parsePagination(query: {
  page?: unknown
  limit?: unknown
}): PaginationParams {
  const page = Math.max(1, parseInt(String(query.page ?? 1), 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit ?? 20), 10) || 20))
  return { page, limit }
}

export function paginationOffset(params: PaginationParams): {
  from: number
  to: number
} {
  const from = (params.page - 1) * params.limit
  const to = from + params.limit - 1
  return { from, to }
}

export function buildPaginatedResult<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResult<T> {
  return {
    data,
    total,
    page: params.page,
    pages: Math.ceil(total / params.limit),
    limit: params.limit,
  }
}
