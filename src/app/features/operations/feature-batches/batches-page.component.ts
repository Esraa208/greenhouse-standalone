/* libs/operations/feature-batches/src/lib/batches-page.component.ts */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { BreakpointService, TranslationService } from '@app/core';
import { GhCrudPageShellComponent, GhEntityListSectionComponent } from '@app/shared/components';
import { CRUD_LIST_PAGE_IMPORTS_TABLE_VIEW_MODAL } from '@app/shared/page-imports';
import {
  BatchesFacade,
  BATCH_SORT_OPTIONS,
  BatchRow,
  BatchSortKey,
  BatchStatus,
} from '@app/core/data-access/operations';

@Component({
  selector: 'gh-batches-page',
  standalone: true,
  imports: [
    DecimalPipe,
    DatePipe,
    GhCrudPageShellComponent,
    GhEntityListSectionComponent,
    ...CRUD_LIST_PAGE_IMPORTS_TABLE_VIEW_MODAL,
  ],
  templateUrl: './batches-page.component.html',
  styleUrl: './batches-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BatchesPageComponent {
  protected readonly facade = inject(BatchesFacade);
  protected readonly i18n = inject(TranslationService);
  protected readonly breakpoint = inject(BreakpointService);

  protected readonly sortOptions = computed(() =>
    BATCH_SORT_OPTIONS.map(opt => ({
      value: opt.value,
      label: this.i18n.t(opt.translationKey),
    }))
  );

  protected readonly statusOptions = computed(() => [
    { value: 'all',       label: this.i18n.t('batches.filter_all_status') },
    { value: 'active',    label: this.i18n.t('batches.status_active') },
    { value: 'harvested', label: this.i18n.t('batches.status_harvested') },
    { value: 'lost',      label: this.i18n.t('batches.status_lost') },
  ]);

  protected readonly cropTypeOptions = computed(() => [
    { value: '', label: this.i18n.t('batches.filter_all_crops') },
    ...this.facade.cropTypes().map(type => ({ value: type, label: type })),
  ]);

  constructor() {
    this.facade.loadAll();
  }

  protected updateStatusFilter(status: string): void {
    this.facade.patchFilters({ status: status as BatchStatus | 'all' });
  }

  protected updateSortFilter(sort: string): void {
    this.facade.patchFilters({ sortBy: sort as BatchSortKey });
  }

  protected updateCropTypeFilter(cropType: string): void {
    this.facade.patchFilters({ cropType });
  }

  protected navigateToPlanting(): void {
    this.facade.navigateToPlanting();
  }

  protected readonly trackById = (_: number, item: { id: string }): string => item.id;

  protected statusVariant(row: BatchRow): string {
    switch (row.status) {
      case 'active':    return 'active';
      case 'harvested': return 'inactive';
      case 'lost':      return 'empty';
      default:          return 'default';
    }
  }

  protected growthStageLabel(row: BatchRow): string {
    return this.i18n.t(this.facade.growthStageKey(row));
  }

  protected progressVariant(row: BatchRow): string {
    return this.facade.progressVariant(row);
  }
}






