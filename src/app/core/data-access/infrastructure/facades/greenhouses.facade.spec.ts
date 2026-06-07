import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { GreenhousesFacade } from './greenhouses.facade';
import { GreenhousesRepository } from '../repositories/greenhouses.repository';
import type { GreenhouseRow } from '../models/greenhouse.model';

describe('GreenhousesFacade', () => {
  it('loads rows from repository on loadAll', () => {
    const row: GreenhouseRow = {
      id: '1',
      name: 'GH-A',
      address: 'Site A',
      locationId: 'loc-1',
      locationName: 'HQ',
      totalCapacity: 100,
      zonesCount: 2,
      occupiedCapacity: 40,
      status: 'active',
    };
    const repo = {
      getAll: vi.fn(() => of([row])),
      getByLocation: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [GreenhousesFacade, { provide: GreenhousesRepository, useValue: repo }],
    });

    const facade = TestBed.inject(GreenhousesFacade);
    facade.loadAll();
    expect(repo.getAll).toHaveBeenCalledTimes(1);
    expect(facade.items()).toEqual([row]);
    expect(facade.isLoading()).toBe(false);
  });
});
