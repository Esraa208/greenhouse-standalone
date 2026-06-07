import { Component, ChangeDetectionStrategy, inject, computed, OnInit, HostListener } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { TranslationService } from '@app/core';
import {
  InvoicesFacade,
  InvoiceCreateFacade,
  InvoiceRow,
  InvoiceStatus,
  INVOICE_SORT_OPTIONS,
  type InvoiceSortKey,
} from '@app/core/data-access/sales';
import { InvoiceHarvestCreatePanelComponent } from '@app/shared/components';
import { SALES_INVOICES_PAGE_IMPORTS } from '@app/shared/page-imports';
import { PositiveDecimalInputDirective } from '@app/shared/directives';
import { INVOICE_PRINT_STYLES } from './invoice-print.styles';

@Component({
  selector: 'gh-invoices-page',
  standalone: true,
  imports: [
    DecimalPipe,
    PositiveDecimalInputDirective,
    InvoiceHarvestCreatePanelComponent,
    ...SALES_INVOICES_PAGE_IMPORTS,
  ],
  templateUrl: './invoices-page.component.html',
  styleUrl: './invoices-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoicesPageComponent implements OnInit {
  readonly facade = inject(InvoicesFacade);
  readonly createFacade = inject(InvoiceCreateFacade);
  readonly i18n = inject(TranslationService);

  #savedDocumentTitle = '';

  readonly trackById = (_: number, item: InvoiceRow): string => item.id;
  readonly trackByItemId = (_: number, item: { id: string }): string => item.id;

  readonly sortOptions = computed(() =>
    INVOICE_SORT_OPTIONS.map((opt) => ({
      value: opt.value,
      label: this.i18n.t(opt.translationKey),
    })),
  );

  readonly statusFilterOptions = computed(() => [
    { value: 'all', label: this.i18n.t('invoices.filter_all_status') },
    { value: 'paid', label: this.i18n.t('invoices.status_paid') },
    { value: 'pending', label: this.i18n.t('invoices.status_pending') },
  ]);

  readonly hasDueDateOptions = computed(() => [
    { value: 'all', label: this.i18n.t('invoices.filter_has_due_date_all') },
    { value: 'yes', label: this.i18n.t('invoices.filter_has_due_date_yes') },
    { value: 'no', label: this.i18n.t('invoices.filter_has_due_date_no') },
  ]);

  ngOnInit(): void {
    this.facade.enterPage();
  }

  updateSortFilter(sort: string): void {
    const sortBy = sort && sort !== 'all' ? sort : 'all';
    this.facade.patchFilters({ sortBy: sortBy as InvoiceSortKey | 'all' });
  }

  selectValue(event: Event): string {
    return (event.target as HTMLSelectElement).value;
  }

  printInvoice(): void {
    const card = document.querySelector('.invoices-page__a4-card');
    if (!card) return;

    const clone = card.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('.invoices-page__screen-only').forEach((el) => el.remove());
    const ts = clone.querySelector('.invoices-page__print-timestamp');
    if (ts) ts.textContent = this.printTimestamp();

    const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <title>&#8203;</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>${INVOICE_PRINT_STYLES}</style>
</head>
<body>${clone.outerHTML}</body>
</html>`;

    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.setAttribute('name', 'invoice-print-frame');
    Object.assign(iframe.style, {
      position: 'fixed',
      right: '0',
      bottom: '0',
      width: '0',
      height: '0',
      border: '0',
      visibility: 'hidden',
    });

    let printed = false;
    const cleanup = (): void => {
      iframe.remove();
    };

    const runPrint = (): void => {
      if (printed) return;
      const win = iframe.contentWindow;
      if (!win?.document.body?.childElementCount) return;

      const triggerPrint = (): void => {
        if (printed) return;
        printed = true;
        win.document.title = '\u200B';
        win.focus();
        win.print();
        win.addEventListener('afterprint', cleanup, { once: true });
        setTimeout(cleanup, 3000);
      };

      if (win.document.fonts?.ready) {
        win.document.fonts.ready.then(() => requestAnimationFrame(triggerPrint));
        return;
      }

      requestAnimationFrame(triggerPrint);
    };

    iframe.onload = () => requestAnimationFrame(runPrint);
    document.body.appendChild(iframe);
    iframe.srcdoc = html;
    setTimeout(() => requestAnimationFrame(runPrint), 600);
  }

  @HostListener('window:beforeprint')
  onBeforePrint(): void {
    if (!this.facade.isPreviewOpen()) return;
    this.#savedDocumentTitle = document.title;
    document.title = '\u200B';
  }

  @HostListener('window:afterprint')
  onAfterPrint(): void {
    if (this.#savedDocumentTitle) {
      document.title = this.#savedDocumentTitle;
      this.#savedDocumentTitle = '';
    }
  }

  statusLabel(status: InvoiceStatus): string {
    switch (status) {
      case 'paid':
        return this.i18n.t('invoices.status_paid');
      case 'overdue':
        return this.i18n.t('invoices.status_overdue');
      default:
        return this.i18n.t('invoices.status_pending');
    }
  }

  statusVariant(status: InvoiceStatus): string {
    switch (status) {
      case 'paid':
        return 'active';
      case 'overdue':
        return 'danger';
      default:
        return 'warning';
    }
  }

  sourcesSummary(inv: InvoiceRow): string {
    const names = inv.items.map((i) => i.cropName).filter(Boolean);
    if (names.length === 0) return '—';
    if (names.length <= 2) return names.join(' • ');
    return `${names.slice(0, 2).join(' • ')} +${names.length - 2}`;
  }

  printTimestamp(): string {
    return new Intl.DateTimeFormat(undefined, {
      month: 'numeric',
      day: 'numeric',
      year: '2-digit',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(new Date());
  }
}
