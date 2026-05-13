/**
 * Development: relative base URL so the Angular dev server can proxy requests
 * (see `proxy.conf.json` → avoids browser CORS during `ng serve`).
 *
 * To hit a local backend instead, set `target` in `proxy.conf.json` to e.g.
 * `http://localhost:5000` and keep `apiUrl: '/api'` here.
 */
export const environment = {
  production: false,
  apiUrl: '/api',
  /** `mock`: analytics & other fixture-backed repos return sample data (see `core/data-access/data-mode`). */
  dataMode: 'mock' as 'live' | 'mock',
  /** See root `environment.ts` — keep `false` until reporting HTTP is implemented. */
  analyticsReportsUseHttp: false,
};
