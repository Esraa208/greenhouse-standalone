import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { TranslationService } from '@app/core';
import { CustomersFacade } from '@app/core/data-access/sales';
import { CustomerRow, CUSTOMER_SORT_OPTIONS } from '@app/core/data-access/sales';
import { SALES_CUSTOMERS_PAGE_IMPORTS } from '@app/shared/page-imports';
import { syncCrudModalForm, trackByEntityId } from '@app/shared/utils/sync-crud-modal-form';

@Component({
  selector: 'gh-customers-page',
  standalone: true,
  imports: [...SALES_CUSTOMERS_PAGE_IMPORTS],
  templateUrl: './customers-page.component.html',
  styleUrl: './customers-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomersPageComponent {
  readonly facade = inject(CustomersFacade);
  readonly i18n   = inject(TranslationService);
  readonly #fb    = inject(FormBuilder);

  readonly sortOptions = computed(() =>
    CUSTOMER_SORT_OPTIONS.map(opt => ({
      value: opt.value,
      label: this.i18n.t(opt.translationKey),
    }))
  );

  readonly trackById = trackByEntityId;

  readonly #emptyCustomer = { name: '', phone: '', email: '', address: '' };

  readonly customerForm = this.#fb.nonNullable.group({
    name:    ['', Validators.required],
    phone:   ['', Validators.required],
    email:   [''],
    address: [''],
  });

  constructor() {
    this.facade.loadAll();

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
        }),
      defaultValue: () => ({ ...this.#emptyCustomer }),
    });
  }

  submitCustomer(): void {
    if (this.customerForm.invalid) {
      this.customerForm.markAllAsTouched();
      return;
    }
    const dto = this.customerForm.getRawValue();
    if (this.facade.editingItem()) {
      this.facade.update(dto);
    } else {
      this.facade.create(dto);
    }
  }

  canDeleteCustomer(item: CustomerRow | null): boolean {
    return !!item && item.invoicesCount === 0;
  }
}






