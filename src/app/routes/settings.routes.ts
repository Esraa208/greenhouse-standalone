import type { Routes } from '@angular/router';

export const settingsRoutes: Routes = [
  {
    path: 'settings',
    loadComponent: () =>
      import('@app/features/settings/feature-settings').then((m) => m.SettingsPageComponent),
  },
];
