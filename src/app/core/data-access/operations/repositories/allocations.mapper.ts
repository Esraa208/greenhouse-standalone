import type { ApiDistributionItem } from '@app/core/data-access/api';
import type { AllocationRow, AllocationStatus } from '../models/allocation.model';

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

function resolveLayerLabel(api: ApiDistributionItem): string {
  const count = api.layerCount;
  if (count != null && count > 0) {
    return String(count);
  }
  const name = (api.layerName ?? '').trim();
  if (name) return name;
  return (api.pipeName ?? '').trim();
}

export function mapDistributionToRow(dist: ApiDistributionItem): AllocationRow {
  const quantity = dist.quantity ?? 0;
  const allocatedDate = dist.creationDate?.trim() || new Date().toISOString();

  return {
    id: String(dist.id),
    batchNumber: dist.stockBatchNumber || `BTH-${dist.stockBatchId}`,
    batchId: String(dist.stockBatchId),
    cropType: (dist.cropType ?? '').trim(),
    location: (dist.locationName ?? '').trim(),
    greenhouse: (dist.unitName ?? '').trim(),
    zone: (dist.zoneName ?? '').trim(),
    system: (dist.systemName ?? '').trim(),
    layer: resolveLayerLabel(dist),
    layerPosition: dist.layerCount ?? 0,
    pipeId: String(dist.pipeId),
    pipe: (dist.pipeName ?? '').trim(),
    quantity,
    initialQuantity: dist.initialQuantity ?? quantity,
    allocatedDate,
    status: mapAllocationStatus(dist.status),
    movementHistory: [],
    lossHistory: [],
  };
}
