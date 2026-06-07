import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
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
import { LocationsFacade, GreenhousesFacade } from '@app/core/data-access/infrastructure';
import { withEditFallback } from '../../infrastructure/infrastructure-cascade.helper';
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
  protected readonly locationsFacade = inject(LocationsFacade);
  protected readonly greenhousesFacade = inject(GreenhousesFacade);
  protected readonly router = inject(Router);
  readonly #fb = inject(FormBuilder).nonNullable;

  protected readonly form = this.#fb.group({
    cropTypeId: ['', [Validators.required]],
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
  ]);

  protected statusLabel(status: BatchRow['status']): string {
    switch (status) {
      case 'active':
        return this.i18n.t('batches.status_active');
      case 'harvested':
        return this.i18n.t('batches.status_harvested');
      case 'lost':
        return this.i18n.t('batches.status_lost');
      default:
        return status;
    }
  }

  protected growthStageDisplay(row: BatchRow): string {
    if (row.growthStageLabel) return row.growthStageLabel;
    return this.i18n.t(`batches.stage_${row.growthStageKey}`);
  }

  protected displayProgressPercent(row: BatchRow): number {
    return Math.round(row.growthPercent);
  }

  protected progressBarValue(row: BatchRow): number {
    return Math.min(100, Math.max(0, row.growthPercent));
  }

  protected isOverdue(row: BatchRow): boolean {
    if (row.status !== 'active') return false;
    if (row.growthPercent > 100) return true;
    return row.growthDuration > 0 && row.daysPassed > row.growthDuration;
  }

  protected growthBarClass(row: BatchRow): string {
    return `batches-page__growth-bar--${row.growthStageKey}`;
  }

  protected readonly filterLocations = computed(() => this.locationsFacade.selectItems());

  protected readonly filterGreenhouses = computed(() => {
    const locId = this.facade.filters().locationId;
    if (locId === 'all') return this.greenhousesFacade.selectItems();
    return this.greenhousesFacade.selectForLocation();
  });

  protected readonly filterCropTypes = computed(() => this.cropsFacade.selectItems());

  protected readonly modalCropTypes = computed(() =>
    withEditFallback(
      this.cropsFacade.selectItems(),
      this.cropsFacade.selectItems(),
      this.facade.editingItem()?.cropTypeId,
    ),
  );

  constructor() {
    syncCrudModalForm({
      isModalOpen: () => this.facade.isModalOpen(),
      editingItem: () => this.facade.editingItem(),
      form: this.form,
      patchFromItem: (item) =>
        this.form.patchValue({
          cropTypeId: item.cropTypeId,
        }),
      defaultValue: () => ({ cropTypeId: '' }),
    });
  }

  protected editLocationLine(item: BatchRow): string {
    const parts = [item.locationSite, item.greenhouseName].filter((p) => !!p?.trim());
    if (parts.length > 0) return parts.join(' ← ');
    return item.locationName?.trim() || this.i18n.t('batches.details_not_set');
  }

  ngOnInit(): void {
    this.facade.enterPage();
    this.locationsFacade.loadActiveForSelect();
    this.greenhousesFacade.loadActiveForSelect();
    this.cropsFacade.loadActiveForSelect();
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

  protected onFilterLocationChange(val: string): void {
    this.facade.patchFilters({
      locationId: val,
      unitId: 'all',
    });
    this.greenhousesFacade.loadActiveForLocation(val === 'all' ? '' : val);
  }

  protected onFilterGreenhouseChange(val: string): void {
    this.facade.patchFilters({ unitId: val });
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

  protected growthProgressVariant(row: BatchRow): 'primary' | 'success' | 'warning' | 'info' {
    if (row.status === 'harvested') return 'success';
    if (this.isOverdue(row)) return 'warning';
    return 'info';
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

    const cropType =
      this.modalCropTypes().find((c) => c.id === val.cropTypeId)?.name ?? editing.cropType;

    const dto: UpdateBatchDto = {
      cropTypeId: val.cropTypeId,
      quantity: editing.quantity,
      isActive: editing.isActive,
      cropType,
    };
    this.facade.update(editing.id, dto);
  }
}
