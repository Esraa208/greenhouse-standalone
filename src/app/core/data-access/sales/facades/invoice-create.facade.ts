import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AllocationsRepository } from '@app/core/data-access/operations/repositories/allocations.repository';
import { CustomersRepository } from '../repositories/customers.repository';
import { InvoicesRepository } from '../repositories/invoices.repository';
import {
  DEFAULT_INVOICE_CREATE_CASCADE,
  type CreateInvoiceFromHarvestDto,
  type InvoiceCreateCascade,
  type InvoiceCreateFormState,
  type InvoiceCropPriceDraft,
  type InvoiceHousingDraft,
  type InvoiceLayerGroupDraft,
} from '../models/invoice-create.model';
import type { AllocationRow } from '@app/core/data-access/operations/models/allocation.model';
import { GhToastService, TranslationService } from '@app/core';
import { InvoicesFacade } from './invoices.facade';
import { todayDateInputValue } from '../utils/invoice-date.util';

export interface CustomerSelectOption {
  readonly id: string;
  readonly name: string;
}

@Injectable({ providedIn: 'root' })
export class InvoiceCreateFacade {
  readonly #allocationsRepo = inject(AllocationsRepository);
  readonly #customersRepo = inject(CustomersRepository);
  readonly #invoicesRepo = inject(InvoicesRepository);
  readonly #invoicesFacade = inject(InvoicesFacade);
  readonly #destroyRef = inject(DestroyRef);
  readonly #toast = inject(GhToastService);
  readonly #i18n = inject(TranslationService);

  readonly #isOpen = signal(false);
  readonly #isSubmitting = signal(false);
  readonly #isLoadingHousings = signal(false);
  readonly #cascade = signal<InvoiceCreateCascade>({ ...DEFAULT_INVOICE_CREATE_CASCADE });
  readonly #form = signal<InvoiceCreateFormState>({
    customerId: '',
    invoiceDate: todayDateInputValue(),
    dueDate: '',
    notes: '',
    hasRoots: false,
    rootWeightPerPlant: null,
    valid: false,
  });
  readonly #layerGroups = signal<InvoiceLayerGroupDraft[]>([]);
  readonly #cropPrices = signal<Record<string, number | null>>({});
  readonly #customers = signal<CustomerSelectOption[]>([]);

  readonly isOpen = this.#isOpen.asReadonly();
  readonly isSubmitting = this.#isSubmitting.asReadonly();
  readonly isLoadingHousings = this.#isLoadingHousings.asReadonly();
  readonly cascade = this.#cascade.asReadonly();
  readonly layerGroups = this.#layerGroups.asReadonly();
  readonly customers = this.#customers.asReadonly();

  readonly totalPlants = computed(() =>
    this.#layerGroups().reduce(
      (sum, g) => sum + g.housings.reduce((s, h) => s + (h.quantity || 0), 0),
      0,
    ),
  );

  readonly uniqueCropPrices = computed<InvoiceCropPriceDraft[]>(() => {
    const map = new Map<string, InvoiceCropPriceDraft>();
    for (const group of this.#layerGroups()) {
      for (const h of group.housings) {
        if (!h.cropTypeId) continue;
        if (!map.has(h.cropTypeId)) {
          map.set(h.cropTypeId, {
            cropTypeId: h.cropTypeId,
            cropTypeName: h.cropTypeName,
            pricePerKg: this.#cropPrices()[h.cropTypeId] ?? null,
          });
        }
      }
    }
    return [...map.values()];
  });

  readonly canAddLayer = computed(() => {
    const c = this.#cascade();
    if (!c.locationId || !c.greenhouseId || !c.zoneId || !c.systemId || !c.layerId) return false;
    return !this.#layerGroups().some((g) => g.layerId === c.layerId);
  });

  readonly canSubmit = computed(() => {
    if (this.#isSubmitting()) return false;
    if (!this.#form().valid) return false;

    const form = this.#form();
    if (form.hasRoots && !(Number(form.rootWeightPerPlant) > 0)) return false;
    if (this.#layerGroups().length === 0) return false;
    if (this.totalPlants() <= 0) return false;

    const crops = this.uniqueCropPrices();
    if (crops.length === 0) return false;
    if (crops.some((c) => (c.pricePerKg ?? 0) <= 0)) return false;

    for (const g of this.#layerGroups()) {
      for (const h of g.housings) {
        if (h.quantity <= 0 || (h.weightKg ?? 0) <= 0) return false;
      }
    }
    return true;
  });

  openCreateModal(): void {
    this.#isOpen.set(true);
    this.#loadCustomers();
  }

  closeCreateModal(): void {
    this.#isOpen.set(false);
    this.#reset();
  }

  patchCascade(patch: Partial<InvoiceCreateCascade>): void {
    this.#cascade.update((c) => {
      const next = { ...c, ...patch };
      if ('locationId' in patch) {
        next.greenhouseId = '';
        next.zoneId = '';
        next.systemId = '';
        next.layerId = '';
      }
      if ('greenhouseId' in patch) {
        next.zoneId = '';
        next.systemId = '';
        next.layerId = '';
      }
      if ('zoneId' in patch) {
        next.systemId = '';
        next.layerId = '';
      }
      if ('systemId' in patch) {
        next.layerId = '';
      }
      return next;
    });
  }

  patchForm(patch: Partial<InvoiceCreateFormState>): void {
    this.#form.update((f) => ({ ...f, ...patch }));
  }

  addLayerHousings(layerLabel: string, pathLabel: string): void {
    const layerId = this.#cascade().layerId;
    if (!layerId || this.#isLoadingHousings()) return;
    if (this.#layerGroups().some((g) => g.layerId === layerId)) {
      this.#toast.warning(this.#i18n.t('invoices.create_layer_already_added'));
      return;
    }

    this.#isLoadingHousings.set(true);
    this.#allocationsRepo
      .getAll(1, '', { LayerId: Number(layerId), Status: 'active' }, 500)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (result) => {
          this.#isLoadingHousings.set(false);
          const rows = result.items.filter((a) => a.status === 'active' && a.quantity > 0);
          if (rows.length === 0) {
            this.#toast.warning(this.#i18n.t('invoices.create_no_housings'));
            return;
          }
          const group = this.#mapAllocationsToGroup(layerId, layerLabel, pathLabel, rows);
          this.#layerGroups.update((groups) => [...groups, group]);
          this.#syncCropPricesFromGroups([...this.#layerGroups()]);
          this.#cascade.update((c) => ({ ...c, layerId: '' }));
        },
        error: () => {
          this.#isLoadingHousings.set(false);
          this.#toast.error(this.#i18n.t('invoices.create_load_housings_error'));
        },
      });
  }

  removeLayerGroup(layerId: string): void {
    this.#layerGroups.update((groups) => groups.filter((g) => g.layerId !== layerId));
    this.#syncCropPricesFromGroups(this.#layerGroups());
  }

  setHousingQuantity(layerId: string, housingId: string, quantity: number): void {
    this.#layerGroups.update((groups) =>
      groups.map((g) =>
        g.layerId !== layerId
          ? g
          : {
              ...g,
              housings: g.housings.map((h) =>
                h.housingId !== housingId
                  ? h
                  : { ...h, quantity: Math.max(0, Math.min(quantity, h.availableQuantity)) },
              ),
            },
      ),
    );
  }

  setHousingWeight(layerId: string, housingId: string, weightKg: number | null): void {
    this.#layerGroups.update((groups) =>
      groups.map((g) =>
        g.layerId !== layerId
          ? g
          : {
              ...g,
              housings: g.housings.map((h) =>
                h.housingId !== housingId ? h : { ...h, weightKg },
              ),
            },
      ),
    );
  }

  setCropPrice(cropTypeId: string, pricePerKg: number | null): void {
    this.#cropPrices.update((prices) => ({ ...prices, [cropTypeId]: pricePerKg }));
  }

  create(): void {
    if (this.#isSubmitting() || !this.canSubmit()) return;

    const form = this.#form();
    const housings = this.#layerGroups().flatMap((g) =>
      g.housings
        .filter((h) => h.quantity > 0 && (h.weightKg ?? 0) > 0)
        .map((h) => ({
          housingId: h.housingId,
          quantity: h.quantity,
          weightKg: h.weightKg ?? 0,
        })),
    );

    const cropPrices = this.uniqueCropPrices()
      .filter((c) => (c.pricePerKg ?? 0) > 0)
      .map((c) => ({ cropTypeId: c.cropTypeId, pricePerKg: c.pricePerKg ?? 0 }));

    if (housings.length === 0 || cropPrices.length === 0) return;

    const dto: CreateInvoiceFromHarvestDto = {
      customerId: form.customerId,
      invoiceDate: form.invoiceDate,
      dueDate: form.dueDate || undefined,
      notes: form.notes || undefined,
      hasRoots: form.hasRoots,
      rootWeightPerPlantGrams: form.hasRoots
        ? Number(form.rootWeightPerPlant) || undefined
        : undefined,
      housings,
      cropPrices,
    };

    this.#isSubmitting.set(true);
    this.#invoicesRepo
      .createFromHarvest(dto)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: () => {
          this.#isSubmitting.set(false);
          this.#toast.success(this.#i18n.t('invoices.toast_create_success'));
          this.#invoicesFacade.refreshList();
          this.closeCreateModal();
        },
        error: () => {
          this.#isSubmitting.set(false);
          this.#toast.error(this.#i18n.t('invoices.toast_create_error'));
        },
      });
  }

  #loadCustomers(): void {
    if (this.#customers().length > 0) return;
    this.#customersRepo
      .fetchSelectPage(1)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: (items) =>
          this.#customers.set(items.map((c) => ({ id: c.id, name: c.name }))),
      });
  }

  #mapAllocationsToGroup(
    layerId: string,
    layerLabel: string,
    pathLabel: string,
    rows: AllocationRow[],
  ): InvoiceLayerGroupDraft {
    const housings: InvoiceHousingDraft[] = rows.map((a) => ({
      housingId: a.id,
      label: `${a.pipe || a.pipeId} — ${a.batchNumber}`,
      cropTypeId: a.cropTypeId ?? '',
      cropTypeName: a.cropType,
      availableQuantity: a.quantity,
      quantity: a.quantity,
      weightKg: null,
    }));
    return { layerId, layerLabel, pathLabel, housings };
  }

  #syncCropPricesFromGroups(groups: InvoiceLayerGroupDraft[]): void {
    const prices = { ...this.#cropPrices() };
    const ids = new Set<string>();
    for (const g of groups) {
      for (const h of g.housings) {
        if (h.cropTypeId) ids.add(h.cropTypeId);
      }
    }
    for (const id of Object.keys(prices)) {
      if (!ids.has(id)) delete prices[id];
    }
    for (const id of ids) {
      if (!(id in prices)) prices[id] = null;
    }
    this.#cropPrices.set(prices);
  }

  #reset(): void {
    this.#cascade.set({ ...DEFAULT_INVOICE_CREATE_CASCADE });
    this.#form.set({
      customerId: '',
      invoiceDate: todayDateInputValue(),
      dueDate: '',
      notes: '',
      hasRoots: false,
      rootWeightPerPlant: null,
      valid: false,
    });
    this.#layerGroups.set([]);
    this.#cropPrices.set({});
    this.#isSubmitting.set(false);
    this.#isLoadingHousings.set(false);
  }
}
