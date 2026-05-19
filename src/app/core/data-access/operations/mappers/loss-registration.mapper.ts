import type { AllocationRow } from '../models/allocation.model';
import type {
  LossRegistrationAllocation,
  LossRegistrationBatch,
  LossRegistrationLayer,
} from '../models/loss-registration.model';
import type { LossRefBatch } from '../models/loss.model';

export function toLossRegistrationBatch(
  batch: LossRefBatch,
  layers: readonly LossRegistrationLayer[],
): LossRegistrationBatch {
  return {
    id: batch.id,
    batchNumber: batch.batchNumber,
    cropType: batch.cropType,
    layerCount: layers.length,
    totalQuantity: layers.reduce((sum, l) => sum + l.totalQuantity, 0),
  };
}

export function buildLossLayersFromAllocations(
  rows: readonly AllocationRow[],
): LossRegistrationLayer[] {
  const groups = new Map<string, { layer: LossRegistrationLayer; allocations: LossRegistrationAllocation[] }>();

  for (const row of rows) {
    const layerKey = [
      row.location,
      row.greenhouse,
      row.zone,
      row.system,
      row.layerPosition || row.layer,
    ].join('|');

    const path = [row.location, row.greenhouse, row.zone, row.system]
      .filter(Boolean)
      .join(' • ');

    if (!groups.has(layerKey)) {
      groups.set(layerKey, {
        layer: {
          id: layerKey,
          name: row.layer || row.pipe,
          layerPosition: row.layerPosition,
          path,
          allocationCount: 0,
          totalQuantity: 0,
          allocations: [],
        },
        allocations: [],
      });
    }

    const group = groups.get(layerKey)!;
    const allocation: LossRegistrationAllocation = {
      id: row.id,
      pipeName: row.pipe || row.batchNumber,
      quantity: row.quantity,
    };
    group.allocations.push(allocation);
  }

  return [...groups.values()]
    .map(({ layer, allocations }) => {
      const totalQuantity = allocations.reduce((sum, a) => sum + a.quantity, 0);
      return {
        ...layer,
        allocationCount: allocations.length,
        totalQuantity,
        allocations,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'ar'));
}
