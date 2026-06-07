import { computed, inject, Injectable, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';
import { CustomersRepository } from '../repositories/customers.repository';
import {
  CustomerRow,
  CustomerFilters,
  CreateCustomerDto,
  UpdateCustomerDto,
  DEFAULT_CUSTOMER_FILTERS,
  mapCustomerSetOrder,
} from '../models/customer.model';
import { DEFAULT_PAGE_SIZE } from '@app/core/data-access/infrastructure/list-query';
import {
  bindListReloadStream,
  applyListFilterPatch,
  applyListPaginationFromResult,
  changeListPageSize,
  subscribeMutationWithResult,
  subscribeMutationWithVoid,
} from '@app/core/data-access/infrastructure/entity-list-facade.helpers';
import { mergeAfterPut } from '@app/core/data-access/infrastructure/put-patch-merge';

@Injectable({ providedIn: 'root' })
export class CustomersFacade {
  readonly #repo = inject(CustomersRepository);
  readonly #destroyRef = inject(DestroyRef);

  readonly #items = signal<CustomerRow[]>([]);
  readonly #filters = signal<CustomerFilters>(DEFAULT_CUSTOMER_FILTERS);
  readonly #editingItem = signal<CustomerRow | null>(null);
  readonly #deletingItem = signal<CustomerRow | null>(null);
  readonly #isModalOpen = signal(false);
  readonly #isDeleteModalOpen = signal(false);
  readonly #isLoading = signal(false);
  readonly #error = signal<string | null>(null);
  readonly #pageNumber = signal(1);
  readonly #totalCount = signal(0);
  readonly #totalPages = signal(1);
  readonly #pageSize = signal(DEFAULT_PAGE_SIZE);

  readonly #reloadNow$ = new Subject<void>();
  readonly #reloadSearch$ = new Subject<void>();

  readonly items = this.#items.asReadonly();
  readonly filters = this.#filters.asReadonly();
  readonly editingItem = this.#editingItem.asReadonly();
  readonly deletingItem = this.#deletingItem.asReadonly();
  readonly isModalOpen = this.#isModalOpen.asReadonly();
  readonly isDeleteModalOpen = this.#isDeleteModalOpen.asReadonly();
  readonly isLoading = this.#isLoading.asReadonly();
  readonly error = this.#error.asReadonly();
  readonly currentPage = this.#pageNumber.asReadonly();
  readonly totalCount = this.#totalCount.asReadonly();
  readonly totalPages = this.#totalPages.asReadonly();
  readonly pageSize = this.#pageSize.asReadonly();

  readonly filteredItems = computed<CustomerRow[]>(() => this.#items());

  readonly filteredCount = computed(() => this.filteredItems().length);
  readonly hasActiveFilters = computed(
    () => this.#filters().searchQuery !== '' || this.#filters().status !== 'all'
  );

  constructor() {
    bindListReloadStream({
      destroyRef: this.#destroyRef,
      reloadNow$: this.#reloadNow$,
      reloadSearch$: this.#reloadSearch$,
      load: () => this.#repo.getAll(this.#listQuery()),
      setItems: (items) => this.#items.set(items),
      setLoading: (v) => this.#isLoading.set(v),
      setError: (msg) => this.#error.set(msg),
      setPagination: (p) => applyListPaginationFromResult(p, this.#totalCount, this.#totalPages),
    });
  }

  #listQuery() {
    const f = this.#filters();
    return {
      pageNumber: this.#pageNumber(),
      pageSize: this.#pageSize(),
      search: f.searchQuery,
      status: f.status,
      setOrder: mapCustomerSetOrder(f.sortBy),
    };
  }

  enterPage(): void {
    this.#filters.set(DEFAULT_CUSTOMER_FILTERS);
    this.#pageNumber.set(1);
    this.#reloadNow$.next();
  }

  loadAll(): void {
    this.#reloadNow$.next();
  }

  goToPage(page: number): void {
    this.#pageNumber.set(page);
    this.#reloadNow$.next();
  }

  setPageSize(size: number): void {
    changeListPageSize(size, this.#pageNumber, this.#pageSize, this.#reloadNow$);
  }

  create(dto: CreateCustomerDto): void {
    this.closeModal();
    subscribeMutationWithResult({
      destroyRef: this.#destroyRef,
      mutation$: this.#repo.create(dto),
      setLoading: (v) => this.#isLoading.set(v),
      setError: (msg) => this.#error.set(msg),
      onSuccess: (row) => {
        this.#items.update((items) => [...items, row]);
        this.#totalCount.update((c) => c + 1);
        this.#reloadNow$.next();
      },
    });
  }

  update(dto: UpdateCustomerDto): void {
    const previous = this.#items().find((i) => i.id === dto.id) ?? this.#editingItem() ?? undefined;
    this.closeModal();
    subscribeMutationWithResult({
      destroyRef: this.#destroyRef,
      mutation$: this.#repo.update(dto.id, dto),
      setLoading: (v) => this.#isLoading.set(v),
      setError: (msg) => this.#error.set(msg),
      onSuccess: (patch) => {
        const row = mergeAfterPut(previous, patch);
        this.#items.update((items) => items.map((i) => (i.id === row.id ? row : i)));
      },
    });
  }

  confirmDelete(): void {
    const item = this.#deletingItem();
    if (!item) return;
    this.closeDeleteModal();
    subscribeMutationWithVoid({
      destroyRef: this.#destroyRef,
      mutation$: this.#repo.delete(item.id),
      setLoading: (v) => this.#isLoading.set(v),
      setError: (msg) => this.#error.set(msg),
      onSuccess: () => {
        this.#items.update((items) => items.filter((i) => i.id !== item.id));
        this.#totalCount.update((c) => Math.max(0, c - 1));
      },
    });
  }

  patchFilters(patch: Partial<CustomerFilters>): void {
    applyListFilterPatch(patch, this.#filters, this.#pageNumber, this.#reloadNow$, this.#reloadSearch$);
  }

  resetFilters(): void {
    this.#filters.set(DEFAULT_CUSTOMER_FILTERS);
    this.#pageNumber.set(1);
    this.#reloadNow$.next();
  }

  openCreateModal(): void {
    this.#editingItem.set(null);
    this.#isModalOpen.set(true);
  }

  openEditModal(item: CustomerRow): void {
    this.#editingItem.set(item);
    this.#isModalOpen.set(true);
  }

  closeModal(): void {
    this.#isModalOpen.set(false);
    this.#editingItem.set(null);
  }

  openDeleteModal(item: CustomerRow): void {
    this.#deletingItem.set(item);
    this.#isDeleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    this.#isDeleteModalOpen.set(false);
    this.#deletingItem.set(null);
  }
}
