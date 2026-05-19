import type { ApiBatchHistoryItem } from '@app/core/data-access/api';
import type { StockHistoryEntry, StockHistoryLocation } from '../models/batch-history.model';
import { StockActionType, isTransferLikeAction } from '../models/stock-action-type';

function layerLabel(api: {
  layerName?: string;
  layerCount?: number;
}): string {
  const name = (api.layerName ?? '').trim();
  if (name) return name;
  const count = api.layerCount;
  if (count != null && count > 0) return String(count);
  return '';
}

function mapSide(
  api: ApiBatchHistoryItem,
  side: 'from' | 'to' | 'primary',
): StockHistoryLocation {
  if (side === 'from') {
    return {
      location: (api.fromLocationName ?? '').trim(),
      greenhouse: (api.fromUnitName ?? '').trim(),
      zone: (api.fromZoneName ?? '').trim(),
      system: (api.fromSystemName ?? '').trim(),
      layerLabel: layerLabel({
        layerName: api.fromLayerName,
        layerCount: api.fromLayerCount,
      }),
    };
  }
  if (side === 'to') {
    return {
      location: (api.toLocationName ?? '').trim(),
      greenhouse: (api.toUnitName ?? '').trim(),
      zone: (api.toZoneName ?? '').trim(),
      system: (api.toSystemName ?? '').trim(),
      layerLabel: layerLabel({
        layerName: api.toLayerName,
        layerCount: api.toLayerCount,
      }),
    };
  }
  return {
    location: (api.locationName ?? '').trim(),
    greenhouse: (api.unitName ?? '').trim(),
    zone: (api.zoneName ?? '').trim(),
    system: (api.systemName ?? '').trim(),
    layerLabel: layerLabel(api),
  };
}

export function mapBatchHistoryItem(api: ApiBatchHistoryItem): StockHistoryEntry {
  const actionType = (api.actionType ?? StockActionType.AddStock) as StockActionType;
  const date = (api.creationDate ?? api.date ?? '').trim() || new Date().toISOString();
  const quantity = api.quantity ?? 0;
  const primary = mapSide(api, 'primary');

  if (isTransferLikeAction(actionType)) {
    const from = mapSide(api, 'from');
    const to = mapSide(api, 'to');
    const hasFrom = Boolean(from.location || from.zone || from.system);
    const hasTo = Boolean(to.location || to.zone || to.system);
    return {
      id: String(api.id ?? `${date}-${actionType}`),
      actionType,
      date,
      quantity,
      from: hasFrom ? from : undefined,
      to: hasTo ? to : primary,
    };
  }

  return {
    id: String(api.id ?? `${date}-${actionType}`),
    actionType,
    date,
    quantity,
    to: primary,
  };
}
