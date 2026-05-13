// libs/analytics/data-access/src/lib/services/dashboard.facade.ts
import { Injectable, inject, signal } from '@angular/core';
import { DashboardRepository } from './dashboard.repository';
import { DashboardData } from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardFacade {
  readonly #repo = inject(DashboardRepository);

  readonly #data = signal<DashboardData | null>(null);
  readonly #isLoading = signal<boolean>(false);

  readonly data = this.#data.asReadonly();
  readonly isLoading = this.#isLoading.asReadonly();

  loadDashboard(): void {
    this.#isLoading.set(true);
    this.#repo.getDashboardData().subscribe({
      next: (res) => {
        this.#data.set(res);
        this.#isLoading.set(false);
      },
      error: () => this.#isLoading.set(false)
    });
  }
}





