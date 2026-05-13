import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { TranslationService } from '@app/core';
import { InvoicesFacade } from '@app/core/data-access/sales';
import { InvoiceRow, InvoiceStatus } from '@app/core/data-access/sales';
import { SALES_INVOICES_PAGE_IMPORTS } from '@app/shared/page-imports';

@Component({
  selector: 'gh-invoices-page',
  standalone: true,
  imports: [...SALES_INVOICES_PAGE_IMPORTS],
  templateUrl: './invoices-page.component.html',
  styleUrl: './invoices-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoicesPageComponent {
  readonly facade = inject(InvoicesFacade);
  readonly i18n   = inject(TranslationService);

  readonly trackById = (_: number, item: InvoiceRow): string => item.id;
  readonly trackByItemId = (_: number, item: { id: string }): string => item.id;

  readonly sortOptions = computed(() => [
    { value: 'date-desc', label: this.i18n.t('sort.date_newest') },
    { value: 'date-asc',  label: this.i18n.t('sort.date_oldest') },
    { value: 'amount-desc', label: this.i18n.t('sort.amount_desc') },
  ]);

  constructor() {
    this.facade.loadAll();
  }

  printInvoice(): void {
    window.print();
  }

  isOverdueDate(dateStr: string): boolean {
    return new Date(dateStr) < new Date();
  }

  statusVariant(status: InvoiceStatus): string {
    switch (status) {
      case 'paid':    return 'active';
      case 'pending': return 'warning';
      case 'overdue': return 'empty';
      default:        return 'inactive';
    }
  }

  statusKey(status: InvoiceStatus): string {
    switch (status) {
      case 'paid':    return 'invoices.status_paid';
      case 'pending': return 'invoices.status_pending';
      case 'overdue': return 'invoices.status_overdue';
      default:        return '';
    }
  }
}






