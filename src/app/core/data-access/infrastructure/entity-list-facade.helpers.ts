import { DestroyRef, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { normalizeAppError } from '@app/core/errors/app-error';
import { merge, Observable, Subject } from 'rxjs';
import { debounceTime, finalize, switchMap } from 'rxjs/operators';
import type { PaginatedResult } from './list-query';

/** Updates page size, resets to page 1, and reloads the list. */
export function changeListPageSize(
  size: number,
  pageNumber: WritableSignal<number>,
  pageSize: WritableSignal<number>,
  reloadNow$: Subject<void>
): void {
  if (size <= 0 || size === pageSize()) return;
  pageSize.set(size);
  pageNumber.set(1);
  reloadNow$.next();
}

export type ListPaginationSlice = {
  readonly totalCount: number;
  readonly pageNumber: number;
  readonly totalPages: number;
};

/** Apply server pagination totals — never overwrite client `pageSize` (UI owns it). */
export function applyListPaginationFromResult(
  p: ListPaginationSlice,
  totalCount: WritableSignal<number>,
  totalPages: WritableSignal<number>,
  pageNumber?: WritableSignal<number>,
): void {
  totalCount.set(p.totalCount);
  totalPages.set(p.totalPages);
  pageNumber?.set(p.pageNumber);
}

export type ListFacadeFilters = {
  searchQuery?: string;
  status?: string;
  sortBy?: string;
  [key: string]: any;
};

/**
 * Applies a filter patch and triggers the correct reload stream (debounced search vs immediate).
 * Skips network reload when only `sortBy` changes (client-side sort).
 */
/** Update filter signals only (no server refetch). Client-side search/status/filter on `#items`. */
export function patchListFiltersClientOnly<F extends ListFacadeFilters>(
  patch: Partial<F>,
  filters: WritableSignal<F>,
  pageNumber: WritableSignal<number>
): void {
  filters.update((curr) => ({ ...curr, ...patch }));
  if (Object.prototype.hasOwnProperty.call(patch, 'searchQuery')) {
    pageNumber.set(1);
  }
}

export function applyListFilterPatch<F extends ListFacadeFilters>(
  patch: Partial<F>,
  filters: WritableSignal<F>,
  pageNumber: WritableSignal<number>,
  reloadNow$: Subject<void>,
  reloadSearch$: Subject<void>
): void {
  filters.update((curr) => ({ ...curr, ...patch }));
  const patchKeys = Object.keys(patch);
  const hasSearch = Object.prototype.hasOwnProperty.call(patch, 'searchQuery');
  const hasStatus = Object.prototype.hasOwnProperty.call(patch, 'status');
  const hasSort = Object.prototype.hasOwnProperty.call(patch, 'sortBy');
  const hasOtherFilter = patchKeys.some((k) => k !== 'sortBy');
  if (hasSearch || hasStatus || hasOtherFilter) {
    pageNumber.set(1);
  }
  if (hasSearch) {
    reloadSearch$.next();
  } else if (hasStatus) {
    reloadNow$.next();
  } else if (hasSort) {
    reloadNow$.next();
  } else if (patchKeys.length > 0) {
    reloadNow$.next();
  }
}

/**
 * Wires `reloadNow$` + debounced `reloadSearch$` into a single list load subscription.
 * Supports both `Observable<T[]>` (legacy) and `Observable<PaginatedResult<T>>`.
 */
export function bindListReloadStream<T>(opts: {
  destroyRef: DestroyRef;
  reloadNow$: Subject<void>;
  reloadSearch$: Subject<void>;
  debounceMs?: number;
  load: () => Observable<PaginatedResult<T>>;
  setItems: (items: T[]) => void;
  setLoading: (v: boolean) => void;
  setError: (msg: string | null) => void;
  setPagination?: (p: { totalCount: number; pageNumber: number; pageSize: number; totalPages: number }) => void;
}): void {
  const debounceMs = opts.debounceMs ?? 350;
  merge(opts.reloadNow$, opts.reloadSearch$.pipe(debounceTime(debounceMs)))
    .pipe(
      switchMap(() => {
        opts.setLoading(true);
        opts.setError(null);
        return opts.load().pipe(finalize(() => opts.setLoading(false)));
      }),
      takeUntilDestroyed(opts.destroyRef)
    )
    .subscribe({
      next: (result) => {
        opts.setItems(result.items);
        opts.setPagination?.({
          totalCount: result.totalCount,
          pageNumber: result.pageNumber,
          pageSize: result.pageSize,
          totalPages: result.totalPages,
        });
      },
      error: (err: unknown) => {
        opts.setError(extractApiErrorMessage(err));
      },
    });
}

/**
 * Runs a mutation then reloads the full list (create / update / delete flow).
 */
export function subscribeMutationReloadList<T>(opts: {
  destroyRef: DestroyRef;
  mutation$: Observable<unknown>;
  reloadList: () => Observable<T[]>;
  setLoading: (v: boolean) => void;
  setError: (msg: string | null) => void;
  setItems: (items: T[]) => void;
  onError?: (message: string) => void;
}): void {
  opts.setLoading(true);
  opts.setError(null);
  opts.mutation$
    .pipe(
      switchMap(() => opts.reloadList()),
      finalize(() => opts.setLoading(false)),
      takeUntilDestroyed(opts.destroyRef)
    )
    .subscribe({
      next: (items) => opts.setItems(items),
      error: (err: unknown) => {
        const message = extractApiErrorMessage(err);
        opts.setError(message);
        opts.onError?.(message);
      },
    });
}

/**
 * Uses the mutation response body only (e.g. created/updated row with server `id`) — **no extra GET list**.
 * Aligns with Swagger flows where POST/PUT return the entity.
 */
export function subscribeMutationWithResult<T>(opts: {
  destroyRef: DestroyRef;
  mutation$: Observable<T>;
  setLoading: (v: boolean) => void;
  setError: (msg: string | null) => void;
  onSuccess: (result: T) => void;
  onError?: (message: string) => void;
}): void {
  opts.setLoading(true);
  opts.setError(null);
  opts.mutation$
    .pipe(finalize(() => opts.setLoading(false)), takeUntilDestroyed(opts.destroyRef))
    .subscribe({
      next: (result) => opts.onSuccess(result),
      error: (err: unknown) => {
        const message = extractApiErrorMessage(err);
        opts.setError(message);
        opts.onError?.(message);
      },
    });
}

/** For DELETE / no response body: update local list without refetching. */
export function subscribeMutationWithVoid(opts: {
  destroyRef: DestroyRef;
  mutation$: Observable<unknown>;
  setLoading: (v: boolean) => void;
  setError: (msg: string | null) => void;
  onSuccess: () => void;
  onError?: (message: string) => void;
}): void {
  opts.setLoading(true);
  opts.setError(null);
  opts.mutation$
    .pipe(finalize(() => opts.setLoading(false)), takeUntilDestroyed(opts.destroyRef))
    .subscribe({
      next: () => opts.onSuccess(),
      error: (err: unknown) => {
        const message = extractApiErrorMessage(err);
        opts.setError(message);
        opts.onError?.(message);
      },
    });
}

/** Same message as the global HTTP error interceptor (API `message` when present). */
export function extractApiErrorMessage(err: unknown): string {
  return normalizeAppError(err).message;
}





