export const environment = {
  production: true,
  apiUrl: 'https://greenhouseapis.shipsync.it.com/api',
  /** `mock`: fixtures in repositories suitable for demos; `live`: HTTP (see repository branches per API). */
  dataMode: 'live' as 'live' | 'mock',
  /**
   * When `false`, `AnalyticsReportsRepository` serves embedded summaries/cost matrix (safe default).
   * Set `true` after wiring `HttpClient` in that repository to the real reporting API.
   */
  analyticsReportsUseHttp: false,
};
