import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { InvoicesFacade } from './invoices.facade';
import { InvoicesRepository } from '../repositories/invoices.repository';
import { CustomersRepository } from '../repositories/customers.repository';
import type { InvoiceRow } from '../models/invoice.model';

describe('InvoicesFacade', () => {
  it('loads invoices from repository on enterPage', () => {
    const rows: InvoiceRow[] = [
      {
        id: 'i1',
        invoiceNumber: 'INV-1',
        customerId: 'c1',
        customerName: 'Acme',
        customerPhone: '01012345678',
        items: [],
        total: 100,
        invoiceDate: '2024-01-01',
        dueDate: '2024-02-01',
        isPaid: false,
        status: 'pending',
        pieceCount: 0,
        grossWeightKg: 0,
        netWeightKg: 0,
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
        }),
      ),
      markAsPaid: vi.fn(),
    };
    const customersRepo = {
      fetchSelectPage: vi.fn(() => of([])),
    };

    TestBed.configureTestingModule({
      providers: [
        InvoicesFacade,
        { provide: InvoicesRepository, useValue: repo },
        { provide: CustomersRepository, useValue: customersRepo },
      ],
    });

    const facade = TestBed.inject(InvoicesFacade);
    facade.enterPage();
    expect(repo.getAll).toHaveBeenCalledTimes(1);
    expect(facade.filteredItems()).toEqual(rows);
    expect(facade.isLoading()).toBe(false);
  });
});
