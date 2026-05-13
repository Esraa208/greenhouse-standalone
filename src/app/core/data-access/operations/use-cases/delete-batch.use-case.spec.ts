import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { DeleteBatchUseCase } from './delete-batch.use-case';
import { BatchesRepository } from '../repositories/batches.repository';
import { GhToastService } from '@app/core';
import { TranslationService } from '@app/core';
import { BatchRow } from '../models/batch.model';

describe('DeleteBatchUseCase', () => {
  const mockBatch: BatchRow = {
    id: 'b1',
    batchNumber: 'B-001',
    cropType: 'Lettuce',
    cropTypeId: 'c1',
    location: 'L1',
    greenhouse: 'G1',
    locationId: 'l1',
    greenhouseId: 'g1',
    quantity: 100,
    initialQuantity: 100,
    plantingDate: new Date().toISOString(),
    growthDurationDays: 30,
    status: 'active',
    allocationsCount: 0,
    totalLosses: 0,
  };

  const destroyRefStub = { onDestroy: () => {} } as any;

  it('applies optimistic delete and commits on success', () => {
    const repo = { delete: vi.fn(() => of(void 0)) };
    const toast = { success: vi.fn(), error: vi.fn() };
    const i18n = { t: vi.fn((k: string) => k) };

    TestBed.configureTestingModule({
      providers: [
        DeleteBatchUseCase,
        { provide: BatchesRepository, useValue: repo },
        { provide: GhToastService, useValue: toast },
        { provide: TranslationService, useValue: i18n },
      ],
    });

    const useCase = TestBed.inject(DeleteBatchUseCase);
    const applyOptimisticDelete = vi.fn();
    const rollback = vi.fn();
    const setError = vi.fn();
    const closeModal = vi.fn();

    useCase.execute({
      destroyRef: destroyRefStub,
      item: mockBatch,
      previousItems: [mockBatch],
      applyOptimisticDelete,
      rollback,
      setError,
      closeModal,
    });

    expect(applyOptimisticDelete).toHaveBeenCalledWith('b1');
    expect(closeModal).toHaveBeenCalled();
    expect(repo.delete).toHaveBeenCalledWith('b1');
    expect(toast.success).toHaveBeenCalledWith('batches.toast_delete_success');
    expect(rollback).not.toHaveBeenCalled();
    expect(setError).not.toHaveBeenCalled();
  });

  it('rolls back and sets error on failure', () => {
    const repo = { delete: vi.fn(() => throwError(() => new Error('boom'))) };
    const toast = { success: vi.fn(), error: vi.fn() };
    const i18n = { t: vi.fn((k: string) => k) };

    TestBed.configureTestingModule({
      providers: [
        DeleteBatchUseCase,
        { provide: BatchesRepository, useValue: repo },
        { provide: GhToastService, useValue: toast },
        { provide: TranslationService, useValue: i18n },
      ],
    });

    const useCase = TestBed.inject(DeleteBatchUseCase);
    const previousItems = [mockBatch];
    const applyOptimisticDelete = vi.fn();
    const rollback = vi.fn();
    const setError = vi.fn();
    const closeModal = vi.fn();

    useCase.execute({
      destroyRef: destroyRefStub,
      item: mockBatch,
      previousItems,
      applyOptimisticDelete,
      rollback,
      setError,
      closeModal,
    });

    expect(rollback).toHaveBeenCalledWith(previousItems);
    expect(setError).toHaveBeenCalledWith('Failed to delete batch');
    expect(toast.error).toHaveBeenCalledWith('common.error_occurred');
  });
});
