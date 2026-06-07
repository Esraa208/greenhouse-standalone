import type { ApiDistributionItem } from '@app/core/data-access/api';
import type { AllocationRow, AllocationStatus } from '../models/allocation.model';
import { normalizeGreenhouseLabel } from '@app/shared/utils/normalize-greenhouse-label';

/** Maps API status text (Arabic/English) to domain allocation status. */
export function mapAllocationStatus(raw?: string | null): AllocationStatus {
  const label = (raw ?? '').trim().toLowerCase();
  if (label.includes('حصاد') || label.includes('harvest') || label.includes('محصود')) {
    return 'harvested';
  }
  if (label.includes('نقل') || label.includes('mov')) {
    return 'moved';
  }
  if (label.includes('نشط') || label.includes('active')) {
    return 'active';
  }
  return 'active';
}

function readPlacement(api: ApiDistributionItem) {
  return {
    location: (api.placement?.locationName ?? api.locationName ?? '').trim(),
    unit: normalizeGreenhouseLabel(api.placement?.unitName ?? api.unitName ?? ''),
    zone: (api.placement?.zoneName ?? api.zoneName ?? '').trim(),
    system: (api.placement?.systemName ?? api.systemName ?? '').trim(),
    layer: (api.placement?.layerName ?? api.layerName ?? '').trim(),
    layerCapacity: api.placement?.layerCapacity,
  };
}

function resolveLayerLabel(api: ApiDistributionItem, layerName: string): string {
  if (layerName) return layerName;
  const count = api.layerCount;
  if (count != null && count > 0) return String(count);
  return (api.pipeName ?? '').trim();
}

export function mapDistributionToRow(dist: ApiDistributionItem): AllocationRow {
  const placement = readPlacement(dist);
  const quantity = dist.plants?.quantity ?? dist.quantity ?? 0;
  const allocatedDate =
    dist.housing?.createdDate?.trim() ||
    dist.creationDate?.trim() ||
    new Date().toISOString();
  const batchNumber =
    dist.batch?.batchNumber?.trim() ||
    dist.stockBatchNumber?.trim() ||
    (dist.stockBatchId != null ? `BTH-${dist.stockBatchId}` : `BTH-${dist.id}`);
  const cropType =
    dist.batch?.cropType?.name?.trim() ?? (dist.cropType ?? '').trim();
  const statusRaw = dist.batch?.status ?? dist.status;

  return {
    id: String(dist.id),
    batchNumber,
    batchId: String(dist.stockBatchId ?? dist.id),
    cropType,
    cropTypeId:
      dist.batch?.cropType?.id != null ? String(dist.batch.cropType.id) : undefined,
    location: placement.location,
    greenhouse: placement.unit,
    zone: placement.zone,
    system: placement.system,
    layer: resolveLayerLabel(dist, placement.layer),
    layerId: dist.layerId != null ? String(dist.layerId) : '',
    layerPosition: dist.layerCount ?? 0,
    layerCapacity: placement.layerCapacity,
    pipeId: dist.pipeId != null ? String(dist.pipeId) : '',
    pipe: (dist.pipeName ?? '').trim(),
    quantity,
    initialQuantity: dist.initialQuantity ?? quantity,
    growthDuration: dist.batch?.growthDuration ?? dist.growthDuration ?? 0,
    daysSincePlanting: dist.batch?.daysSincePlanting ?? dist.daysPassed ?? 0,
    daysInHousing: dist.housing?.daysInHousing ?? 0,
    allocatedDate,
    status: mapAllocationStatus(statusRaw),
    statusLabel: statusRaw?.trim() || undefined,
    movementCount: dist.activity?.moveCount ?? dist.moveCount ?? 0,
    lossCount: dist.activity?.lossCount ?? dist.lossCount ?? 0,
    movementHistory: [],
    lossHistory: [],
  };
}
