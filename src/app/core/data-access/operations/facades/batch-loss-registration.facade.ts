import { Injectable, inject, DestroyRef, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { LossesRepository } from '../repositories/losses.repository';
import { LossesFacade } from './losses.facade';
import { GhToastService, TranslationService } from '@app/core';
import { normalizeAppError } from '@app/core/errors/app-error';
import type { LossRefBatch, LossType } from '../models/loss.model';
import type {
  CreateBatchLossDto,
  LossRegistrationBatch,
  LossRegistrationLayer,
} from '../models/loss-registration.model';
import {
  buildLossLayersFromAllocations,
  toLossRegistrationBatch,
} from '../mappers/loss-registration.mapper';
import type { AllocationRow } from '../models/allocation.model';

export interface BatchLossFormValues {
  readonly lossType: LossType;
  readonly date: string;
  readonly quantity: number;
  readonly reason: string;
  readonly notes: string;
}

@Injectable({ providedIn: 'root' })
export class BatchLossRegistrationFacade {
  readonly #repo = inject(LossesRepository);
  readonly #lossesList = inject(LossesFacade);
  readonly #destroyRef = inject(DestroyRef);
  readonly #toast = inject(GhToastService);
  readonly #i18n = inject(TranslationService);

  readonly #isOpen = signal(false);
  readonly #loading = signal(false);
  readonly #refBatches = signal<LossRefBatch[]>([]);
  readonly #selectedBatchId = signal('');
  readonly #layers = signal<LossRegistrationLayer[]>([]);
  readonly #batchSummary = signal<LossRegistrationBatch | null>(null);
  readonly #wholeBatch = signal(false);
  readonly #selectedAllocationIds = signal<readonly string[]>([]);
  readonly #expandedLayerIds = signal<readonly string[]>([]);
  readonly #error = signal<string | null>(null);

  readonly isOpen = this.#isOpen.asReadonly();
  readonly loading = this.#loading.asReadonly();
  readonly refBatches = this.#refBatches.asReadonly();
  readonly selectedBatchId = this.#selectedBatchId.asReadonly();
  readonly layers = this.#layers.asReadonly();
  readonly batchSummary = this.#batchSummary.asReadonly();
  readonly wholeBatch = this.#wholeBatch.asReadonly();
  readonly selectedAllocationIds = this.#selectedAllocationIds.asReadonly();
  readonly expandedLayerIds = this.#expandedLayerIds.asReadonly();

  readonly allAllocationIds = computed(() =>
    this.#layers().flatMap((l) => l.allocations.map((a) => a.id)),
  );

  readonly selectedAllocations = computed(() => {
    const ids = new Set(this.#selectedAllocationIds());
    return this.#layers().flatMap((l) => l.allocations.filter((a) => ids.has(a.id)));
  });

  readonly selectedQuantityMax = computed(() =>
    this.selectedAllocations().reduce((sum, a) => sum + a.quantity, 0),
  );

  readonly hasSelection = computed(
    () => this.#wholeBatch() || this.selectedAllocations().length > 0,
  );

  loadRefBatches(): void {
    this.#repo
      .getRefBatches()
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe((batches) => this.#refBatches.set(batches));
  }

  openModal(batchId?: string): void {
    this.#resetState();
    this.#isOpen.set(true);
    this.loadRefBatches();
    if (batchId) {
      this.setBatchId(batchId);
    }
  }

  closeModal(): void {
    this.#isOpen.set(false);
    this.#resetState();
  }

  setBatchId(batchId: string): void {
    this.#selectedBatchId.set(batchId);
    this.#wholeBatch.set(false);
    this.#selectedAllocationIds.set([]);
    this.#layers.set([]);
    this.#batchSummary.set(null);

    if (!batchId) return;

    this.#loading.set(true);
    this.#error.set(null);
    this.#repo
      .getAllocationsByBatch(batchId)
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
        finalize(() => this.#loading.set(false)),
      )
      .subscribe({
        next: (rows) => this.#applyBatchRows(batchId, rows),
        error: (err: unknown) => this.#error.set(normalizeAppError(err).message),
      });
  }

  toggleWholeBatch(checked: boolean): void {
    this.#wholeBatch.set(checked);
    if (checked) {
      this.#selectedAllocationIds.set(this.allAllocationIds());
      this.#expandedLayerIds.set(this.#layers().map((l) => l.id));
    } else {
      this.#selectedAllocationIds.set([]);
    }
  }

  toggleLayerExpanded(layerId: string): void {
    const expanded = new Set(this.#expandedLayerIds());
    if (expanded.has(layerId)) {
      expanded.delete(layerId);
    } else {
      expanded.add(layerId);
    }
    this.#expandedLayerIds.set([...expanded]);
  }

  isLayerExpanded(layerId: string): boolean {
    return this.#expandedLayerIds().includes(layerId);
  }

  toggleLayer(layerId: string, checked: boolean): void {
    const layer = this.#layers().find((l) => l.id === layerId);
    if (!layer) return;
    const ids = new Set(this.#selectedAllocationIds());
    for (const allocation of layer.allocations) {
      if (checked) ids.add(allocation.id);
      else ids.delete(allocation.id);
    }
    this.#selectedAllocationIds.set([...ids]);
    this.#syncWholeBatchFlag();
  }

  toggleAllocation(allocationId: string, checked: boolean): void {
    const ids = new Set(this.#selectedAllocationIds());
    if (checked) ids.add(allocationId);
    else ids.delete(allocationId);
    this.#selectedAllocationIds.set([...ids]);
    this.#syncWholeBatchFlag();
  }

  isLayerChecked(layerId: string): boolean {
    const layer = this.#layers().find((l) => l.id === layerId);
    if (!layer || layer.allocations.length === 0) return false;
    const ids = new Set(this.#selectedAllocationIds());
    return layer.allocations.every((a) => ids.has(a.id));
  }

  isAllocationChecked(allocationId: string): boolean {
    return this.#selectedAllocationIds().includes(allocationId);
  }

  selectAll(): void {
    this.#selectedAllocationIds.set(this.allAllocationIds());
    this.#expandedLayerIds.set(this.#layers().map((l) => l.id));
    this.#syncWholeBatchFlag();
  }

  submit(form: BatchLossFormValues): void {
    const batchId = this.#selectedBatchId();
    if (!batchId || !form.lossType || !form.reason || form.quantity <= 0) return;

    const selected = this.#wholeBatch()
      ? this.#layers().flatMap((l) => l.allocations)
      : this.selectedAllocations();

    if (selected.length === 0) return;

    const items = this.#buildLossItems(selected, form.quantity);

    const dto: CreateBatchLossDto = {
      batchId,
      lossType: form.lossType,
      date: form.date,
      quantity: form.quantity,
      reason: form.reason,
      notes: form.notes || undefined,
      registerWholeBatch: this.#wholeBatch(),
      items,
    };

    this.#loading.set(true);
    this.#repo
      .createBatchLoss(dto)
      .pipe(
        takeUntilDestroyed(this.#destroyRef),
        finalize(() => this.#loading.set(false)),
      )
      .subscribe({
        next: () => {
          this.closeModal();
          this.#lossesList.refresh();
          this.#toast.success(this.#i18n.t('losses.toast_create_success'));
        },
        error: (err: unknown) => this.#error.set(normalizeAppError(err).message),
      });
  }

  #applyBatchRows(batchId: string, rows: AllocationRow[]): void {
    const layers = buildLossLayersFromAllocations(rows);
    const ref = this.#refBatches().find((b) => b.id === batchId);
    const summary = ref
      ? toLossRegistrationBatch(ref, layers)
      : {
          id: batchId,
          batchNumber: rows[0]?.batchNumber ?? `BTH-${batchId}`,
          cropType: rows[0]?.cropType ?? '',
          layerCount: layers.length,
          totalQuantity: layers.reduce((sum, l) => sum + l.totalQuantity, 0),
        };
    this.#layers.set(layers);
    this.#batchSummary.set(summary);
    this.#expandedLayerIds.set(layers.length > 0 ? [layers[0].id] : []);
  }

  #buildLossItems(
    selected: readonly { id: string; quantity: number }[],
    formQuantity: number,
  ): { distributionId: string; quantity: number }[] {
    if (this.#wholeBatch()) {
      return selected.map((a) => ({ distributionId: a.id, quantity: a.quantity }));
    }
    if (selected.length === 1) {
      return [
        {
          distributionId: selected[0].id,
          quantity: Math.min(formQuantity, selected[0].quantity),
        },
      ];
    }
    const each = Math.max(1, Math.floor(formQuantity / selected.length));
    return selected.map((a) => ({
      distributionId: a.id,
      quantity: Math.min(each, a.quantity),
    }));
  }

  #syncWholeBatchFlag(): void {
    const all = this.allAllocationIds();
    const selected = this.#selectedAllocationIds();
    this.#wholeBatch.set(all.length > 0 && all.every((id) => selected.includes(id)));
  }

  #resetState(): void {
    this.#selectedBatchId.set('');
    this.#layers.set([]);
    this.#batchSummary.set(null);
    this.#wholeBatch.set(false);
    this.#selectedAllocationIds.set([]);
    this.#expandedLayerIds.set([]);
    this.#error.set(null);
    this.#loading.set(false);
  }
}
