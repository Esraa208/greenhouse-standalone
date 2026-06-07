import type { ApiLocationStatus, ApiUnitOccupancy, ApiUnitLocationRef } from '@app/core/models/api-types';

/** Nested `{ id, name }` on fetch items (location, unit, zone, system, …). */
export type ApiEntityRef = ApiUnitLocationRef;

export function apiRefId(
  ref?: ApiEntityRef | null,
  legacy?: number | string | null
): string {
  const id = ref?.id ?? legacy;
  if (id == null || id === '') return '';
  return String(id);
}

export function apiRefName(
  ref?: ApiEntityRef | null,
  legacy?: string | null
): string {
  return ref?.name ?? legacy ?? '';
}

export function mapApiEntityStatus(
  status?: ApiLocationStatus | null,
  legacyActive?: boolean
): 'active' | 'inactive' {
  const isActive = status?.isActive ?? legacyActive ?? true;
  return isActive ? 'active' : 'inactive';
}

export function readApiOccupancy(
  occ?: ApiUnitOccupancy | null,
  legacy?: {
    readonly totalCapacity?: number;
    readonly used?: number;
    readonly percent?: number;
  }
): { totalCapacity: number; used: number; percent?: number } {
  return {
    totalCapacity: occ?.totalCapacity ?? legacy?.totalCapacity ?? 0,
    used: occ?.used ?? legacy?.used ?? 0,
    percent: occ?.percent ?? legacy?.percent,
  };
}
