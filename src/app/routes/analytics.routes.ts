import type { Routes } from '@angular/router';

export const analyticsRoutes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () =>
      import('@app/features/analytics/feature-dashboard').then((m) => m.DashboardPageComponent),
  },
  {
    path: 'reports',
    loadComponent: () =>
      import('@app/features/analytics/feature-reports').then((m) => m.ReportsPageComponent),
  },
];
