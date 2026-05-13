import type { Routes } from '@angular/router';

export const salesRoutes: Routes = [
  {
    path: 'customers',
    loadComponent: () =>
      import('@app/features/sales/feature-customers').then((m) => m.CustomersPageComponent),
  },
  {
    path: 'invoices',
    loadComponent: () =>
      import('@app/features/sales/feature-invoices').then((m) => m.InvoicesPageComponent),
  },
  {
    path: 'sales-reports',
    loadComponent: () =>
      import('@app/features/sales/feature-reports').then((m) => m.ReportsPageComponent),
  },
];
