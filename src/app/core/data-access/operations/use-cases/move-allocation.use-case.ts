import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AllocationsRepository } from '../repositories/allocations.repository';
import { AllocationRow, MoveAllocationDto } from '../models/allocation.model';
import { GhToastService } from '@app/core';
import { TranslationService } from '@app/core';

@Injectable({ providedIn: 'root' })
export class MoveAllocationUseCase {
  readonly #repo = inject(AllocationsRepository);
  readonly #toast = inject(GhToastService);
  readonly #i18n = inject(TranslationService);

  execute(params: {
    destroyRef: DestroyRef;
    item: AllocationRow;
    dto: MoveAllocationDto;
    closeModal: () => void;
    applyOptimisticMove: (id: string) => void;
    commit: (updated: AllocationRow) => void;
    rollback: (original: AllocationRow) => void;
  }): void {
    const {
      destroyRef,
      item,
      dto,
      closeModal,
      applyOptimisticMove,
      commit,
      rollback,
    } = params;

    applyOptimisticMove(item.id);
    closeModal();

    this.#repo
      .move(dto)
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe({
        next: (updated) => commit(updated),
        error: () => {
          rollback(item);
          this.#toast.error(this.#i18n.t('common.error'));
        },
      });
  }
}
