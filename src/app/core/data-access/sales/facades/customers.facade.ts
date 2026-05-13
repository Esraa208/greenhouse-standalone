import { computed, inject, Injectable, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CustomersRepository } from '../repositories/customers.repository';
import {
  CustomerRow,
  CustomerFilters,
  CreateCustomerDto,
  DEFAULT_CUSTOMER_FILTERS,
} from '../models/customer.model';

@Injectable({ providedIn: 'root' })
export class CustomersFacade {
  readonly #repo       = inject(CustomersRepository);
  readonly #destroyRef = inject(DestroyRef);

  readonly #items             = signal<CustomerRow[]>([]);
  readonly #filters           = signal<CustomerFilters>(DEFAULT_CUSTOMER_FILTERS);
  readonly #editingItem       = signal<CustomerRow | null>(null);
  readonly #deletingItem      = signal<CustomerRow | null>(null);
  readonly #isModalOpen       = signal(false);
  readonly #isDeleteModalOpen = signal(false);
  readonly #isLoading         = signal(false);
  readonly #error             = signal<string | null>(null);

  readonly items              = this.#items.asReadonly();
  readonly filters            = this.#filters.asReadonly();
  readonly editingItem        = this.#editingItem.asReadonly();
  readonly deletingItem       = this.#deletingItem.asReadonly();
  readonly isModalOpen        = this.#isModalOpen.asReadonly();
  readonly isDeleteModalOpen  = this.#isDeleteModalOpen.asReadonly();
  readonly isLoading          = this.#isLoading.asReadonly();
  readonly error              = this.#error.asReadonly();

  readonly filteredItems = computed<CustomerRow[]>(() => {
    const { searchQuery, sortBy } = this.#filters();
    let result = this.#items();

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.email?.toLowerCase().includes(q) ?? false)
      );
    }

    return [...result].sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'date-asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'name-asc':
          return a.name.localeCompare(b.name, 'ar');
        case 'name-desc':
          return b.name.localeCompare(a.name, 'ar');
        case 'purchases-desc':
          return b.totalPurchases - a.totalPurchases;
        default:
          return 0;
      }
    });
  });

  readonly totalCount       = computed(() => this.#items().length);
  readonly filteredCount    = computed(() => this.filteredItems().length);
  readonly hasActiveFilters = computed(() => this.#filters().searchQuery !== '');

  loadAll(): void {
    this.#isLoading.set(true);
    this.#repo.getAll()
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (items: CustomerRow[]) => {
          this.#items.set(items);
          this.#isLoading.set(false);
        },
        error: (err: Error) => {
          this.#error.set(err.message);
          this.#isLoading.set(false);
        },
      });
  }

  create(dto: CreateCustomerDto): void {
    const optimistic: CustomerRow = {
      id: 'temp-' + Date.now(),
      ...dto,
      invoicesCount: 0,
      totalPurchases: 0,
      createdAt: new Date().toISOString(),
    };
    this.#items.update(list => [optimistic, ...list]);
    this.closeModal();

    this.#repo.create(dto)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (real: CustomerRow) => {
          this.#items.update(list => list.map(i => i.id === optimistic.id ? real : i));
        },
        error: () => {
          this.#items.update(list => list.filter(i => i.id !== optimistic.id));
        },
      });
  }

  update(dto: CreateCustomerDto): void {
    const editing = this.#editingItem();
    if (!editing) return;
    const oldItem = editing;

    const optimistic: CustomerRow = { ...oldItem, ...dto };
    this.#items.update(list => list.map(i => i.id === oldItem.id ? optimistic : i));
    this.closeModal();

    this.#repo.update(oldItem.id, dto)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (real: CustomerRow) => {
          this.#items.update(list => list.map(i => i.id === oldItem.id ? real : i));
        },
        error: () => {
          this.#items.update(list => list.map(i => i.id === oldItem.id ? oldItem : i));
        },
      });
  }

  confirmDelete(): void {
    const item = this.#deletingItem();
    if (!item) return;

    this.#items.update(list => list.filter(i => i.id !== item.id));
    this.closeDeleteModal();

    this.#repo.delete(item.id)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: () => { /* success */ },
        error: () => {
          this.#items.update(list => [...list, item]);
        },
      });
  }

  patchFilters(patch: Partial<CustomerFilters>): void {
    this.#filters.update(curr => ({ ...curr, ...patch }));
  }

  resetFilters(): void {
    this.#filters.set(DEFAULT_CUSTOMER_FILTERS);
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





