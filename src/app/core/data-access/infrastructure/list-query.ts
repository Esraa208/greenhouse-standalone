/** Matches table status filter + API `Active` flag */
export type ListStatusFilter = 'all' | 'active' | 'inactive';

/** Default rows per page for server-side paginated tables. */
export const DEFAULT_PAGE_SIZE = 50;

/** Allowed page sizes sent as API `PageSize`. */
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

export interface PagedListQuery {
  readonly pageNumber: number;
  readonly pageSize?: number;
  readonly search?: string;
  readonly status?: ListStatusFilter;
  /** API `SetOrder` (server-side sorting). */
  readonly setOrder?: string;
  /** Sent only when defined (e.g. `LocationId` for units-by-location). */
  readonly extra?: Readonly<Record<string, string | number | boolean>>;
}

export interface PaginatedResult<T> {
  readonly items: T[];
  readonly totalCount: number;
  readonly pageNumber: number;
  readonly pageSize: number;
  readonly totalPages: number;
}

/** API pagination slice (supports PascalCase from .NET). */
export type ApiResultPaginationSlice = {
  readonly items?: readonly unknown[];
  readonly totalCount?: number;
  readonly TotalCount?: number;
  readonly pageNumber?: number;
  readonly PageNumber?: number;
  readonly pageSize?: number;
  readonly PageSize?: number;
  readonly totalPages?: number;
  readonly TotalPages?: number;
};

/** Maps API pagination fields; falls back to `items.length` when totalCount is missing/zero. */
export function normalizePaginatedResult<T>(
  result: ApiResultPaginationSlice | null | undefined,
  items: T[],
  /** Page size sent in the request — authoritative when provided (UI + API must match). */
  requestedPageSize?: number
): PaginatedResult<T> {
  const hasRequestedSize = requestedPageSize != null && requestedPageSize > 0;

  let pageSize: number;
  if (hasRequestedSize) {
    pageSize = requestedPageSize;
  } else {
    pageSize = Number(result?.pageSize ?? result?.PageSize);
    if (!Number.isFinite(pageSize) || pageSize <= 0) {
      pageSize = DEFAULT_PAGE_SIZE;
    }
  }

  const pageNumber = Number(result?.pageNumber ?? result?.PageNumber) || 1;
  let totalCount = Number(result?.totalCount ?? result?.TotalCount);
  if (!Number.isFinite(totalCount) || totalCount < 0) totalCount = 0;
  if (totalCount === 0 && items.length > 0) totalCount = items.length;

  let totalPages = Number(result?.totalPages ?? result?.TotalPages);
  if (!Number.isFinite(totalPages) || totalPages < 1 || hasRequestedSize) {
    totalPages = totalCount > 0 ? Math.max(1, Math.ceil(totalCount / pageSize)) : 1;
  }

  return { items, totalCount, pageNumber, pageSize, totalPages };
}

/** Table/grid fetch: pagination only (no Active or Search — filters are client-side). */
export function buildTableFetchParams(pageNumber: number): Record<string, string | number | boolean> {
  return { PageNumber: pageNumber };
}

/** Dropdowns / modals: active entities only, with pagination. */
export function buildActiveSelectParams(pageNumber: number): Record<string, string | number | boolean> {
  return { PageNumber: pageNumber, Active: true };
}

/** Locations dropdowns: `IgnoreInactive=true` returns active rows only. */
export function buildLocationSelectParams(pageNumber: number): Record<string, string | number | boolean> {
  return { PageNumber: pageNumber, IgnoreInactive: true };
}

/** Units dropdowns: `IgnoreInactive=true` returns active rows only. */
export function buildUnitSelectParams(pageNumber: number): Record<string, string | number | boolean> {
  return { PageNumber: pageNumber, IgnoreInactive: true };
}

/** Zones dropdowns: `IgnoreInactive=true` returns active rows only. */
export function buildZoneSelectParams(pageNumber: number): Record<string, string | number | boolean> {
  return { PageNumber: pageNumber, IgnoreInactive: true };
}

/** Systems dropdowns: `IgnoreInactive=true` returns active rows only. */
export function buildSystemSelectParams(pageNumber: number): Record<string, string | number | boolean> {
  return { PageNumber: pageNumber, IgnoreInactive: true };
}

/** Layers dropdowns: `IgnoreInactive=true` returns active rows only. */
export function buildLayerSelectParams(pageNumber: number): Record<string, string | number | boolean> {
  return { PageNumber: pageNumber, IgnoreInactive: true };
}

/** Crop types dropdowns: `IgnoreInactive=true` returns active rows only. */
export function buildCropTypeSelectParams(pageNumber: number): Record<string, string | number | boolean> {
  return { PageNumber: pageNumber, IgnoreInactive: true };
}

/**
 * Builds HTTP query params: always `PageNumber`.
 * Adds `Search`, `Active`, and `extra` entries only when applicable.
 */
export function buildPagedListParams(q: PagedListQuery): Record<string, string | number | boolean> {
  const params: Record<string, string | number | boolean> = {
    PageNumber: q.pageNumber,
  };
  if (q.pageSize != null && q.pageSize > 0) {
    params['PageSize'] = q.pageSize;
  }
  if (q.extra) {
    for (const [key, value] of Object.entries(q.extra)) {
      if (value === undefined || value === '') continue;
      params[key] = value;
    }
  }
  const search = q.search?.trim();
  if (search) params['Search'] = search;
  if (q.status === 'active') params['Active'] = true;
  if (q.status === 'inactive') params['Active'] = false;
  const setOrder = q.setOrder?.trim();
  if (setOrder && setOrder !== 'all') params['SetOrder'] = setOrder;
  return params;
}





