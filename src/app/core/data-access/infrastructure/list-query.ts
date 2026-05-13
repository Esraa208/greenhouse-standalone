/** Matches table status filter + API `Active` flag */
export type ListStatusFilter = 'all' | 'active' | 'inactive';

export interface PagedListQuery {
  readonly pageNumber: number;
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

/** Table/grid fetch: pagination only (no Active or Search — filters are client-side). */
export function buildTableFetchParams(pageNumber: number): Record<string, string | number | boolean> {
  return { PageNumber: pageNumber };
}

/** Dropdowns / modals: active entities only, with pagination. */
export function buildActiveSelectParams(pageNumber: number): Record<string, string | number | boolean> {
  return { PageNumber: pageNumber, Active: true };
}

/**
 * Builds HTTP query params: always `PageNumber`.
 * Adds `Search`, `Active`, and `extra` entries only when applicable.
 */
export function buildPagedListParams(q: PagedListQuery): Record<string, string | number | boolean> {
  const params: Record<string, string | number | boolean> = {
    PageNumber: q.pageNumber,
  };
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





