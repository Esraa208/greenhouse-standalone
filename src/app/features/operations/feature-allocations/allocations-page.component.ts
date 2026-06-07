/* libs/operations/feature-allocations/src/lib/allocations-page.component.ts */

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnInit,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
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
  BatchesFacade,
  type AllocationRow,
  type LossRecord,
} from '@app/core/data-access/operations';
import { type LossTypeRef } from '@app/core/data-access/operations';
import { mapLossTypeToApi } from '@app/core/data-access/operations/utils/loss-type.util';
import { AllocationLossPanelComponent } from '@app/shared/components';
import {
  GreenhousesFacade,
  LayersFacade,
  LocationsFacade,
  SystemsFacade,
  ZonesFacade,
} from '@app/core/data-access/infrastructure';

@Component({
  selector: 'gh-allocations-page',
  standalone: true,
  imports: [
    DecimalPipe,
    DatePipe,
    StockHistoryPanelComponent,
    TransferAllocationPanelComponent,
    AllocationLossPanelComponent,
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
  protected readonly locationsFacade = inject(LocationsFacade);
  protected readonly greenhousesFacade = inject(GreenhousesFacade);
  protected readonly zonesFacade = inject(ZonesFacade);
  protected readonly systemsFacade = inject(SystemsFacade);
  protected readonly layersFacade = inject(LayersFacade);
  protected readonly batchesFacade = inject(BatchesFacade);
  readonly #fb = inject(FormBuilder);

  protected readonly sortOptions = computed(() =>
    ALLOCATION_SORT_OPTIONS.map((opt) => ({
      value: opt.value,
      label: this.i18n.t(opt.translationKey),
    })),
  );

  protected readonly allocationStatusOptions = computed(() => [
    { value: 'all', label: this.i18n.t('allocations.filter_all_status') },
    { value: 'active', label: this.i18n.t('allocations.status_active') },
    { value: 'moved', label: this.i18n.t('allocations.status_moved') },
    { value: 'harvested', label: this.i18n.t('allocations.status_harvested') },
  ]);

  protected readonly filterLocations = computed(() => this.locationsFacade.selectItems());

  protected readonly filterGreenhouses = computed(() => {
    const locId = this.facade.filters().locationId;
    if (locId === 'all') return this.greenhousesFacade.selectItems();
    return this.greenhousesFacade.selectForLocation();
  });

  protected readonly filterZones = computed(() => {
    const ghId = this.facade.filters().greenhouseId;
    const locId = this.facade.filters().locationId;
    if (ghId !== 'all') return this.zonesFacade.selectForUnit();
    if (locId !== 'all') return this.zonesFacade.selectForLocation();
    return this.zonesFacade.selectItems();
  });

  protected readonly filterSystems = computed(() => {
    const zoneId = this.facade.filters().zoneId;
    if (zoneId !== 'all') return this.systemsFacade.selectForZone();
    return this.systemsFacade.selectItems();
  });

  protected readonly filterLayers = computed(() => {
    const sysId = this.facade.filters().systemId;
    if (sysId !== 'all') return this.layersFacade.selectForSystem();
    return this.layersFacade.selectItems();
  });

  protected readonly filterBatches = computed(() => this.batchesFacade.selectItems());

  protected readonly moveLocations = computed(() => this.locationsFacade.selectItems());

  protected readonly moveGreenhouses = computed(() => {
    const locId = this.facade.moveTargetLocationId();
    if (locId) return this.greenhousesFacade.selectForLocation();
    return this.greenhousesFacade.selectItems();
  });

  protected readonly moveZones = computed(() => {
    const ghId = this.facade.moveTargetGhId();
    const locId = this.facade.moveTargetLocationId();
    if (ghId) return this.zonesFacade.selectForUnit();
    if (locId) return this.zonesFacade.selectForLocation();
    return this.zonesFacade.selectItems();
  });

  protected readonly moveSystems = computed(() => {
    const zoneId = this.facade.moveTargetZoneId();
    if (zoneId) return this.systemsFacade.selectForZone();
    return this.systemsFacade.selectItems();
  });

  protected readonly moveLayers = computed(() => {
    const sysId = this.facade.moveTargetSystemId();
    if (sysId) return this.layersFacade.selectForSystem();
    return this.layersFacade.selectItems();
  });

  protected readonly movePathSegments = computed(() => {
    const segments: string[] = [];
    const locId = this.facade.moveTargetLocationId();
    if (locId) {
      const loc = this.locationsFacade.selectItems().find((l) => l.id === locId);
      if (loc?.name) segments.push(loc.name);
    }
    const ghId = this.facade.moveTargetGhId();
    if (ghId) {
      const gh = this.moveGreenhouses().find((g) => g.id === ghId);
      if (gh?.name) segments.push(gh.name);
    }
    const zoneId = this.facade.moveTargetZoneId();
    if (zoneId) {
      const zone = this.moveZones().find((z) => z.id === zoneId);
      if (zone?.name) segments.push(zone.name);
    }
    const sysId = this.facade.moveTargetSystemId();
    if (sysId) {
      const sys = this.moveSystems().find((s) => s.id === sysId);
      if (sys?.name) segments.push(sys.name);
    }
    const layerId = this.facade.moveTargetLayerId();
    if (layerId) {
      const layer = this.moveLayers().find((l) => l.id === layerId);
      if (layer?.name) segments.push(layer.name);
    }
    return segments;
  });

  readonly lossForm = this.#fb.nonNullable.group({
    lossType: ['', Validators.required],
    date: [new Date().toISOString().split('T')[0], Validators.required],
    quantity: [null as number | null, [Validators.required, Validators.min(1)]],
    reason: ['', Validators.required],
    notes: [''],
  });

  private readonly lossFormValue = toSignal(this.lossForm.valueChanges, {
    initialValue: this.lossForm.getRawValue(),
  });

  readonly canSubmitLoss = computed(() => {
    const item = this.facade.lossingItem();
    const formVal = this.lossFormValue();
    const qty = Number(formVal.quantity);
    const max = item?.quantity ?? 0;
    return (
      this.lossForm.valid &&
      !!item &&
      qty > 0 &&
      qty <= max
    );
  });

  ngOnInit(): void {
    this.facade.enterPage();
    this.locationsFacade.loadActiveForSelect();
    this.greenhousesFacade.loadActiveForSelect();
    this.zonesFacade.loadActiveForSelect();
    this.systemsFacade.loadActiveForSelect();
    this.layersFacade.loadActiveForSelect();
    this.batchesFacade.loadForSelect();
  }

  constructor() {
    effect(() => {
      const item = this.facade.lossingItem();
      const qtyCtrl = this.lossForm.controls.quantity;
      if (item) {
        qtyCtrl.setValidators([
          Validators.required,
          Validators.min(1),
          Validators.max(item.quantity),
        ]);
        qtyCtrl.updateValueAndValidity();
        return;
      }
      if (!this.facade.isLossModalOpen()) {
        qtyCtrl.setValidators([Validators.required, Validators.min(1)]);
        this.lossForm.reset({
          lossType: '',
          date: new Date().toISOString().split('T')[0],
          quantity: null,
          reason: '',
          notes: '',
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
      layerId: this.facade.lossingItem()!.layerId || undefined,
      lossType: v.lossType as LossTypeRef,
      date: v.date,
      quantity: v.quantity!,
      reason: v.reason,
      notes: v.notes || undefined,
    });
  }

  protected updateSortFilter(sort: string): void {
    const sortBy = sort && sort !== 'all' ? sort : 'all';
    this.facade.patchFilters({ sortBy: sortBy as AllocationSortKey | 'all' });
  }

  protected onFilterLocationChange(val: string): void {
    this.facade.patchFilters({
      locationId: val,
      greenhouseId: 'all',
      zoneId: 'all',
      systemId: 'all',
      layerId: 'all',
    });
    this.greenhousesFacade.loadActiveForLocation(val === 'all' ? '' : val);
  }

  protected onFilterGreenhouseChange(val: string): void {
    this.facade.patchFilters({
      greenhouseId: val,
      zoneId: 'all',
      systemId: 'all',
      layerId: 'all',
    });
    this.zonesFacade.loadActiveForUnit(val === 'all' ? '' : val);
  }

  protected onFilterZoneChange(val: string): void {
    this.facade.patchFilters({
      zoneId: val,
      systemId: 'all',
      layerId: 'all',
    });
    this.systemsFacade.loadActiveForZone(val === 'all' ? '' : val);
  }

  protected onFilterSystemChange(val: string): void {
    this.facade.patchFilters({
      systemId: val,
      layerId: 'all',
    });
    this.layersFacade.loadActiveForSystem(val === 'all' ? '' : val);
  }

  protected onFilterLayerChange(val: string): void {
    this.facade.patchFilters({ layerId: val });
  }

  protected onFilterBatchChange(val: string): void {
    this.facade.patchFilters({ stockBatchId: val });
  }

  protected onMoveLocationChange(val: string): void {
    this.facade.setMoveLocationId(val);
    this.greenhousesFacade.loadActiveForLocation(val);
  }

  protected onMoveGreenhouseChange(val: string): void {
    this.facade.setMoveGhId(val);
    this.zonesFacade.loadActiveForUnit(val);
  }

  protected onMoveZoneChange(val: string): void {
    this.facade.setMoveZoneId(val);
    this.systemsFacade.loadActiveForZone(val);
  }

  protected onMoveSystemChange(val: string): void {
    this.facade.setMoveSystemId(val);
    this.layersFacade.loadActiveForSystem(val);
  }

  protected onMoveLayerChange(val: string): void {
    this.facade.setMoveLayerId(val);
  }

  protected statusLabel(row: AllocationRow): string {
    if (row.statusLabel) return row.statusLabel;
    switch (row.status) {
      case 'active':
        return this.i18n.t('allocations.status_active');
      case 'moved':
        return this.i18n.t('allocations.status_moved');
      case 'harvested':
        return this.i18n.t('allocations.status_harvested');
      default:
        return row.status;
    }
  }

  protected getStatusVariant(status: AllocationStatus): string {
    switch (status) {
      case 'active':
        return 'active';
      case 'moved':
        return 'warning';
      case 'harvested':
        return 'harvested';
      default:
        return 'default';
    }
  }

  protected totalLossQty(losses: readonly { quantity: number }[]): number {
    return losses.reduce((s, l) => s + l.quantity, 0);
  }

  protected lossTypeCode(entry: LossRecord): number {
    return mapLossTypeToApi(entry.lossType);
  }

  protected openRegisterLoss(row: AllocationRow): void {
    this.facade.openLossModal(row);
  }

  protected selectValue(event: Event): string {
    return (event.target as HTMLSelectElement).value;
  }
}
