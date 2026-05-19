import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { BreakpointService, TranslationService } from '@app/core';
import { CRUD_LIST_PAGE_IMPORTS_STANDARD } from '@app/shared/page-imports';
import {
  BatchesFacade,
  BatchRow,
  BATCH_SORT_OPTIONS,
  UpdateBatchDto,
  CropsFacade,
} from '@app/core/data-access/operations';
import { resolveDisplayDays } from '@app/core/data-access/operations/repositories/batches.mapper';
import { syncCrudModalForm, trackByEntityId } from '@app/shared/utils/sync-crud-modal-form';
import { ProgressBarComponent } from '@app/shared/components/ui/progress-bar/progress-bar.component';

@Component({
  selector: 'gh-batches-page',
  standalone: true,
  imports: [DecimalPipe, DatePipe, ProgressBarComponent, ...CRUD_LIST_PAGE_IMPORTS_STANDARD],
  templateUrl: './batches-page.component.html',
  styleUrl: './batches-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BatchesPageComponent implements OnInit {
  protected readonly facade = inject(BatchesFacade);
  protected readonly i18n = inject(TranslationService);
  protected readonly breakpoint = inject(BreakpointService);
  protected readonly cropsFacade = inject(CropsFacade);
  protected readonly router = inject(Router);
  readonly #fb = inject(FormBuilder).nonNullable;

  protected readonly form = this.#fb.group({
    name: ['', [Validators.required]],
    cropTypeId: ['', [Validators.required]],
    quantity: [null as number | null, [Validators.required, Validators.min(1)]],
  });

  protected readonly sortOptions = computed(() =>
    BATCH_SORT_OPTIONS.map(opt => ({
      value: opt.value,
      label: this.i18n.t(opt.translationKey),
    }))
  );

  protected readonly batchStatusOptions = computed(() => [
    { value: 'all', label: this.i18n.t('batches.filter_all_status') },
    { value: 'active', label: this.i18n.t('batches.status_active') },
    { value: 'harvested', label: this.i18n.t('batches.status_harvested') },
    { value: 'lost', label: this.i18n.t('batches.status_lost') },
  ]);

  protected readonly availableCropTypes = computed(() => {
    const items = this.cropsFacade.filteredItems();
    return items.map(c => ({ id: c.id, name: c.name }));
  });

  constructor() {
    syncCrudModalForm({
      isModalOpen: () => this.facade.isModalOpen(),
      editingItem: () => this.facade.editingItem(),
      form: this.form,
      patchFromItem: (item) =>
        this.form.patchValue({
          name: item.name,
          cropTypeId: item.cropTypeId,
          quantity: item.quantity,
        }),
      defaultValue: () => ({ name: '', cropTypeId: '', quantity: null }),
    });
  }

  ngOnInit(): void {
    this.facade.enterPage();
    this.cropsFacade.loadAll();
  }

  protected navigateToWizard(): void {
    this.router.navigate(['/planting']);
  }

  protected updateSortFilter(sort: string): void {
    const sortBy = sort && sort !== 'all' ? sort : 'all';
    this.facade.patchFilters({ sortBy });
  }

  protected updateCropFilter(cropTypeId: string): void {
    this.facade.patchFilters({ cropTypeId });
  }

  protected readonly trackById = trackByEntityId;

  protected getStatusVariant(status: string): string {
    switch (status) {
      case 'active': return 'active';
      case 'harvested': return 'harvested';
      case 'lost': return 'danger';
      default: return 'default';
    }
  }

  protected displayDays(row: BatchRow): { current: number; total: number } {
    return resolveDisplayDays(
      row.growthDuration,
      row.daysPassed,
      row.growthPercent,
      row.status,
    );
  }

  protected growthStageKey(row: BatchRow): string {
    return `batches.stage_${row.growthStageKey}`;
  }

  protected growthBarClass(row: BatchRow): string {
    return `batches-page__growth-bar--${row.growthStageKey}`;
  }

  protected growthDaysToneClass(row: BatchRow): string {
    return `batches-page__growth-days--${row.growthStageKey}`;
  }

  protected displayLossCount(item: BatchRow): number {
    if (item.lossesCount > 0) return item.lossesCount;
    return Math.max(0, item.initialQuantity - item.quantity);
  }

  protected displayLossPercent(item: BatchRow): number {
    if (item.lossesPercentage > 0) return Math.round(item.lossesPercentage);
    const initial = item.initialQuantity;
    if (initial <= 0) return 0;
    return Math.round((this.displayLossCount(item) / initial) * 100);
  }

  protected submitForm(): void {
    if (this.form.invalid) return;
    const val = this.form.getRawValue();
    const editing = this.facade.editingItem();

    if (!editing) return;

    const dto: UpdateBatchDto = {
      cropTypeId: val.cropTypeId,
      quantity: val.quantity!,
      status: editing.status,
    };
    this.facade.update(editing.id, dto);
  }
}
