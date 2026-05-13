import {
  CRUD_LIST_PAGE_IMPORTS_STANDARD,
  CRUD_LIST_PAGE_IMPORTS_WITH_PROGRESS,
} from '@app/shared/page-imports';

/** @deprecated Prefer importing from `@app/shared/page-imports` — aliases kept for stable infrastructure paths. */
export const INFRASTRUCTURE_CRUD_PAGE_IMPORTS_BASE = CRUD_LIST_PAGE_IMPORTS_STANDARD;

/** @deprecated Prefer `CRUD_LIST_PAGE_IMPORTS_WITH_PROGRESS` from `@app/shared/page-imports`. */
export const INFRASTRUCTURE_CRUD_PAGE_IMPORTS_WITH_PROGRESS =
  CRUD_LIST_PAGE_IMPORTS_WITH_PROGRESS;
