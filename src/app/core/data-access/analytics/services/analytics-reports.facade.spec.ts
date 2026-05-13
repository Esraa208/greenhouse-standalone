import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { AnalyticsReportsFacade } from './reports.facade';
import { AnalyticsReportsRepository } from './reports.repository';
import type { CostMatrixEntry, ReportSummary } from './reports.facade';

describe('AnalyticsReportsFacade', () => {
  const summary: ReportSummary = {
    id: 't1',
    category: 'General',
    title: 'Test',
    period: 'March 2024',
    status: 'published',
    totalYield: 100,
    revenue: 1000,
    lossRate: 1,
    netProfit: 100,
    totalProduction: 100,
    totalRevenue: 1000,
    totalCosts: 900,
  };

  const cost: CostMatrixEntry = {
    id: 'c1',
    category: 'Nutrients',
    actual: 100,
    budget: 100,
    variance: 0,
    notes: '',
    month: 'March',
    amount: 100,
  };

  it('load pulls summaries and cost matrix from the repository', () => {
    const repo = {
      getSummaries: vi.fn(() => of([summary])),
      getCostMatrix: vi.fn(() => of([cost])),
    };

    TestBed.configureTestingModule({
      providers: [
        AnalyticsReportsFacade,
        { provide: AnalyticsReportsRepository, useValue: repo },
      ],
    });

    const facade = TestBed.inject(AnalyticsReportsFacade);
    facade.load();

    expect(repo.getSummaries).toHaveBeenCalledTimes(1);
    expect(repo.getCostMatrix).toHaveBeenCalledTimes(1);
    expect(facade.summaries()).toEqual([summary]);
    expect(facade.costMatrix()).toEqual([cost]);
    expect(facade.isLoading()).toBe(false);
  });

  it('setTab updates activeTab signal', () => {
    const repo = {
      getSummaries: vi.fn(() => of([])),
      getCostMatrix: vi.fn(() => of([])),
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        AnalyticsReportsFacade,
        { provide: AnalyticsReportsRepository, useValue: repo },
      ],
    });

    const facade = TestBed.inject(AnalyticsReportsFacade);
    expect(facade.activeTab()).toBe('summary');
    facade.setTab('costs');
    expect(facade.activeTab()).toBe('costs');
  });
});
