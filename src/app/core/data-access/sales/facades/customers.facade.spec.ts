import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { CustomersFacade } from './customers.facade';
import { CustomersRepository } from '../repositories/customers.repository';
import type { CustomerRow } from '../models/customer.model';

describe('CustomersFacade', () => {
  it('loads customers from repository', () => {
    const rows: CustomerRow[] = [
      {
        id: 'c1',
        name: 'Acme',
        phone: '0500000000',
        email: '',
        address: '',
        status: 'active',
        invoicesCount: 0,
        totalPurchases: 0,
        createdAt: new Date().toISOString(),
      },
    ];
    const repo = {
      getAll: vi.fn(() =>
        of({
          items: rows,
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
      providers: [CustomersFacade, { provide: CustomersRepository, useValue: repo }],
    });

    const facade = TestBed.inject(CustomersFacade);
    facade.enterPage();
    expect(repo.getAll).toHaveBeenCalledTimes(1);
    expect(facade.items()).toEqual(rows);
    expect(facade.isLoading()).toBe(false);
  });
});
