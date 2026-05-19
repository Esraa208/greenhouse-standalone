export type BatchStatus = 'active' | 'harvested' | 'lost';

/** Growth phases shown in the table (شتلات → حصاد). */
export type BatchGrowthStageKey = 'seedlings' | 'early' | 'vegetative' | 'harvest';

export interface BatchRow {
  readonly id: string;
  readonly batchNumber: string;
  readonly name: string;
  readonly cropType: string;
  readonly cropTypeId: string;
  readonly quantity: number;
  readonly initialQuantity: number;
  readonly plantingDate: string;
  readonly expectedHarvestDate: string;
  readonly growthDuration: number;
  readonly daysPassed: number;
  readonly growthStageKey: BatchGrowthStageKey;
  /** 0–100 for progress bar (from `growthRate` or derived). */
  readonly growthPercent: number;
  readonly status: 'active' | 'harvested' | 'lost';
  /** Combined label for the table column. */
  readonly locationName?: string;
  readonly locationSite?: string;
  readonly greenhouseName?: string;
  readonly zoneName?: string;
  readonly lossesCount: number;
  readonly lossesPercentage: number;
  readonly pipeName?: string;
  readonly pipeId?: string;
}

export type BatchSortKey =
  | 'name-asc' | 'name-desc'
  | 'date-desc' | 'date-asc'
  | 'quantity-desc' | 'quantity-asc'
  | 'progress-desc' | 'progress-asc';

export interface BatchFilters {
  searchQuery: string;
  status: 'all' | 'active' | 'harvested' | 'lost';
  cropTypeId: string;
  sortBy: string;
}

export const DEFAULT_BATCH_FILTERS: BatchFilters = {
  searchQuery: '',
  status: 'all',
  cropTypeId: '',
  sortBy: 'all',
};

export const BATCH_SORT_OPTIONS = [
  { value: 'name-asc', translationKey: 'sort.name_asc' },
  { value: 'name-desc', translationKey: 'sort.name_desc' },
  { value: 'date-desc', translationKey: 'sort.date_newest' },
  { value: 'date-asc', translationKey: 'sort.date_oldest' },
  { value: 'quantity-desc', translationKey: 'sort.quantity_desc' },
  { value: 'quantity-asc', translationKey: 'sort.quantity_asc' },
  { value: 'progress-desc', translationKey: 'sort.progress_nearest' },
  { value: 'progress-asc', translationKey: 'sort.progress_farthest' },
] as const;

/** Per-layer planting allocation when creating a batch (wizard step 4). */
export interface BatchLayerAllocation {
  layerId: string;
  quantity: number;
}

export interface CreateBatchDto {
  name: string;
  cropTypeId: string;
  /** Total plants — should match sum of `layers[].quantity`. */
  quantity: number;
  layers: readonly BatchLayerAllocation[];
}

export interface UpdateBatchDto {
  cropTypeId: string;
  quantity: number;
  status: 'active' | 'harvested' | 'lost';
}
