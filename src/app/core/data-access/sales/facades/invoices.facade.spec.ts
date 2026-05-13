import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { InvoicesFacade } from './invoices.facade';
import { InvoicesRepository } from '../repositories/invoices.repository';
import type { InvoiceRow } from '../models/invoice.model';

describe('InvoicesFacade', () => {
  it('loads invoices from repository', () => {
    const rows: InvoiceRow[] = [
      {
        id: 'i1',
        invoiceNumber: 'INV-1',
        customerId: 'c1',
        customerName: 'Acme',
        customerPhone: '+1',
        items: [],
        total: 100,
        invoiceDate: '2024-01-01',
        collectionDate: '2024-02-01',
        status: 'paid',
      },
    ];
    const repo = {
      getAll: vi.fn(() => of(rows)),
      markAsPaid: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [InvoicesFacade, { provide: InvoicesRepository, useValue: repo }],
    });

    const facade = TestBed.inject(InvoicesFacade);
    facade.loadAll();
    expect(repo.getAll).toHaveBeenCalledTimes(1);
    expect(facade.items()).toEqual(rows);
    expect(facade.isLoading()).toBe(false);
  });
});
