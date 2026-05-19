/* libs/operations/data-access/src/lib/models/allocation.model.ts */

export type AllocationStatus = 'active' | 'moved' | 'harvested';
export type MovementAction = 'allocated' | 'moved' | 'harvested';
export type LossTypeRef = 'disease' | 'pest' | 'weather' | 'other';

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
  readonly layerPosition: number;
  readonly pipeId: string;
  readonly pipe: string;
  readonly quantity: number;
  readonly initialQuantity: number;
  readonly allocatedDate: string;
  readonly status: AllocationStatus;
  readonly movementHistory: readonly MovementRecord[];
  readonly lossHistory: readonly LossRecord[];
}

// Derived counts (computed in facade, NOT stored)
// movementCount = row.movementHistory.length
// lossCount     = row.lossHistory.length

export type AllocationSortKey =
  | 'date-desc' | 'date-asc'
  | 'quantity-desc' | 'quantity-asc'
  | 'batch-asc' | 'batch-desc';

export interface AllocationFilters {
  searchQuery: string;
  status: AllocationStatus | 'all';
  batchNumber: string; // '' = all batches (client filter)
  locationId: string | 'all';
  greenhouseId: string | 'all';
  zoneId: string | 'all';
  systemId: string | 'all';
  layerId: string | 'all';
  pipeId: string | 'all';
  sortBy: AllocationSortKey;
}

export const DEFAULT_ALLOCATION_FILTERS: AllocationFilters = {
  searchQuery: '',
  status: 'all',
  batchNumber: '',
  locationId: 'all',
  greenhouseId: 'all',
  zoneId: 'all',
  systemId: 'all',
  layerId: 'all',
  pipeId: 'all',
  sortBy: 'date-desc',
};

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
  targetLayerId: string;
  quantity: number;
}

export interface RecordAllocationLossDto {
  allocationId: string;
  lossType: LossTypeRef;
  date: string;
  quantity: number;
  reason: string;
  notes?: string;
}





