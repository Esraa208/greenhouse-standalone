import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { RecordAllocationLossUseCase } from './record-allocation-loss.use-case';
import { AllocationsRepository } from '../repositories/allocations.repository';
import { GhToastService } from '@app/core';
import { TranslationService } from '@app/core';
import {
  AllocationRow,
  RecordAllocationLossDto,
} from '../models/allocation.model';

describe('RecordAllocationLossUseCase', () => {
  const destroyRefStub = { onDestroy: () => {} } as any;

  const mockAllocation: AllocationRow = {
    id: 'a1',
    batchNumber: 'B-001',
    batchId: 'b1',
    cropType: 'Lettuce',
    location: 'Loc A',
    greenhouse: 'GH A',
    zone: 'Zone 1',
    system: 'NFT',
    layer: 'Layer 1',
    layerPosition: 1,
    pipe: 'P-1',
    quantity: 20,
    initialQuantity: 20,
    allocatedDate: new Date().toISOString(),
    status: 'active',
    movementHistory: [],
    lossHistory: [],
  };

  const dto: RecordAllocationLossDto = {
    allocationId: 'a1',
    lossType: 'disease',
    date: new Date().toISOString(),
    quantity: 3,
    reason: 'test',
  };

  it('applies optimistic loss and commits updated row on success', () => {
    const updated = { ...mockAllocation, quantity: 17 };
    const repo = { recordLoss: vi.fn(() => of(updated)) };
    const toast = { success: vi.fn(), error: vi.fn() };
    const i18n = { t: vi.fn((k: string) => k) };

    TestBed.configureTestingModule({
      providers: [
        RecordAllocationLossUseCase,
        { provide: AllocationsRepository, useValue: repo },
        { provide: GhToastService, useValue: toast },
        { provide: TranslationService, useValue: i18n },
      ],
    });

    const useCase = TestBed.inject(RecordAllocationLossUseCase);
    const closeModal = vi.fn();
    const applyOptimisticLoss = vi.fn();
    const commit = vi.fn();
    const rollback = vi.fn();
    const snapshot = [mockAllocation];

    useCase.execute({
      destroyRef: destroyRefStub,
      item: mockAllocation,
      dto,
      closeModal,
      snapshot,
      applyOptimisticLoss,
      commit,
      rollback,
    });

    expect(applyOptimisticLoss).toHaveBeenCalledWith('a1', 3);
    expect(closeModal).toHaveBeenCalled();
    expect(repo.recordLoss).toHaveBeenCalledWith(dto);
    expect(commit).toHaveBeenCalledWith(updated);
    expect(rollback).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('rolls back snapshot and shows toast on failure', () => {
    const repo = { recordLoss: vi.fn(() => throwError(() => new Error('boom'))) };
    const toast = { success: vi.fn(), error: vi.fn() };
    const i18n = { t: vi.fn((k: string) => k) };

    TestBed.configureTestingModule({
      providers: [
        RecordAllocationLossUseCase,
        { provide: AllocationsRepository, useValue: repo },
        { provide: GhToastService, useValue: toast },
        { provide: TranslationService, useValue: i18n },
      ],
    });

    const useCase = TestBed.inject(RecordAllocationLossUseCase);
    const closeModal = vi.fn();
    const applyOptimisticLoss = vi.fn();
    const commit = vi.fn();
    const rollback = vi.fn();
    const snapshot = [mockAllocation];

    useCase.execute({
      destroyRef: destroyRefStub,
      item: mockAllocation,
      dto,
      closeModal,
      snapshot,
      applyOptimisticLoss,
      commit,
      rollback,
    });

    expect(rollback).toHaveBeenCalledWith(snapshot);
    expect(commit).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('common.error');
  });
});
