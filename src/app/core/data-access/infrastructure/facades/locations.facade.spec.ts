import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { LocationsFacade } from './locations.facade';
import { LocationsRepository } from '../repositories/locations.repository';
import type { LocationRow } from '../models/location.model';

describe('LocationsFacade', () => {
  it('loads rows from repository on loadAll', () => {
    const row: LocationRow = {
      id: '1',
      name: 'HQ',
      address: 'Main',
      unitsCount: 0,
      totalCapacity: 100,
      status: 'active',
    };
    const repo = {
      getAll: vi.fn(() =>
        of({
          items: [row],
          totalCount: 1,
          pageNumber: 1,
          pageSize: 50,
          totalPages: 1,
        })
      ),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [LocationsFacade, { provide: LocationsRepository, useValue: repo }],
    });

    const facade = TestBed.inject(LocationsFacade);
    facade.loadAll();
    expect(repo.getAll).toHaveBeenCalledTimes(1);
    expect(facade.items()).toEqual([row]);
    expect(facade.isLoading()).toBe(false);
  });
});
