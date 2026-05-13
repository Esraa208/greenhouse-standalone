import { Routes } from '@angular/router';
import { authGuard } from '@app/core';
import {
  analyticsRoutes,
  infrastructureRoutes,
  operationsRoutes,
  salesRoutes,
  settingsRoutes,
} from './routes';

/**
 * Child routes rendered inside `MainLayoutComponent`'s `<router-outlet>`.
 * Parent route applies `authGuard` once for all feature paths.
 *
 * Domain route tables live under `src/app/routes/*.routes.ts`.
 */
const authenticatedRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },
  ...analyticsRoutes,
  ...infrastructureRoutes,
  ...operationsRoutes,
  ...salesRoutes,
  ...settingsRoutes,
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];

export const appRoutes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    children: authenticatedRoutes,
  },
];
