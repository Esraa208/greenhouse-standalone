import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';
import { InvoicesRepository } from '../repositories/invoices.repository';
import { CustomersRepository } from '../repositories/customers.repository';
import {
  InvoiceRow,
  InvoiceFilters,
  DEFAULT_INVOICE_FILTERS,
  mapInvoiceSetOrder,
  buildInvoiceFetchExtraParams,
} from '../models/invoice.model';
import { isoToDateInputValue, todayDateInputValue } from '../utils/invoice-date.util';
import { CropsRepository } from '@app/core/data-access/operations/repositories/crops.repository';
import { BatchesRepository } from '@app/core/data-access/operations/repositories/batches.repository';
import { DEFAULT_PAGE_SIZE, PagedListQuery } from '@app/core/data-access/infrastructure/list-query';
import {
  bindListReloadStream,
  applyListFilterPatch,
  applyListPaginationFromResult,
  changeListPageSize,
} from '@app/core/data-access/infrastructure/entity-list-facade.helpers';
import { GhToastService, TranslationService } from '@app/core';

export interface CustomerFilterOption {
  readonly id: string;
  readonly name: string;
}

export interface CropTypeFilterOption {
  readonly id: string;
  readonly name: string;
}

export interface StockBatchFilterOption {
  readonly id: string;
  readonly label: string;
}

@Injectable({ providedIn: 'root' })
export class InvoicesFacade {
  readonly #repo = inject(InvoicesRepository);
  readonly #customersRepo = inject(CustomersRepository);
  readonly #cropsRepo = inject(CropsRepository);
  readonly #batchesRepo = inject(BatchesRepository);
  readonly #destroyRef = inject(DestroyRef);
  readonly #toast = inject(GhToastService);
  readonly #i18n = inject(TranslationService);

  readonly #items = signal<InvoiceRow[]>([]);
  readonly #filters = signal<InvoiceFilters>(DEFAULT_INVOICE_FILTERS);
  readonly #previewingInvoice = signal<InvoiceRow | null>(null);
  readonly #isPreviewOpen = signal(false);
  readonly #isLoading = signal(false);
  readonly #error = signal<string | null>(null);
  readonly #pageNumber = signal(1);
  readonly #totalCount = signal(0);
  readonly #totalPages = signal(1);
  readonly #pageSize = signal(DEFAULT_PAGE_SIZE);
  readonly #filterCustomers = signal<CustomerFilterOption[]>([]);
  readonly #filterCropTypes = signal<CropTypeFilterOption[]>([]);
  readonly #filterStockBatches = signal<StockBatchFilterOption[]>([]);
  readonly #markingPaidId = signal<string | null>(null);
  readonly #filterOptionsLoaded = signal(false);
  readonly #payModalInvoice = signal<InvoiceRow | null>(null);
  readonly #payDateInput = signal('');
  readonly #dueDateModalInvoice = signal<InvoiceRow | null>(null);
  readonly #dueDateInput = signal('');
  readonly #clearDueDate = signal(false);
  readonly #isPaySubmitting = signal(false);
  readonly #isDueDateSubmitting = signal(false);

  readonly #reloadNow$ = new Subject<void>();
  readonly #reloadSearch$ = new Subject<void>();

  readonly filters = this.#filters.asReadonly();
  readonly previewingInvoice = this.#previewingInvoice.asReadonly();
  readonly isPreviewOpen = this.#isPreviewOpen.asReadonly();
  readonly isLoading = this.#isLoading.asReadonly();
  readonly error = this.#error.asReadonly();
  readonly currentPage = this.#pageNumber.asReadonly();
  readonly totalCount = this.#totalCount.asReadonly();
  readonly totalPages = this.#totalPages.asReadonly();
  readonly pageSize = this.#pageSize.asReadonly();
  readonly filterCustomers = this.#filterCustomers.asReadonly();
  readonly filterCropTypes = this.#filterCropTypes.asReadonly();
  readonly filterStockBatches = this.#filterStockBatches.asReadonly();
  readonly markingPaidId = this.#markingPaidId.asReadonly();
  readonly payModalInvoice = this.#payModalInvoice.asReadonly();
  readonly payDateInput = this.#payDateInput.asReadonly();
  readonly dueDateModalInvoice = this.#dueDateModalInvoice.asReadonly();
  readonly dueDateInput = this.#dueDateInput.asReadonly();
  readonly clearDueDate = this.#clearDueDate.asReadonly();
  readonly isPaySubmitting = this.#isPaySubmitting.asReadonly();
  readonly isDueDateSubmitting = this.#isDueDateSubmitting.asReadonly();

  readonly filteredItems = computed<InvoiceRow[]>(() => this.#items());

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

  #listQuery(): PagedListQuery {
    const f = this.#filters();
    return {
      pageNumber: this.#pageNumber(),
      pageSize: this.#pageSize(),
      search: f.searchQuery,
      setOrder: mapInvoiceSetOrder(f.sortBy),
      extra: buildInvoiceFetchExtraParams(f),
    };
  }

  enterPage(): void {
    this.#filters.set(DEFAULT_INVOICE_FILTERS);
    this.#pageNumber.set(1);
    this.#pageSize.set(DEFAULT_PAGE_SIZE);
    this.#loadFilterOptions();
    this.#reloadNow$.next();
  }

  goToPage(page: number): void {
    this.#pageNumber.set(page);
    this.#reloadNow$.next();
  }

  refreshList(): void {
    this.#reloadNow$.next();
  }

  setPageSize(size: number): void {
    changeListPageSize(size, this.#pageNumber, this.#pageSize, this.#reloadNow$);
  }

  openPayModal(invoice: InvoiceRow): void {
    if (invoice.isPaid) return;
    this.#payModalInvoice.set(invoice);
    this.#payDateInput.set(todayDateInputValue());
  }

  closePayModal(): void {
    this.#payModalInvoice.set(null);
    this.#payDateInput.set('');
    this.#isPaySubmitting.set(false);
  }

  setPayDateInput(value: string): void {
    this.#payDateInput.set(value);
  }

  confirmPay(): void {
    const invoice = this.#payModalInvoice();
    const dateInput = this.#payDateInput().trim();
    if (!invoice || !dateInput || this.#isPaySubmitting()) return;

    this.#isPaySubmitting.set(true);
    this.#markingPaidId.set(invoice.id);

    this.#repo
      .markAsPaidFromDateInput(invoice.id, dateInput)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (updated) => {
          this.#patchInvoiceRow(updated);
          this.closePayModal();
          this.#markingPaidId.set(null);
          this.#toast.success(this.#i18n.t('invoices.toast_mark_paid'));
        },
        error: () => {
          this.#isPaySubmitting.set(false);
          this.#markingPaidId.set(null);
        },
      });
  }

  openDueDateModal(invoice: InvoiceRow): void {
    this.#dueDateModalInvoice.set(invoice);
    this.#dueDateInput.set(invoice.dueDate ? isoToDateInputValue(invoice.dueDate) : '');
    this.#clearDueDate.set(false);
  }

  closeDueDateModal(): void {
    this.#dueDateModalInvoice.set(null);
    this.#dueDateInput.set('');
    this.#clearDueDate.set(false);
    this.#isDueDateSubmitting.set(false);
  }

  setDueDateInput(value: string): void {
    this.#dueDateInput.set(value);
    if (value) this.#clearDueDate.set(false);
  }

  setClearDueDate(clear: boolean): void {
    this.#clearDueDate.set(clear);
  }

  confirmDueDate(): void {
    const invoice = this.#dueDateModalInvoice();
    if (!invoice || this.#isDueDateSubmitting()) return;

    const clear = this.#clearDueDate();
    const dateInput = this.#dueDateInput().trim();
    if (!clear && !dateInput) return;

    this.#isDueDateSubmitting.set(true);

    this.#repo
      .updateDueDateFromDateInput(invoice.id, clear ? null : dateInput)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (updated) => {
          this.#patchInvoiceRow(updated);
          this.closeDueDateModal();
          this.#toast.success(this.#i18n.t('invoices.toast_due_date_updated'));
        },
        error: () => this.#isDueDateSubmitting.set(false),
      });
  }

  #patchInvoiceRow(updated: InvoiceRow): void {
    this.#items.update((list) => list.map((i) => (i.id === updated.id ? updated : i)));
    if (this.#previewingInvoice()?.id === updated.id) {
      this.#previewingInvoice.set(updated);
    }
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
    applyListFilterPatch(
      patch,
      this.#filters,
      this.#pageNumber,
      this.#reloadNow$,
      this.#reloadSearch$,
    );
  }

  resetFilters(): void {
    this.#filters.set(DEFAULT_INVOICE_FILTERS);
    this.#pageNumber.set(1);
    this.#reloadNow$.next();
  }

  #loadFilterOptions(): void {
    if (this.#filterOptionsLoaded()) return;
    this.#filterOptionsLoaded.set(true);
    this.#customersRepo
      .fetchSelectPage(1)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (customers) =>
          this.#filterCustomers.set(
            customers.map((c) => ({ id: c.id, name: c.name })),
          ),
      });

    this.#cropsRepo
      .fetchActivePage(1)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (crops) =>
          this.#filterCropTypes.set(crops.map((c) => ({ id: c.id, name: c.name }))),
      });

    this.#batchesRepo
      .fetchSelectPage(1)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (batches) =>
          this.#filterStockBatches.set(
            batches.map((b) => ({
              id: b.id,
              label: `${b.batchNumber} — ${b.cropType || b.name}`,
            })),
          ),
      });
  }
}
