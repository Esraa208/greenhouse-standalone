/* libs/operations/data-access/src/lib/models/allocation.model.ts */

export type AllocationStatus = 'active' | 'moved' | 'harvested';
export type MovementAction = 'allocated' | 'moved' | 'harvested';
import type { LossType } from '../utils/loss-type.util';

export type LossTypeRef = LossType;

export interface MovementLocation {
  readonly location: string;
  readonly greenhouse: string;
  readonly zone: string;
  readonly system: string;
  readonly layer: string;
}

export interface MovementRecord {
  readonly date: string;
  readonly quantity: number;
  readonly action: MovementAction;
  readonly from?: MovementLocation;
  readonly to: MovementLocation;
}

export interface LossRecord {
  readonly id: string;
  readonly date: string;
  readonly lossType: LossTypeRef;
  readonly lossTypeLabel?: string;
  readonly quantity: number;
  readonly reason: string;
  readonly notes?: string;
  readonly recordedBy?: string;
}

export interface AllocationRow {
  readonly id: string;
  readonly batchNumber: string;
  readonly batchId: string;
  readonly cropType: string;
  readonly location: string;
  readonly greenhouse: string;
  readonly zone: string;
  readonly system: string;
  readonly layer: string;
  readonly layerId: string;
  readonly layerPosition: number;
  readonly layerCapacity?: number;
  readonly pipeId: string;
  readonly pipe: string;
  readonly quantity: number;
  readonly initialQuantity: number;
  readonly growthDuration: number;
  readonly daysSincePlanting: number;
  readonly daysInHousing: number;
  readonly cropTypeId?: string;
  readonly allocatedDate: string;
  readonly status: AllocationStatus;
  readonly statusLabel?: string;
  /** From API `moveCount` */
  readonly movementCount: number;
  /** From API `lossCount` */
  readonly lossCount: number;
  readonly movementHistory: readonly MovementRecord[];
  readonly lossHistory: readonly LossRecord[];
}

export type AllocationSortKey =
  | 'date-desc' | 'date-asc'
  | 'quantity-desc' | 'quantity-asc'
  | 'batch-asc' | 'batch-desc';

export interface AllocationFilters {
  searchQuery: string;
  status: AllocationStatus | 'all';
  stockBatchId: string;
  locationId: string | 'all';
  greenhouseId: string | 'all';
  zoneId: string | 'all';
  systemId: string | 'all';
  layerId: string | 'all';
  pipeId: string | 'all';
  /** `'all'` = no server sort (only `PageNumber` sent). */
  sortBy: AllocationSortKey | 'all';
}

export const DEFAULT_ALLOCATION_FILTERS: AllocationFilters = {
  searchQuery: '',
  status: 'all',
  stockBatchId: '',
  locationId: 'all',
  greenhouseId: 'all',
  zoneId: 'all',
  systemId: 'all',
  layerId: 'all',
  pipeId: 'all',
  sortBy: 'all',
};

/** Maps UI status filter → API `Status` for BatchDistribution/fetch. */
export function mapAllocationStatusParam(
  status: AllocationStatus | 'all',
): string | undefined {
  if (status === 'all') return undefined;
  return status;
}

/** Maps UI sort keys → API `SetOrder` values for BatchDistribution/fetch. */
export function mapAllocationSetOrder(
  sortBy: AllocationSortKey | 'all',
): string | undefined {
  if (!sortBy || sortBy === 'all') return undefined;
  const map: Record<AllocationSortKey, string> = {
    'date-desc': 'newest',
    'date-asc': 'oldest',
    'quantity-desc': 'quantityDesc',
    'quantity-asc': 'quantityAsc',
    'batch-asc': 'asc',
    'batch-desc': 'desc',
  };
  return map[sortBy];
}

export const ALLOCATION_SORT_OPTIONS = [
  { value: 'date-desc',     translationKey: 'sort.date_newest'    },
  { value: 'date-asc',      translationKey: 'sort.date_oldest'    },
  { value: 'quantity-desc', translationKey: 'sort.quantity_desc'  },
  { value: 'quantity-asc',  translationKey: 'sort.quantity_asc'   },
  { value: 'batch-asc',     translationKey: 'sort.batch_asc'      },
  { value: 'batch-desc',    translationKey: 'sort.batch_desc'     },
] as const;

export interface MoveAllocationDto {
  allocationId: string;
  batchId: string;
  targetLayerId: string;
  quantity: number;
}

export interface RecordAllocationLossDto {
  allocationId: string;
  layerId?: string;
  lossType: LossTypeRef;
  date: string;
  quantity: number;
  reason: string;
  notes?: string;
}





