import { computed, inject, Injectable, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { InvoicesRepository } from '../repositories/invoices.repository';
import {
  InvoiceRow,
  InvoiceFilters,
  InvoiceStatus,
  DEFAULT_INVOICE_FILTERS,
} from '../models/invoice.model';

@Injectable({ providedIn: 'root' })
export class InvoicesFacade {
  readonly #repo       = inject(InvoicesRepository);
  readonly #destroyRef = inject(DestroyRef);

  readonly #items              = signal<InvoiceRow[]>([]);
  readonly #filters            = signal<InvoiceFilters>(DEFAULT_INVOICE_FILTERS);
  readonly #previewingInvoice  = signal<InvoiceRow | null>(null);
  readonly #isPreviewOpen      = signal(false);
  readonly #isLoading          = signal(false);
  readonly #error              = signal<string | null>(null);

  readonly items              = this.#items.asReadonly();
  readonly filters            = this.#filters.asReadonly();
  readonly previewingInvoice  = this.#previewingInvoice.asReadonly();
  readonly isPreviewOpen      = this.#isPreviewOpen.asReadonly();
  readonly isLoading          = this.#isLoading.asReadonly();
  readonly error              = this.#error.asReadonly();

  readonly filteredItems = computed<InvoiceRow[]>(() => {
    const { searchQuery, status, customerId, dateFrom, dateTo, sortBy } = this.#filters();
    let result = this.#items();

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i =>
        i.invoiceNumber.toLowerCase().includes(q) ||
        i.customerName.toLowerCase().includes(q) ||
        i.customerPhone.includes(q)
      );
    }

    if (status !== 'all') {
      result = result.filter(i => i.status === status);
    }

    if (customerId) {
      result = result.filter(i => i.customerId === customerId);
    }

    if (dateFrom) {
      const from = new Date(dateFrom).getTime();
      result = result.filter(i => new Date(i.invoiceDate).getTime() >= from);
    }

    if (dateTo) {
      const to = new Date(dateTo).getTime();
      result = result.filter(i => new Date(i.invoiceDate).getTime() <= to);
    }

    return [...result].sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime();
        case 'date-asc':
          return new Date(a.invoiceDate).getTime() - new Date(b.invoiceDate).getTime();
        case 'amount-desc':
          return b.total - a.total;
        default:
          return 0;
      }
    });
  });

  readonly uniqueCustomers = computed(() =>
    [...new Map(
      this.#items().map(i =>
        [i.customerId, { id: i.customerId, name: i.customerName }]
      )
    ).values()]
  );

  readonly hasActiveFilters = computed(() =>
    this.#filters().searchQuery !== '' ||
    this.#filters().status !== 'all' ||
    this.#filters().customerId !== '' ||
    this.#filters().dateFrom !== '' ||
    this.#filters().dateTo !== ''
  );

  readonly totalFilteredAmount = computed(() =>
    this.filteredItems().reduce((s, i) => s + i.total, 0)
  );

  loadAll(): void {
    this.#isLoading.set(true);
    this.#repo.getAll()
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (items: InvoiceRow[]) => {
          this.#items.set(items);
          this.#isLoading.set(false);
          // Auto-overdue check
          this.#items.update(list => list.map(inv => {
            if (inv.status === 'pending' &&
                new Date(inv.collectionDate) < new Date()) {
              return { ...inv, status: 'overdue' as const };
            }
            return inv;
          }));
        },
        error: (err: Error) => {
          this.#error.set(err.message);
          this.#isLoading.set(false);
        },
      });
  }

  markAsPaid(invoice: InvoiceRow): void {
    const oldItem = invoice;
    const optimistic: InvoiceRow = {
      ...oldItem,
      status: 'paid' as InvoiceStatus,
      actualCollectionDate: new Date().toISOString(),
    };
    this.#items.update(list => list.map(i => i.id === oldItem.id ? optimistic : i));

    // Also update preview if open
    if (this.#previewingInvoice()?.id === oldItem.id) {
      this.#previewingInvoice.set(optimistic);
    }

    this.#repo.markAsPaid(oldItem.id)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (real: InvoiceRow) => {
          this.#items.update(list => list.map(i => i.id === oldItem.id ? real : i));
          if (this.#previewingInvoice()?.id === oldItem.id) {
            this.#previewingInvoice.set(real);
          }
        },
        error: () => {
          this.#items.update(list => list.map(i => i.id === oldItem.id ? oldItem : i));
          if (this.#previewingInvoice()?.id === oldItem.id) {
            this.#previewingInvoice.set(oldItem);
          }
        },
      });
  }

  openPreview(invoice: InvoiceRow): void {
    this.#previewingInvoice.set(invoice);
    this.#isPreviewOpen.set(true);
  }

  closePreview(): void {
    this.#isPreviewOpen.set(false);
    this.#previewingInvoice.set(null);
  }

  patchFilters(patch: Partial<InvoiceFilters>): void {
    this.#filters.update(f => ({ ...f, ...patch }));
  }

  resetFilters(): void {
    this.#filters.set(DEFAULT_INVOICE_FILTERS);
  }
}





