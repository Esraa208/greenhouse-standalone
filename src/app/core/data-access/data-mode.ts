import { environment } from '../../../environments/environment';

export type AppDataMode = 'live' | 'mock';

/** Single switch for repositories that honour `environment.dataMode` (extend per-domain as APIs land). */
export function getAppDataMode(): AppDataMode {
  return environment.dataMode ?? 'live';
}

export function useMockRepositories(): boolean {
  return getAppDataMode() === 'mock';
}

/**
 * Analytics reports UI: keep **fixture data** until `environment.analyticsReportsUseHttp === true`
 * and the HTTP branch is implemented — avoids blank tables under `live` dataMode.
 */
export function useAnalyticsReportsFixtures(): boolean {
  return environment.analyticsReportsUseHttp !== true;
}
