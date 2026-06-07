import { Component, ChangeDetectionStrategy, ChangeDetectorRef, DestroyRef, inject, OnInit, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { TranslationService } from '@app/core';
import { CustomersFacade, CustomerRow, CUSTOMER_SORT_OPTIONS, type CustomerSortKey } from '@app/core/data-access/sales';
import { SALES_CUSTOMERS_PAGE_IMPORTS } from '@app/shared/page-imports';
import { PositiveIntInputDirective } from '@app/shared/directives/positive-int-input.directive';
import { syncCrudModalForm, trackByEntityId } from '@app/shared/utils/sync-crud-modal-form';

/** Egyptian mobile: 11 digits, starts with 01 (010/011/012/015). */
const EGYPTIAN_PHONE_PATTERN = /^01[0125]\d{8}$/;

/** Requires local@domain.tld (dot + at least 2 chars after). */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

@Component({
  selector: 'gh-customers-page',
  standalone: true,
  imports: [...SALES_CUSTOMERS_PAGE_IMPORTS, PositiveIntInputDirective],
  templateUrl: './customers-page.component.html',
  styleUrl: './customers-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomersPageComponent implements OnInit {
  readonly facade = inject(CustomersFacade);
  readonly i18n = inject(TranslationService);
  readonly #fb = inject(FormBuilder);
  readonly #cdr = inject(ChangeDetectorRef);
  readonly #destroyRef = inject(DestroyRef);

  readonly sortOptions = computed(() =>
    CUSTOMER_SORT_OPTIONS.map((opt) => ({
      value: opt.value,
      label: this.i18n.t(opt.translationKey),
    })),
  );

  readonly filterStatusOptions = computed(() => [
    { value: 'all', label: this.i18n.t('customers.filter_all_status') },
    { value: 'active', label: this.i18n.t('common.active') },
    { value: 'inactive', label: this.i18n.t('common.inactive') },
  ]);

  readonly statusOptions = computed(() => [
    { value: 'active', label: this.i18n.t('common.active') },
    { value: 'inactive', label: this.i18n.t('common.inactive') },
  ]);

  readonly trackById = trackByEntityId;

  readonly #emptyCustomer = {
    name: '',
    phone: '',
    email: '',
    address: '',
    status: 'active' as 'active' | 'inactive',
  };

  readonly customerForm = this.#fb.nonNullable.group({
    name: ['', Validators.required],
    phone: ['', [Validators.required, Validators.pattern(EGYPTIAN_PHONE_PATTERN)]],
    email: ['', [Validators.required, Validators.pattern(EMAIL_PATTERN)]],
    address: [''],
    status: ['active' as 'active' | 'inactive'],
  });

  constructor() {
    syncCrudModalForm({
      isModalOpen: () => this.facade.isModalOpen(),
      editingItem: () => this.facade.editingItem(),
      form: this.customerForm,
      patchFromItem: (editing: CustomerRow) =>
        this.customerForm.patchValue({
          name: editing.name,
          phone: editing.phone,
          email: editing.email ?? '',
          address: editing.address ?? '',
          status: editing.status,
        }),
      defaultValue: () => ({ ...this.#emptyCustomer }),
    });

    this.customerForm.statusChanges
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe(() => this.#cdr.markForCheck());

    this.customerForm.valueChanges
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe(() => this.#cdr.markForCheck());
  }

  ngOnInit(): void {
    this.facade.enterPage();
  }

  onSortFilterChange(val: string): void {
    const sortBy = val && val !== 'all' ? val : 'all';
    this.facade.patchFilters({ sortBy: sortBy as CustomerSortKey | 'all' });
  }

  statusLabel(item: CustomerRow): string {
    return item.status === 'active'
      ? this.i18n.t('common.active')
      : this.i18n.t('common.inactive');
  }

  phoneErrorMessage(): string {
    return this.#fieldError(this.customerForm.controls.phone, {
      required: 'customers.form_phone_error',
      pattern: 'customers.form_phone_invalid',
    });
  }

  emailErrorMessage(): string {
    return this.#fieldError(this.customerForm.controls.email, {
      required: 'customers.form_email_error',
      pattern: 'customers.form_email_invalid',
    });
  }

  #fieldError(
    control: AbstractControl,
    keys: Record<string, string>,
  ): string {
    if (!control.errors || (!control.touched && !control.dirty)) return '';
    for (const [errorKey, i18nKey] of Object.entries(keys)) {
      if (control.errors[errorKey]) return this.i18n.t(i18nKey);
    }
    return '';
  }

  setStatus(val: string): void {
    this.customerForm.patchValue({ status: val as 'active' | 'inactive' });
  }

  submitCustomer(): void {
    if (this.customerForm.invalid) {
      this.customerForm.markAllAsTouched();
      this.#cdr.markForCheck();
      return;
    }
    const val = this.customerForm.getRawValue();
    const editing = this.facade.editingItem();
    if (editing) {
      this.facade.update({
        id: editing.id,
        name: val.name,
        phone: val.phone,
        email: val.email,
        address: val.address,
        status: val.status,
      });
    } else {
      this.facade.create({
        name: val.name,
        phone: val.phone,
        email: val.email,
        address: val.address,
      });
    }
  }

  canDeleteCustomer(item: CustomerRow | null): boolean {
    return !!item && item.invoicesCount === 0;
  }

  statusVariant(status: string): string {
    return status === 'active' ? 'active' : 'inactive';
  }
}
