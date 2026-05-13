import { Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';
import { BatchesRepository } from '../repositories/batches.repository';
import { BatchRow } from '../models/batch.model';
import { GhToastService } from '@app/core';
import { TranslationService } from '@app/core';

@Injectable({ providedIn: 'root' })
export class DeleteBatchUseCase {
  readonly #repo = inject(BatchesRepository);
  readonly #toast = inject(GhToastService);
  readonly #i18n = inject(TranslationService);

  execute(params: {
    destroyRef: DestroyRef;
    item: BatchRow;
    previousItems: BatchRow[];
    applyOptimisticDelete: (id: string) => void;
    rollback: (items: BatchRow[]) => void;
    setError: (message: string) => void;
    closeModal: () => void;
  }): void {
    const {
      destroyRef,
      item,
      previousItems,
      applyOptimisticDelete,
      rollback,
      setError,
      closeModal,
    } = params;

    applyOptimisticDelete(item.id);
    closeModal();

    this.#repo
      .delete(item.id)
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe({
        next: () => {
          this.#toast.success(this.#i18n.t('batches.toast_delete_success'));
        },
        error: () => {
          rollback(previousItems);
          setError('Failed to delete batch');
          this.#toast.error(this.#i18n.t('common.error_occurred'));
        },
      });
  }
}
