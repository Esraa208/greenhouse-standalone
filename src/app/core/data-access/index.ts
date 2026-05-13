/**
 * Avoid importing from this barrel in application code — it re-exports multiple domains and
 * hurts tree-shaking clarity.
 *
 * Policy:
 * - Import from the domain entry you need, e.g. `@app/core/data-access/infrastructure`,
 *   `@app/core/data-access/operations`, `@app/core/data-access/sales`,
 *   `@app/core/data-access/analytics`, `@app/core/data-access/settings`.
 * - Services and guards use `@app/core` where re-exported (e.g. `TranslationService`).
 *
 * This file remains as a compatibility shim for any legacy deep imports.
 */
export * from './infrastructure';
export * from './operations';
export * from './sales';
export * from './settings';
