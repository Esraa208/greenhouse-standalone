import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { LoadAllocationReferencesUseCase } from './load-allocation-references.use-case';
import { AllocationsRepository } from '../repositories/allocations.repository';

describe('LoadAllocationReferencesUseCase', () => {
  const destroyRefStub = { onDestroy: () => {} } as any;

  it('loads all references and applies setters', () => {
    const repo = {
      getRefLocations: vi.fn(() => of([{ id: '1', name: 'L1' }])),
      getRefGreenhouses: vi.fn(() => of([{ id: '2', name: 'G1', locationId: '1' }])),
      getRefZones: vi.fn(() => of([{ id: '3', name: 'Z1', greenhouseId: '2' }])),
      getRefSystems: vi.fn(() => of([{ id: '4', name: 'S1', zoneId: '3' }])),
      getRefLayers: vi.fn(() => of([{ id: '5', name: 'LY1', systemId: '4' }])),
      getRefPipes: vi.fn(() => of([{ id: '6', name: 'P1', layerId: '5' }])),
    };

    TestBed.configureTestingModule({
      providers: [
        LoadAllocationReferencesUseCase,
        { provide: AllocationsRepository, useValue: repo },
      ],
    });

    const useCase = TestBed.inject(LoadAllocationReferencesUseCase);
    const setLocations = vi.fn();
    const setGreenhouses = vi.fn();
    const setZones = vi.fn();
    const setSystems = vi.fn();
    const setLayers = vi.fn();
    const setPipes = vi.fn();
    const setError = vi.fn();

    useCase.execute({
      destroyRef: destroyRefStub,
      setLocations,
      setGreenhouses,
      setZones,
      setSystems,
      setLayers,
      setPipes,
      setError,
    });

    expect(setLocations).toHaveBeenCalledWith([{ id: '1', name: 'L1' }]);
    expect(setGreenhouses).toHaveBeenCalledWith([{ id: '2', name: 'G1', locationId: '1' }]);
    expect(setZones).toHaveBeenCalledWith([{ id: '3', name: 'Z1', greenhouseId: '2' }]);
    expect(setSystems).toHaveBeenCalledWith([{ id: '4', name: 'S1', zoneId: '3' }]);
    expect(setLayers).toHaveBeenCalledWith([{ id: '5', name: 'LY1', systemId: '4' }]);
    expect(setPipes).toHaveBeenCalledWith([{ id: '6', name: 'P1', layerId: '5' }]);
    expect(setError).not.toHaveBeenCalled();
  });

  it('sets normalized error message when loading fails', () => {
    const repo = {
      getRefLocations: vi.fn(() => throwError(() => ({ code: 0, message: 'Load refs failed' }))),
      getRefGreenhouses: vi.fn(() => of([])),
      getRefZones: vi.fn(() => of([])),
      getRefSystems: vi.fn(() => of([])),
      getRefLayers: vi.fn(() => of([])),
      getRefPipes: vi.fn(() => of([])),
    };

    TestBed.configureTestingModule({
      providers: [
        LoadAllocationReferencesUseCase,
        { provide: AllocationsRepository, useValue: repo },
      ],
    });

    const useCase = TestBed.inject(LoadAllocationReferencesUseCase);
    const setError = vi.fn();

    useCase.execute({
      destroyRef: destroyRefStub,
      setLocations: vi.fn(),
      setGreenhouses: vi.fn(),
      setZones: vi.fn(),
      setSystems: vi.fn(),
      setLayers: vi.fn(),
      setPipes: vi.fn(),
      setError,
    });

    expect(setError).toHaveBeenCalledWith('Load refs failed');
  });
});
