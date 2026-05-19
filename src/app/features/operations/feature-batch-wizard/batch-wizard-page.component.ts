import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslationService } from '@app/core';
import { TranslatePipe } from '@app/shared/pipes';
import {
  CropsFacade,
  BatchesFacade,
} from '@app/core/data-access/operations';
import {
  LocationsFacade,
  GreenhousesFacade,
  ZonesFacade,
  SystemsFacade,
  LayersFacade,
} from '@app/core/data-access/infrastructure';
import {
  GhProgressBarComponent,
  GhButtonComponent,
  GhBadgeComponent,
  GhPageHeaderComponent,
} from '@app/shared/components';
import { GhToastService } from '@app/core';
import { PositiveIntInputDirective } from '@app/shared/directives';
import { parsePositiveInt } from '@app/shared/utils/parse-positive-int';
interface SelectedLayer {
  layerId: string;
  layerName: string;
  capacity: number;
  quantity: number;
}

interface SelectedSystem {
  systemId: string;
  systemName: string;
  zoneId: string;
  zoneName: string;
  layers: SelectedLayer[];
}

@Component({
  selector: 'gh-batch-wizard-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DecimalPipe,
    TranslatePipe,
    GhProgressBarComponent,
    GhButtonComponent,
    GhBadgeComponent,
    GhPageHeaderComponent,
    PositiveIntInputDirective,
  ],
  templateUrl: './batch-wizard-page.component.html',
  styleUrl: './batch-wizard-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BatchWizardPageComponent {
  protected readonly i18n = inject(TranslationService);
  protected readonly router = inject(Router);
  protected readonly cropsFacade = inject(CropsFacade);
  protected readonly batchesFacade = inject(BatchesFacade);
  protected readonly locationsFacade = inject(LocationsFacade);
  protected readonly greenhousesFacade = inject(GreenhousesFacade);
  protected readonly zonesFacade = inject(ZonesFacade);
  protected readonly systemsFacade = inject(SystemsFacade);
  protected readonly layersFacade = inject(LayersFacade);
  readonly #toast = inject(GhToastService);
  readonly isSubmitting = signal(false);

  readonly currentStep = signal(1);
  readonly totalSteps = 5;

  protected readonly wizardSteps = [
    { id: 1, labelKey: 'batches.wizard_step_crop', icon: 'crop' as const },
    { id: 2, labelKey: 'batches.wizard_step_location', icon: 'location' as const },
    { id: 3, labelKey: 'batches.wizard_step_systems', icon: 'systems' as const },
    { id: 4, labelKey: 'batches.wizard_step_layers', icon: 'layers' as const },
    { id: 5, labelKey: 'batches.wizard_step_review', icon: 'review' as const },
  ];

  // Step 1: Name, crop & quantity
  readonly batchName = signal('');
  readonly selectedCropId = signal('');
  readonly totalQuantity = signal<number>(0);

  // Step 2: Location
  readonly selectedLocationId = signal('');
  readonly selectedLocationName = signal('');
  readonly selectedGreenhouseId = signal('');
  readonly selectedGreenhouseName = signal('');

  // Step 3: Systems
  readonly tempZoneId = signal('');
  readonly tempSystemId = signal('');
  readonly selectedSystems = signal<SelectedSystem[]>([]);

  // Computed
  readonly selectedCrop = computed(() => {
    const id = this.selectedCropId();
    if (!id) return null;
    return this.cropsFacade.filteredItems().find(c => c.id === id) ?? null;
  });

  /** Planting date + crop growth duration → expected harvest. */
  readonly expectedHarvestDate = computed(() => {
    const days = this.selectedCrop()?.growthDuration ?? 0;
    if (days <= 0) return null;
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + days);
    return date;
  });

  readonly availableLocations = computed(() =>
    this.locationsFacade.selectItems().map(l => ({ id: l.id, name: l.name }))
  );

  readonly availableGreenhouses = computed(() => {
    const locId = this.selectedLocationId();
    if (!locId) return [];
    return this.greenhousesFacade.selectItems()
      .filter((g: any) => String(g.locationId) === String(locId))
      .map(g => ({ id: g.id, name: g.name }));
  });

  readonly availableZones = computed(() => {
    const ghId = this.selectedGreenhouseId();
    if (!ghId) return [];
    return this.zonesFacade.selectItems()
      .filter((z: any) => String(z.greenhouseId) === String(ghId))
      .map(z => ({ id: z.id, name: z.name }));
  });

  readonly availableSystems = computed(() => {
    const zoneId = this.tempZoneId();
    if (!zoneId) return [];
    return this.systemsFacade.selectItems()
      .filter((s: any) => String(s.zoneId) === String(zoneId))
      .map(s => ({ id: s.id, name: s.name }));
  });

  /** Systems already added in this wizard session — excluded from pickers. */
  readonly selectedSystemIds = computed(
    () => new Set(this.selectedSystems().map(s => String(s.systemId))),
  );

  readonly selectableSystems = computed(() => {
    const added = this.selectedSystemIds();
    return this.availableSystems().filter(s => !added.has(String(s.id)));
  });

  /** Zones that still have at least one system not yet added. */
  readonly selectableZones = computed(() => {
    const added = this.selectedSystemIds();
    return this.availableZones().filter(zone =>
      this.systemsFacade.selectItems().some(
        (s: { id: string; zoneId: string }) =>
          String(s.zoneId) === String(zone.id) && !added.has(String(s.id)),
      ),
    );
  });

  readonly availableLayers = computed(() =>
    this.layersFacade.selectItems().map(l => ({ id: l.id, name: l.name, capacity: (l as any).totalCapacity || 500 }))
  );

  readonly totalAllocated = computed(() =>
    this.selectedSystems().reduce((total, sys) =>
      total + sys.layers.reduce((sum, l) => sum + l.quantity, 0), 0)
  );

  readonly remaining = computed(() => this.totalQuantity() - this.totalAllocated());

  readonly allocationPercent = computed(() => {
    const total = this.totalQuantity();
    if (total <= 0) return 0;
    return Math.min(100, Math.round((this.totalAllocated() / total) * 100));
  });

  readonly hasLayerCapacityViolation = computed(() =>
    this.selectedSystems().some(sys =>
      sys.layers.some(l => l.quantity > l.capacity),
    ),
  );

  readonly canProceedStep1 = computed(
    () =>
      this.batchName().trim().length > 0 &&
      !!this.selectedCropId() &&
      this.totalQuantity() > 0,
  );
  readonly canProceedStep2 = computed(() => !!this.selectedLocationId() && !!this.selectedGreenhouseId());
  readonly canProceedStep3 = computed(() => this.selectedSystems().length > 0);
  readonly canProceedStep4 = computed(() => {
    const total = this.totalQuantity();
    if (total <= 0 || this.totalAllocated() !== total) return false;
    if (this.hasLayerCapacityViolation()) return false;
    return this.selectedSystems().some(sys => sys.layers.some(l => l.quantity > 0));
  });

  protected readonly currentStepLabel = computed(() => {
    const keys: Record<number, string> = {
      1: 'batches.wizard_step_crop',
      2: 'batches.wizard_step_location',
      3: 'batches.wizard_step_systems',
      4: 'batches.wizard_step_layers',
      5: 'batches.wizard_step_review',
    };
    return this.i18n.t(keys[this.currentStep()] ?? '');
  });

  protected readonly stepOfLabel = computed(() =>
    this.i18n.translate('batches.wizard_step_of', {
      current: String(this.currentStep()),
      total: String(this.totalSteps),
    })
  );

  constructor() {
    this.cropsFacade.loadAll();
    this.locationsFacade.loadActiveForSelect();
    this.greenhousesFacade.loadActiveForSelect();
    this.zonesFacade.loadActiveForSelect();
    this.systemsFacade.loadActiveForSelect();
    this.layersFacade.loadActiveForSelect();
  }

  protected goBack(): void {
    this.router.navigate(['/batches']);
  }

  protected nextStep(): void {
    if (this.currentStep() === 2) {
      this.syncSystemsToCurrentGreenhouse();
    }
    if (this.currentStep() < this.totalSteps) {
      this.currentStep.update(s => s + 1);
    }
  }

  protected prevStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update(s => s - 1);
    }
  }

  protected setBatchName(event: Event): void {
    this.batchName.set((event.target as HTMLInputElement).value);
  }

  protected selectCrop(event: Event): void {
    this.selectedCropId.set((event.target as HTMLSelectElement).value);
  }

  protected setQuantity(event: Event): void {
    this.totalQuantity.set(parsePositiveInt((event.target as HTMLInputElement).value));
  }

  protected onLocationChange(locationId: string): void {
    const id = locationId ?? '';
    const name = this.availableLocations().find(l => l.id === id)?.name ?? '';
    this.selectedLocationId.set(id);
    this.selectedLocationName.set(name);
    this.selectedGreenhouseId.set('');
    this.selectedGreenhouseName.set('');
    this.clearSystemsState();
  }

  protected onGreenhouseChange(greenhouseId: string): void {
    const id = greenhouseId ?? '';
    const name = this.availableGreenhouses().find(g => g.id === id)?.name ?? '';
    this.selectedGreenhouseId.set(id);
    this.selectedGreenhouseName.set(name);
    this.clearSystemsState();
  }

  protected onTempZoneChange(zoneId: string): void {
    this.tempZoneId.set(zoneId ?? '');
    this.tempSystemId.set('');
  }

  protected onTempSystemChange(systemId: string): void {
    const id = systemId ?? '';
    if (id && this.selectedSystemIds().has(String(id))) {
      this.tempSystemId.set('');
      return;
    }
    this.tempSystemId.set(id);
  }

  protected addSystem(): void {
    const sysId = this.tempSystemId();
    const zoneId = this.tempZoneId();
    if (!sysId || !zoneId || !this.selectedGreenhouseId()) return;

    const zoneValid = this.selectableZones().some(z => z.id === zoneId);
    const systemValid = this.selectableSystems().some(s => s.id === sysId);
    if (!zoneValid || !systemValid) return;

    const sysName = this.availableSystems().find(s => s.id === sysId)?.name ?? '';
    const zoneName = this.availableZones().find(z => z.id === zoneId)?.name ?? '';

    this.selectedSystems.update(systems => [
      ...systems,
      { systemId: sysId, systemName: sysName, zoneId, zoneName, layers: [] },
    ]);
    this.tempZoneId.set('');
    this.tempSystemId.set('');
  }

  protected removeSystem(systemId: string): void {
    this.selectedSystems.update(systems => systems.filter(s => s.systemId !== systemId));
  }

  protected toggleLayer(systemId: string, layer: { id: string; name: string; capacity: number }): void {
    this.selectedSystems.update(systems =>
      systems.map(sys => {
        if (sys.systemId !== systemId) return sys;
        const exists = sys.layers.find(l => l.layerId === layer.id);
        if (exists) {
          return { ...sys, layers: sys.layers.filter(l => l.layerId !== layer.id) };
        }
        return {
          ...sys,
          layers: [...sys.layers, { layerId: layer.id, layerName: layer.name, capacity: layer.capacity, quantity: 0 }],
        };
      })
    );
  }

  protected isLayerSelected(systemId: string, layerId: string): boolean {
    const sys = this.selectedSystems().find(s => s.systemId === systemId);
    return !!sys?.layers.find(l => l.layerId === layerId);
  }

  protected setLayerQuantity(systemId: string, layerId: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const sys = this.selectedSystems().find(s => s.systemId === systemId);
    const layer = sys?.layers.find(l => l.layerId === layerId);
    if (!layer) return;

    let qty = parsePositiveInt(input.value);
    qty = this.clampLayerQuantity(qty, layer.capacity, layer.quantity);

    const display = qty > 0 ? String(qty) : '';
    if (input.value !== display) {
      input.value = display;
    }

    this.selectedSystems.update(systems =>
      systems.map(s => {
        if (s.systemId !== systemId) return s;
        return {
          ...s,
          layers: s.layers.map(l => (l.layerId === layerId ? { ...l, quantity: qty } : l)),
        };
      }),
    );
  }

  protected systemTotal(sys: SelectedSystem): number {
    return sys.layers.reduce((s, l) => s + l.quantity, 0);
  }

  protected layerUtilizationPercent(quantity: number, capacity: number): number {
    if (capacity <= 0) return 0;
    return Math.min(100, Math.round((quantity / capacity) * 100));
  }

  protected allocationProgressVariant(): 'success' | 'warning' | 'danger' | 'primary' {
    const remaining = this.remaining();
    if (remaining === 0 && this.totalAllocated() > 0) return 'success';
    if (remaining < 0) return 'warning';
    if (remaining > 0) return 'primary';
    return 'primary';
  }

  protected autoDistribute(): void {
    const total = this.totalQuantity();
    const layers = this.selectedSystems().flatMap(sys =>
      sys.layers.map(l => ({
        systemId: sys.systemId,
        layerId: l.layerId,
        capacity: l.capacity,
      })),
    );
    if (layers.length === 0 || total <= 0) return;

    let remaining = total;
    const base = Math.floor(total / layers.length);

    this.selectedSystems.update(systems =>
      systems.map((sys, sysIdx) => ({
        ...sys,
        layers: sys.layers.map((l, layerIdx) => {
          const globalIdx = systems
            .slice(0, sysIdx)
            .reduce((n, s) => n + s.layers.length, 0) + layerIdx;
          const isLast = globalIdx === layers.length - 1;
          let qty = isLast ? remaining : base;
          qty = Math.min(qty, l.capacity, remaining);
          remaining -= qty;
          return { ...l, quantity: qty };
        }),
      })),
    );
  }

  /** Max qty for this layer without exceeding batch total or layer capacity. */
  private clampLayerQuantity(requested: number, capacity: number, currentOnLayer: number): number {
    let qty = Math.max(0, requested);
    qty = Math.min(qty, capacity);
    const otherAllocated = this.totalAllocated() - currentOnLayer;
    const maxByBatch = Math.max(0, this.totalQuantity() - otherAllocated);
    return Math.min(qty, maxByBatch);
  }

  protected clearQuantities(): void {
    this.selectedSystems.update(systems =>
      systems.map(sys => ({
        ...sys,
        layers: sys.layers.map(l => ({ ...l, quantity: 0 })),
      }))
    );
  }

  /** Drop systems/zones that no longer belong to the selected greenhouse. */
  private syncSystemsToCurrentGreenhouse(): void {
    const ghId = this.selectedGreenhouseId();
    if (!ghId) {
      this.clearSystemsState();
      return;
    }
    const validZoneIds = new Set(
      this.zonesFacade
        .selectItems()
        .filter(z => String(z.greenhouseId) === String(ghId))
        .map(z => String(z.id)),
    );
    const kept = this.selectedSystems().filter(s => validZoneIds.has(String(s.zoneId)));
    if (kept.length !== this.selectedSystems().length) {
      this.selectedSystems.set(kept);
    }
  }

  private clearSystemsState(): void {
    this.selectedSystems.set([]);
    this.tempZoneId.set('');
    this.tempSystemId.set('');
  }

  protected submitBatch(): void {
    const cropId = this.selectedCropId();
    if (!cropId) return;

    const layers = this.selectedSystems()
      .flatMap((s) => s.layers)
      .filter((l) => l.quantity > 0)
      .map((l) => ({ layerId: l.layerId, quantity: l.quantity }));

    if (layers.length === 0) {
      this.#toast.error(this.i18n.t('batches.wizard_no_layers_error'));
      return;
    }

    const qty = layers.reduce((sum, l) => sum + l.quantity, 0);

    this.isSubmitting.set(true);
    const name = this.batchName().trim();
    if (!name) {
      this.#toast.error(this.i18n.t('batches.form_name_error'));
      return;
    }

    this.batchesFacade.create(
      {
        name,
        cropTypeId: cropId,
        quantity: qty,
        layers,
      },
      {
        afterSuccess: () => {
          this.isSubmitting.set(false);
          this.router.navigate(['/batches']);
        },
        afterError: () => this.isSubmitting.set(false),
      },
    );
  }
}
