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
  /** API growth stage label (e.g. شتلات) when provided. */
  readonly growthStageLabel?: string;
  /** 0–100+ for progress bar (from API `progressPercent` or derived). */
  readonly growthPercent: number;
  readonly status: 'active' | 'harvested' | 'lost';
  /** API `active` flag — editable independently of growth status. */
  readonly isActive: boolean;
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
  locationId: string;
  unitId: string;
  cropTypeId: string;
  sortBy: string;
}

export const DEFAULT_BATCH_FILTERS: BatchFilters = {
  searchQuery: '',
  status: 'all',
  locationId: 'all',
  unitId: 'all',
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

/** Maps UI sort keys → API `SetOrder` values. */
export function mapBatchSetOrder(sortBy: string): string | undefined {
  if (!sortBy || sortBy === 'all') return undefined;
  const map: Record<string, string> = {
    'date-desc': 'newest',
    'date-asc': 'oldest',
    'quantity-desc': 'quantityDesc',
    'quantity-asc': 'quantityAsc',
    'progress-desc': 'harvestSoon',
    'progress-asc': 'harvestFar',
    'name-asc': 'asc',
    'name-desc': 'desc',
  };
  return map[sortBy];
}

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
  /** Sent unchanged on edit — batch quantity is not editable in the UI. */
  quantity: number;
  isActive: boolean;
  /** Optional label merge after PUT when crop type changes. */
  cropType?: string;
}
