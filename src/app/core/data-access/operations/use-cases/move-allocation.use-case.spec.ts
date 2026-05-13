import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MoveAllocationUseCase } from './move-allocation.use-case';
import { AllocationsRepository } from '../repositories/allocations.repository';
import { GhToastService } from '@app/core';
import { TranslationService } from '@app/core';
import { AllocationRow, MoveAllocationDto } from '../models/allocation.model';

describe('MoveAllocationUseCase', () => {
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

  const moveDto: MoveAllocationDto = {
    allocationId: 'a1',
    targetLocation: 'Loc B',
    targetGreenhouse: 'GH B',
    targetZone: 'Zone 2',
    targetSystem: 'DWC',
    targetLayer: 'Layer 2',
    targetPipeId: 'P-2',
    quantity: 10,
  };

  it('applies optimistic move and commits updated row on success', () => {
    const updated = { ...mockAllocation, location: 'Loc B' };
    const repo = { move: vi.fn(() => of(updated)) };
    const toast = { success: vi.fn(), error: vi.fn() };
    const i18n = { t: vi.fn((k: string) => k) };

    TestBed.configureTestingModule({
      providers: [
        MoveAllocationUseCase,
        { provide: AllocationsRepository, useValue: repo },
        { provide: GhToastService, useValue: toast },
        { provide: TranslationService, useValue: i18n },
      ],
    });

    const useCase = TestBed.inject(MoveAllocationUseCase);
    const closeModal = vi.fn();
    const applyOptimisticMove = vi.fn();
    const commit = vi.fn();
    const rollback = vi.fn();

    useCase.execute({
      destroyRef: destroyRefStub,
      item: mockAllocation,
      dto: moveDto,
      closeModal,
      applyOptimisticMove,
      commit,
      rollback,
    });

    expect(applyOptimisticMove).toHaveBeenCalledWith('a1');
    expect(closeModal).toHaveBeenCalled();
    expect(repo.move).toHaveBeenCalledWith(moveDto);
    expect(commit).toHaveBeenCalledWith(updated);
    expect(rollback).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('rolls back original item and shows toast on failure', () => {
    const repo = { move: vi.fn(() => throwError(() => new Error('boom'))) };
    const toast = { success: vi.fn(), error: vi.fn() };
    const i18n = { t: vi.fn((k: string) => k) };

    TestBed.configureTestingModule({
      providers: [
        MoveAllocationUseCase,
        { provide: AllocationsRepository, useValue: repo },
        { provide: GhToastService, useValue: toast },
        { provide: TranslationService, useValue: i18n },
      ],
    });

    const useCase = TestBed.inject(MoveAllocationUseCase);
    const closeModal = vi.fn();
    const applyOptimisticMove = vi.fn();
    const commit = vi.fn();
    const rollback = vi.fn();

    useCase.execute({
      destroyRef: destroyRefStub,
      item: mockAllocation,
      dto: moveDto,
      closeModal,
      applyOptimisticMove,
      commit,
      rollback,
    });

    expect(rollback).toHaveBeenCalledWith(mockAllocation);
    expect(commit).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('common.error');
  });
});
