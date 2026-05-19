/* libs/operations/feature-allocations/src/lib/allocations-page.component.ts */

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnInit,
} from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BreakpointService, TranslationService } from '@app/core';
import { CRUD_LIST_PAGE_IMPORTS_STANDARD } from '@app/shared/page-imports';
import { StockHistoryPanelComponent } from '@app/shared/components/stock-history-panel/stock-history-panel.component';
import { TransferAllocationPanelComponent } from '@app/shared/components/transfer-allocation-panel/transfer-allocation-panel.component';
import {
  AllocationsFacade,
  ALLOCATION_SORT_OPTIONS,
  AllocationSortKey,
  AllocationStatus,
} from '@app/core/data-access/operations';
import { type LossRecord, type LossTypeRef } from '@app/core/data-access/operations';

@Component({
  selector: 'gh-allocations-page',
  standalone: true,
  imports: [
    DecimalPipe,
    DatePipe,
    StockHistoryPanelComponent,
    TransferAllocationPanelComponent,
    ...CRUD_LIST_PAGE_IMPORTS_STANDARD,
  ],
  templateUrl: './allocations-page.component.html',
  styleUrl: './allocations-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AllocationsPageComponent implements OnInit {
  protected readonly facade = inject(AllocationsFacade);
  protected readonly i18n = inject(TranslationService);
  protected readonly breakpoint = inject(BreakpointService);
  readonly #fb = inject(FormBuilder);

  protected readonly sortOptions = computed(() =>
    ALLOCATION_SORT_OPTIONS.map((opt) => ({
      value: opt.value,
      label: this.i18n.t(opt.translationKey),
    })),
  );

  protected readonly allocationStatusOptions = computed(() => [
    { value: 'all', label: this.i18n.t('filter.status_all') },
    { value: 'active', label: this.i18n.t('allocations.status_active') },
    { value: 'moved', label: this.i18n.t('allocations.status_moved') },
    { value: 'harvested', label: this.i18n.t('allocations.status_harvested') },
  ]);

  readonly lossForm = this.#fb.nonNullable.group({
    lossType: ['', Validators.required],
    date: [new Date().toISOString().split('T')[0], Validators.required],
    quantity: [null as number | null, [Validators.required, Validators.min(1)]],
    reason: ['', Validators.required],
    notes: [''],
  });

  ngOnInit(): void {
    this.facade.enterPage();
  }

  constructor() {
    effect(() => {
      if (!this.facade.isLossModalOpen()) {
        this.lossForm.reset({
          date: new Date().toISOString().split('T')[0],
        });
      }
    });
  }

  protected readonly trackById = (_: number, item: { id: string }): string => item.id;

  protected submitLoss(): void {
    if (this.lossForm.invalid) return;
    const v = this.lossForm.getRawValue();
    this.facade.confirmRecordLoss({
      allocationId: this.facade.lossingItem()!.id,
      lossType: v.lossType as LossTypeRef,
      date: v.date,
      quantity: v.quantity!,
      reason: v.reason,
      notes: v.notes || undefined,
    });
  }

  protected updateStatusFilter(status: string): void {
    this.facade.patchFilters({ status: status as AllocationStatus | 'all' });
  }

  protected updateSortFilter(sort: string): void {
    this.facade.patchFilters({ sortBy: (sort || 'date-desc') as AllocationSortKey });
  }

  protected totalLossQty(losses: readonly LossRecord[]): number {
    return losses.reduce((s, l) => s + l.quantity, 0);
  }

  protected selectValue(event: Event): string {
    return (event.target as HTMLSelectElement).value;
  }

  protected inputNumber(event: Event): number {
    return +(event.target as HTMLInputElement).value;
  }
}
