import type { Routes } from '@angular/router';

export const infrastructureRoutes: Routes = [
  {
    path: 'locations',
    loadComponent: () =>
      import('@app/features/infrastructure/feature-locations').then((m) => m.LocationsPageComponent),
  },
  {
    path: 'greenhouses',
    loadComponent: () =>
      import('@app/features/infrastructure/feature-greenhouses').then((m) => m.GreenhousesPageComponent),
  },
  {
    path: 'zones',
    loadComponent: () =>
      import('@app/features/infrastructure/feature-zones').then((m) => m.ZonesPageComponent),
  },
  {
    path: 'systems',
    loadComponent: () =>
      import('@app/features/infrastructure/feature-systems').then((m) => m.SystemsPageComponent),
  },
  {
    path: 'layers',
    loadComponent: () =>
      import('@app/features/infrastructure/feature-layers').then((m) => m.LayersPageComponent),
  },
  // {
  //   path: 'pipes',
  //   loadComponent: () =>
  //     import('@app/features/infrastructure/feature-pipes').then((m) => m.PipesPageComponent),
  // },
];
