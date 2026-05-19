/* libs/operations/data-access/src/lib/models/crop.model.ts */

/**
 * Domain interface for a single Crop record in the management system.
 */
export interface CropRow {
  readonly id: string;
  readonly name: string;
  readonly growthDuration: number; // expected days from planting to harvest
  readonly activeBatches: number;
  readonly totalPlants: number;
}

/**
 * Available sorting keys for the Crops list.
 */
export type CropSortKey =
  | 'name-asc'
  | 'name-desc'
  | 'duration-asc'
  | 'duration-desc'
  | 'batches-desc'
  | 'plants-desc';

/**
 * Filtering and sorting state for the Crops page.
 */
export interface CropFilters {
  searchQuery: string;
  /** `'all'` = no server sort (only `PageNumber` sent). */
  sortBy: CropSortKey | 'all';
}

/**
 * Default filter and sort state for initialization and reset.
 */
export const DEFAULT_CROP_FILTERS: CropFilters = {
  searchQuery: '',
  sortBy: 'all',
};

/**
 * Sorting options configuration for UI dropdown selection.
 * Uses translation keys for multilingual support.
 */
export const CROP_SORT_OPTIONS = [
  { value: 'name-asc', translationKey: 'sort.name_asc' },
  { value: 'name-desc', translationKey: 'sort.name_desc' },
  { value: 'duration-asc', translationKey: 'sort.duration_asc' },
  { value: 'batches-desc', translationKey: 'sort.batches_desc' },
  { value: 'plants-desc', translationKey: 'sort.plants_desc' },
] as const;

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
export type UpdateCropDto = CreateCropDto;





