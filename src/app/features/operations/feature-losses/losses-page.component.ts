import { Component, ChangeDetectionStrategy, inject, computed, OnInit, effect } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslationService } from '@app/core';
import { CRUD_LIST_PAGE_IMPORTS_STANDARD } from '@app/shared/page-imports';
import { LossesFacade, BatchesFacade, type LossType, type LossRow } from '@app/core/data-access/operations';
import { LOSS_TYPES, resolveLossBadgeKind } from '@app/core/data-access/operations/utils/loss-type.util';
import {
  GreenhousesFacade,
  LayersFacade,
  LocationsFacade,
  SystemsFacade,
  ZonesFacade,
} from '@app/core/data-access/infrastructure';

@Component({
  selector: 'gh-losses-page',
  standalone: true,
  imports: [DatePipe, DecimalPipe, FormsModule, ReactiveFormsModule, ...CRUD_LIST_PAGE_IMPORTS_STANDARD],
  templateUrl: './losses-page.component.html',
  styleUrl: './losses-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LossesPageComponent implements OnInit {
  readonly facade = inject(LossesFacade);
  readonly i18n = inject(TranslationService);
  readonly locationsFacade = inject(LocationsFacade);
  readonly greenhousesFacade = inject(GreenhousesFacade);
  readonly zonesFacade = inject(ZonesFacade);
  readonly systemsFacade = inject(SystemsFacade);
  readonly layersFacade = inject(LayersFacade);
  readonly batchesFacade = inject(BatchesFacade);

  readonly lossTypeOptions = computed(() => [
    { value: 'all', label: this.i18n.t('losses.filter_all_loss_types') },
    ...LOSS_TYPES.map((value) => ({
      value,
      label: this.i18n.t(`losses.type_${value}`),
    })),
  ]);

  readonly filterLocations = computed(() => this.locationsFacade.selectItems());
  readonly filterBatches = computed(() => this.batchesFacade.selectItems());

  readonly filterGreenhouses = computed(() => {
    const locId = this.facade.filters().locationId;
    if (locId === 'all') return this.greenhousesFacade.selectItems();
    return this.greenhousesFacade.selectForLocation();
  });

  readonly filterZones = computed(() => {
    const ghId = this.facade.filters().greenhouseId;
    const locId = this.facade.filters().locationId;
    if (ghId !== 'all') return this.zonesFacade.selectForUnit();
    if (locId !== 'all') return this.zonesFacade.selectForLocation();
    return this.zonesFacade.selectItems();
  });

  readonly filterSystems = computed(() => {
    const zoneId = this.facade.filters().zoneId;
    if (zoneId !== 'all') return this.systemsFacade.selectForZone();
    return this.systemsFacade.selectItems();
  });

  readonly filterLayers = computed(() => {
    const sysId = this.facade.filters().systemId;
    if (sysId !== 'all') return this.layersFacade.selectForSystem();
    return this.layersFacade.selectItems();
  });

  readonly fb = inject(FormBuilder);

  readonly form = this.fb.group({
    date: [new Date().toISOString().substring(0, 10), Validators.required],
    lossType: ['disease' as LossType, Validators.required],
    reason: ['', Validators.required],
    quantity: [null as number | null, [Validators.required, Validators.min(1)]],
    notes: [''],
  });

  readonly modalModeOptions = computed(() => [
    { value: 'infrastructure', label: this.i18n.t('losses.tab_infrastructure') },
    { value: 'batch', label: this.i18n.t('losses.tab_batch') },
  ]);

  readonly createLossTypeOptions = computed(() =>
    LOSS_TYPES.map((value) => ({
      value,
      label: this.i18n.t(`losses.type_${value}`),
    })),
  );

  readonly batchModalOptions = computed(() => {
    const preview = this.facade.preview();
    const selectedId = this.facade.selBatchId();
    const plantsLabel = this.i18n.t('common.plants');

    return this.facade.refBatches().map((b) => {
      const usePreview = selectedId === b.id && preview?.scopeType === 'batch';
      const totalPlants = usePreview ? preview.summary.totalPlants : b.totalQuantity;
      const housingCount = usePreview ? preview.summary.housingCount : b.allocationsCount;
      const quantityPart = `${totalPlants.toLocaleString()} ${plantsLabel}`;
      const housingPart =
        housingCount > 0
          ? ` ${this.i18n.t('losses.batch_in_housings', { count: String(housingCount) })}`
          : '';

      return {
        value: b.id,
        label: `${b.batchNumber} - ${b.cropType} (${quantityPart}${housingPart})`,
      };
    });
  });

  readonly maxLossQuantity = computed(() => this.facade.selectedHousingQuantity());

  readonly canSubmit = computed(() => {
    if (!this.facade.showPreview() || this.facade.previewLoading()) return false;
    if (!this.form.controls.date.value || !this.form.controls.lossType.value || !this.form.controls.reason.value) {
      return false;
    }

    if (this.facade.modalMode() === 'batch') {
      return !!this.facade.selBatchId();
    }

    if (!this.facade.selLocationId()) return false;

    if (this.facade.selAllocationId()) {
      const qty = Number(this.form.controls.quantity.value ?? 0);
      const max = this.maxLossQuantity();
      return qty > 0 && qty <= max;
    }

    return true;
  });

  constructor() {
    effect(() => {
      if (this.facade.isModalOpen()) {
        this.form.reset({
          date: new Date().toISOString().substring(0, 10),
          lossType: 'disease',
          quantity: null,
          reason: '',
          notes: '',
        });
      }
    });
    effect(() => {
      const qtyCtrl = this.form.controls.quantity;
      const needsQty =
        this.facade.modalMode() === 'infrastructure' && !!this.facade.selAllocationId();
      if (needsQty) {
        qtyCtrl.setValidators([Validators.required, Validators.min(1)]);
      } else {
        qtyCtrl.clearValidators();
      }
      qtyCtrl.updateValueAndValidity({ emitEvent: false });
    });
  }

  ngOnInit(): void {
    this.locationsFacade.loadActiveForSelect();
    this.greenhousesFacade.loadActiveForSelect();
    this.zonesFacade.loadActiveForSelect();
    this.systemsFacade.loadActiveForSelect();
    this.layersFacade.loadActiveForSelect();
    this.batchesFacade.loadActiveForSelect();
    this.facade.enterPage();
  }

  selectValue(event: Event): string {
    return (event.target as HTMLSelectElement).value;
  }

  onFilterBatchChange(batchId: string): void {
    this.facade.patchFilters({ batchId: batchId || 'all' });
  }

  onFilterLocationChange(locationId: string): void {
    this.facade.patchFilters({
      locationId: locationId || 'all',
      greenhouseId: 'all',
      zoneId: 'all',
      systemId: 'all',
      layerId: 'all',
    });
    if (locationId && locationId !== 'all') {
      this.greenhousesFacade.loadActiveForLocation(locationId);
    }
  }

  onFilterGreenhouseChange(greenhouseId: string): void {
    this.facade.patchFilters({
      greenhouseId: greenhouseId || 'all',
      zoneId: 'all',
      systemId: 'all',
      layerId: 'all',
    });
    if (greenhouseId && greenhouseId !== 'all') {
      this.zonesFacade.loadActiveForUnit(greenhouseId);
    }
  }

  onFilterZoneChange(zoneId: string): void {
    this.facade.patchFilters({ zoneId: zoneId || 'all', systemId: 'all', layerId: 'all' });
    if (zoneId && zoneId !== 'all') {
      this.systemsFacade.loadActiveForZone(zoneId);
    }
  }

  onFilterSystemChange(systemId: string): void {
    this.facade.patchFilters({ systemId: systemId || 'all', layerId: 'all' });
    if (systemId && systemId !== 'all') {
      this.layersFacade.loadActiveForSystem(systemId);
    }
  }

  onFilterLayerChange(layerId: string): void {
    this.facade.patchFilters({ layerId: layerId || 'all' });
  }

  onModalModeChange(mode: string): void {
    this.facade.setModalMode(mode as 'infrastructure' | 'batch');
  }

  quantityMaxHint(): string {
    return this.i18n.t('losses.form_quantity_max_hint', {
      max: String(this.maxLossQuantity()),
    });
  }

  lossBadgeKind(item: LossRow): LossType {
    return resolveLossBadgeKind(item.lossType, item.lossTypeLabel);
  }

  sourceTypeLabel(item: LossRow): string {
    if (item.sourceTypeLabel) return item.sourceTypeLabel;
    switch (item.sourceType) {
      case 'allocation':
        return this.i18n.t('losses.src_alloc');
      case 'layer':
        return this.i18n.t('losses.src_layer');
      case 'batch':
        return this.i18n.t('losses.src_batch');
    }
  }

  lossTypeLabel(item: LossRow): string {
    if (item.lossTypeLabel) return item.lossTypeLabel;
    return this.i18n.t(`losses.type_${item.lossType}`);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const val = this.form.getRawValue();
    const mode = this.facade.modalMode();
    const lossType = (val.lossType ?? 'disease') as LossType;
    const date = val.date ?? new Date().toISOString().substring(0, 10);
    const reason = val.reason ?? '';
    const notes = val.notes ?? undefined;

    if (mode === 'infrastructure') {
      const hasHousing = !!this.facade.selAllocationId();
      this.facade.create({
        mode: 'infrastructure',
        locationId: this.facade.selLocationId(),
        greenhouseId: this.facade.selGreenhouseId() || undefined,
        zoneId: this.facade.selZoneId() || undefined,
        systemId: this.facade.selSystemId() || undefined,
        layerId: this.facade.selLayerId() || undefined,
        allocationId: hasHousing ? this.facade.selAllocationId() : undefined,
        lossType,
        date,
        reason,
        notes,
        quantity: hasHousing ? (val.quantity ?? 0) : undefined,
      });
    } else {
      const preview = this.facade.preview();
      const batchId = this.facade.selBatchId();
      if (!batchId || !preview) return;

      this.facade.createBatchLoss({
        batchId,
        lossType,
        date,
        reason,
        notes,
        quantity: preview.summary.totalPlants,
        registerWholeBatch: true,
        items: preview.housings.map((h) => ({
          housingId: h.id,
          quantity: h.quantity,
        })),
      });
    }
  }

  protected readonly trackById = (_: number, item: { id: string }): string => item.id;
}
