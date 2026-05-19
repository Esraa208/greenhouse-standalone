import type { Routes } from '@angular/router';

export const operationsRoutes: Routes = [
  {
    path: 'batches',
    loadComponent: () =>
      import('@app/features/operations/feature-batches').then((m) => m.BatchesPageComponent),
  },
  {
    path: 'crops',
    loadComponent: () =>
      import('@app/features/operations/feature-crops').then((m) => m.CropsPageComponent),
  },
  {
    path: 'harvest',
    loadComponent: () =>
      import('@app/features/operations/feature-harvest').then((m) => m.HarvestPageComponent),
  },
  {
    path: 'allocations',
    loadComponent: () =>
      import('@app/features/operations/feature-allocations').then((m) => m.AllocationsPageComponent),
  },
  {
    path: 'losses',
    loadComponent: () =>
      import('@app/features/operations/feature-losses').then((m) => m.LossesPageComponent),
  },
  {
    path: 'planting',
    loadComponent: () =>
      import('@app/features/operations/feature-batch-wizard').then((m) => m.BatchWizardPageComponent),
  },
];
