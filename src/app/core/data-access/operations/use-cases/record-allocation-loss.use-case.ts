import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AllocationsRepository } from '../repositories/allocations.repository';
import { AllocationRow, RecordAllocationLossDto } from '../models/allocation.model';
import { GhToastService } from '@app/core';
import { TranslationService } from '@app/core';

@Injectable({ providedIn: 'root' })
export class RecordAllocationLossUseCase {
  readonly #repo = inject(AllocationsRepository);
  readonly #toast = inject(GhToastService);
  readonly #i18n = inject(TranslationService);

  execute(params: {
    destroyRef: DestroyRef;
    item: AllocationRow;
    dto: RecordAllocationLossDto;
    closeModal: () => void;
    snapshot: AllocationRow[];
    applyOptimisticLoss: (id: string, quantity: number) => void;
    commit: (updated: AllocationRow) => void;
    rollback: (snapshot: AllocationRow[]) => void;
  }): void {
    const {
      destroyRef,
      item,
      dto,
      closeModal,
      snapshot,
      applyOptimisticLoss,
      commit,
      rollback,
    } = params;

    applyOptimisticLoss(item.id, dto.quantity);
    closeModal();

    this.#repo
      .recordLoss(dto)
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe({
        next: (updated) => commit(updated),
        error: () => {
          rollback(snapshot);
          this.#toast.error(this.#i18n.t('common.error'));
        },
      });
  }
}
