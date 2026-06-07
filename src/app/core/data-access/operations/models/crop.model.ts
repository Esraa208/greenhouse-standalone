/* libs/operations/data-access/src/lib/models/crop.model.ts */

import type { ListStatusFilter } from '@app/core/data-access/infrastructure/list-query';
import { SortKey, mapLocationSetOrder, LOCATION_SORT_OPTIONS } from '@app/core/data-access/infrastructure/models/location.model';

/**
 * Domain interface for a single Crop record in the management system.
 */
export interface CropRow {
  readonly id: string;
  readonly name: string;
  readonly growthDuration: number;
  readonly activeBatches: number;
  readonly totalPlants: number;
  /** Total batch count from API `stockBatch`. */
  readonly stockBatch: number;
  readonly status: 'active' | 'inactive';
  readonly statusTitle?: string;
}

/** Same sort keys as infrastructure list pages. */
export type CropSortKey = SortKey;

/**
 * Filtering and sorting state for the Crops page.
 */
export interface CropFilters {
  searchQuery: string;
  status: ListStatusFilter;
  /** `'all'` = no server sort (only `PageNumber` sent). */
  sortBy: CropSortKey | 'all';
}

/**
 * Default filter and sort state for initialization and reset.
 */
export const DEFAULT_CROP_FILTERS: CropFilters = {
  searchQuery: '',
  status: 'all',
  sortBy: 'all',
};

/** Sort dropdown options — aligned with infrastructure pages. */
export const CROP_SORT_OPTIONS = LOCATION_SORT_OPTIONS;

/** Maps UI sort keys to CropType/fetch `SetOrder` query values. */
export function mapCropSetOrder(sortBy: SortKey | 'all'): string | undefined {
  return mapLocationSetOrder(sortBy);
}

/**
 * Data Transfer Object for creating a new crop type.
 */
export interface CreateCropDto {
  name: string;
  growthDuration: number;
}

/**
 * Data Transfer Object for updating an existing crop type.
 */
export interface UpdateCropDto extends CreateCropDto {
  status: 'active' | 'inactive';
}





