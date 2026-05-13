/* libs/operations/data-access/src/lib/models/batch.model.ts */

/** Possible statuses for a planting batch */
export type BatchStatus = 'active' | 'harvested' | 'lost';

export type GrowthStage =
  | 'seedlings'
  | 'vegetative'
  | 'early_maturity'
  | 'late_maturity'
  | 'overdue';

/**
 * Domain interface for a planting Batch record.
 */
export interface BatchRow {
  readonly id: string;
  readonly batchNumber: string;
  readonly cropType: string;
  readonly cropTypeId: string;
  readonly location: string;
  readonly greenhouse: string;
  readonly locationId: string;
  readonly greenhouseId: string;
  readonly quantity: number;
  readonly initialQuantity: number;
  readonly plantingDate: string;          // ISO string
  readonly growthDurationDays: number;
  readonly status: BatchStatus;
  readonly allocationsCount: number;
  readonly totalLosses: number;
  readonly notes?: string;

  // Legacy fields kept for backwards compat
  readonly plantedDate?: string;
  readonly expectedHarvestDate?: string;
  readonly zone?: string;
  readonly growthStage?: string;
  readonly daysElapsed?: number;
  readonly totalDays?: number;
}

/** Sorting options for the Batch list */
export type BatchSortKey =
  | 'date-desc'
  | 'date-asc'
  | 'quantity-desc'
  | 'quantity-asc'
  | 'progress-desc'
  | 'progress-asc';

/**
 * Filter state for Batches page.
 */
export interface BatchFilters {
  searchQuery: string;
  status: BatchStatus | 'all';
  cropType: string; // '' maps to all types
  sortBy: BatchSortKey;
}

/** Initial filter state */
export const DEFAULT_BATCH_FILTERS: BatchFilters = {
  searchQuery: '',
  status: 'all',
  cropType: '',
  sortBy: 'date-desc',
};

/** Sorting configuration for the Batch UI */
export const BATCH_SORT_OPTIONS = [
  { value: 'date-desc',     translationKey: 'sort.date_newest'    },
  { value: 'date-asc',      translationKey: 'sort.date_oldest'    },
  { value: 'quantity-desc', translationKey: 'sort.quantity_desc'  },
  { value: 'quantity-asc',  translationKey: 'sort.quantity_asc'   },
  { value: 'progress-desc', translationKey: 'sort.progress_desc'  },
  { value: 'progress-asc',  translationKey: 'sort.progress_asc'   },
] as const;

/** DTO for initiating a new planting batch */
export interface CreateBatchDto {
  cropTypeId: string;
  quantity: number;
  plantedDate: string;
  locationId: string;
  greenhouseId: string;
  zoneId: string;
  pipeId: string;
}






