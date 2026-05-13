// libs/analytics/data-access/src/lib/services/dashboard.repository.ts
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { DashboardData } from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardRepository {
  getDashboardData(): Observable<DashboardData> {
    const mockData: DashboardData = {
      metrics: {
        totalProduction: 4500, productionTrend: 12.5,
        activeBatches: 24, batchesTrend: 5,
        lossesKg: 120, lossesTrend: -2.3,
        revenue: 145000, revenueTrend: 8.4
      },
      productionChart: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{ data: [65, 59, 80, 81, 56, 55], label: 'Production (kg)' }]
      },
      zoneChart: {
        labels: ['Zone A', 'Zone B', 'Zone C'],
        datasets: [{ data: [300, 500, 100], label: 'Capacity' }]
      },
      cropChart: {
        labels: ['Lettuce', 'Basil', 'Mint'],
        datasets: [{ data: [60, 25, 15], label: 'Distribution %' }]
      }
    };
    return of(mockData).pipe(delay(500));
  }
}







