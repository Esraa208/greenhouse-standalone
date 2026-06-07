import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { startWith } from 'rxjs';
import { DecimalPipe } from '@angular/common';
import { TranslationService } from '@app/core';
import { InvoiceCreateFacade } from '@app/core/data-access/sales';
import {
  GreenhousesFacade,
  LayersFacade,
  LocationsFacade,
  SystemsFacade,
  ZonesFacade,
} from '@app/core/data-access/infrastructure';
import {
  GhButtonComponent,
  GhFormGroupComponent,
} from '@app/shared/components';
import { TranslatePipe } from '@app/shared/pipes';
import { PositiveDecimalInputDirective } from '@app/shared/directives';
import { PositiveIntInputDirective } from '@app/shared/directives/positive-int-input.directive';
import { todayDateInputValue } from '@app/core/data-access/sales/utils/invoice-date.util';

@Component({
  selector: 'gh-invoice-harvest-create-panel',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DecimalPipe,
    TranslatePipe,
    GhButtonComponent,
    GhFormGroupComponent,
    PositiveDecimalInputDirective,
    PositiveIntInputDirective,
  ],
  templateUrl: './invoice-harvest-create-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoiceHarvestCreatePanelComponent {
  readonly createFacade = inject(InvoiceCreateFacade);
  readonly i18n = inject(TranslationService);
  readonly #destroyRef = inject(DestroyRef);
  readonly locationsFacade = inject(LocationsFacade);
  readonly greenhousesFacade = inject(GreenhousesFacade);
  readonly zonesFacade = inject(ZonesFacade);
  readonly systemsFacade = inject(SystemsFacade);
  readonly layersFacade = inject(LayersFacade);
  readonly #fb = inject(FormBuilder);

  readonly form = this.#fb.nonNullable.group({
    hasRoots: [false],
    rootWeightPerPlant: [null as number | null],
    customerId: ['', Validators.required],
    invoiceDate: [todayDateInputValue(), Validators.required],
    dueDate: [''],
    notes: [''],
  });

  readonly modalLocations = computed(() => this.locationsFacade.selectItems());
  readonly modalGreenhouses = computed(() => {
    const locId = this.createFacade.cascade().locationId;
    if (!locId) return [];
    return this.greenhousesFacade.selectForLocation();
  });
  readonly modalZones = computed(() => {
    const ghId = this.createFacade.cascade().greenhouseId;
    if (!ghId) return [];
    return this.zonesFacade.selectForUnit();
  });
  readonly modalSystems = computed(() => {
    const zoneId = this.createFacade.cascade().zoneId;
    if (!zoneId) return [];
    return this.systemsFacade.selectForZone();
  });
  readonly modalLayers = computed(() => {
    const systemId = this.createFacade.cascade().systemId;
    if (!systemId) return [];
    const addedLayerIds = new Set(this.createFacade.layerGroups().map((g) => g.layerId));
    return this.layersFacade.selectForSystem().filter((l) => !addedLayerIds.has(l.id));
  });

  constructor() {
    this.form.valueChanges
      .pipe(startWith(this.form.getRawValue()), takeUntilDestroyed(this.#destroyRef))
      .subscribe(() => this.#syncFormToFacade());
    this.form.statusChanges
      .pipe(startWith(this.form.status), takeUntilDestroyed(this.#destroyRef))
      .subscribe(() => this.#syncFormToFacade());

    effect(() => {
      if (this.createFacade.isOpen()) {
        this.locationsFacade.loadActiveForSelect();
      }
    });

    effect(() => {
      if (!this.createFacade.isOpen()) {
        this.form.reset({
          hasRoots: false,
          rootWeightPerPlant: null,
          customerId: '',
          invoiceDate: todayDateInputValue(),
          dueDate: '',
          notes: '',
        });
        this.#syncFormToFacade();
      }
    });
  }

  #syncFormToFacade(): void {
    const v = this.form.getRawValue();
    this.createFacade.patchForm({
      customerId: v.customerId,
      invoiceDate: v.invoiceDate,
      dueDate: v.dueDate,
      notes: v.notes,
      hasRoots: v.hasRoots,
      rootWeightPerPlant: v.rootWeightPerPlant,
      valid: this.form.valid,
    });
  }

  selectValue(event: Event): string {
    return (event.target as HTMLSelectElement).value;
  }

  inputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  onLocationChange(event: Event): void {
    const locationId = this.selectValue(event);
    this.createFacade.patchCascade({ locationId });
    if (locationId) this.greenhousesFacade.loadActiveForLocation(locationId);
  }

  onGreenhouseChange(event: Event): void {
    const greenhouseId = this.selectValue(event);
    this.createFacade.patchCascade({ greenhouseId });
    if (greenhouseId) this.zonesFacade.loadActiveForUnit(greenhouseId);
  }

  onZoneChange(event: Event): void {
    const zoneId = this.selectValue(event);
    this.createFacade.patchCascade({ zoneId });
    if (zoneId) this.systemsFacade.loadActiveForZone(zoneId);
  }

  onSystemChange(event: Event): void {
    const systemId = this.selectValue(event);
    this.createFacade.patchCascade({ systemId });
    if (systemId) this.layersFacade.loadActiveForSystem(systemId);
  }

  onLayerChange(event: Event): void {
    this.createFacade.patchCascade({ layerId: this.selectValue(event) });
  }

  addLayerHousings(): void {
    const c = this.createFacade.cascade();
    const layer =
      this.layersFacade.selectForSystem().find((l) => l.id === c.layerId) ??
      this.modalLayers().find((l) => l.id === c.layerId);
    const location = this.modalLocations().find((l) => l.id === c.locationId);
    const greenhouse = this.modalGreenhouses().find((g) => g.id === c.greenhouseId);
    const pathLabel = [location?.name, greenhouse?.name].filter(Boolean).join(' ← ');
    this.createFacade.addLayerHousings(layer?.name ?? c.layerId, pathLabel);
  }

  submit(): void {
    this.#syncFormToFacade();
    this.createFacade.create();
  }
}
