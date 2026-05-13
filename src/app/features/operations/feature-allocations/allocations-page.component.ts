/* libs/operations/feature-allocations/src/lib/allocations-page.component.ts */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
} from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BreakpointService, TranslationService } from '@app/core';
import { GhCrudPageShellComponent, GhEntityListSectionComponent } from '@app/shared/components';
import { CRUD_LIST_PAGE_IMPORTS_STANDARD } from '@app/shared/page-imports';
import {
  AllocationsFacade,
  ALLOCATION_SORT_OPTIONS,
  AllocationSortKey,
  AllocationStatus,
} from '@app/core/data-access/operations';
import {
  type MovementAction,
  type MovementRecord,
  type LossRecord,
  type LossTypeRef,
} from '@app/core/data-access/operations';

@Component({
  selector: 'gh-allocations-page',
  standalone: true,
  imports: [
    DecimalPipe,
    DatePipe,
    GhCrudPageShellComponent,
    GhEntityListSectionComponent,
    ...CRUD_LIST_PAGE_IMPORTS_STANDARD,
  ],
  templateUrl: './allocations-page.component.html',
  styleUrl: './allocations-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AllocationsPageComponent {
  protected readonly facade = inject(AllocationsFacade);
  protected readonly i18n = inject(TranslationService);
  protected readonly breakpoint = inject(BreakpointService);
  readonly #fb = inject(FormBuilder);

  protected readonly sortOptions = computed(() =>
    ALLOCATION_SORT_OPTIONS.map(opt => ({
      value: opt.value,
      label: this.i18n.t(opt.translationKey),
    }))
  );

  // Loss form for the single-allocation loss modal
  readonly lossForm = this.#fb.nonNullable.group({
    lossType: ['', Validators.required],
    date: [new Date().toISOString().split('T')[0], Validators.required],
    quantity: [null as number | null, [Validators.required, Validators.min(1)]],
    reason: ['', Validators.required],
    notes: [''],
  });

  constructor() {
    this.facade.loadAll();
    effect(() => {
      if (!this.facade.isLossModalOpen()) {
        this.lossForm.reset({
          date: new Date().toISOString().split('T')[0],
        });
      }
    });
  }

  protected readonly trackById = (_: number, item: { id: string }): string => item.id;
  protected readonly trackByDate = (_: number, item: MovementRecord): string => item.date;
  protected readonly trackByLossId = (_: number, item: LossRecord): string => item.id;
  protected readonly trackByString = (_: number, item: string): string => item;

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

  /** Color variant for movement action badge */
  protected movementVariant(action: MovementAction): string {
    if (action === 'allocated') return 'info';
    if (action === 'moved') return 'warning';
    return 'active';
  }

  /** Translates movement action to label */
  protected movementLabel(action: MovementAction): string {
    const map: Record<MovementAction, string> = {
      allocated: 'allocations.action_allocated',
      moved: 'allocations.action_moved',
      harvested: 'allocations.action_harvested',
    };
    return this.i18n.t(map[action]);
  }

  /** Type-safe status filter update */
  protected updateStatusFilter(status: string): void {
    this.facade.patchFilters({ status: status as AllocationStatus | 'all' });
  }

  /** Type-safe sort filter update */
  protected updateSortFilter(sort: string): void {
    this.facade.patchFilters({ sortBy: sort as AllocationSortKey });
  }

  /** Compute total loss quantity for loss history modal */
  protected totalLossQty(losses: readonly LossRecord[]): number {
    return losses.reduce((s, l) => s + l.quantity, 0);
  }

  /** Extract value from select change event (eliminates $any) */
  protected selectValue(event: Event): string {
    return (event.target as HTMLSelectElement).value;
  }

  /** Extract numeric value from input event (eliminates $any) */
  protected inputNumber(event: Event): number {
    return +(event.target as HTMLInputElement).value;
  }

}






