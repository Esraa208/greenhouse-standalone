import type { ApiBatchHistoryItem, ApiHousingHistoryResponse } from '@app/core/data-access/api';
import type { AllocationRow } from '../models/allocation.model';
import type {
  HousingHistoryResult,
  HousingHistorySummary,
  StockHistoryEntry,
  StockHistoryLocation,
} from '../models/batch-history.model';
import { StockActionType, isTransferLikeAction } from '../models/stock-action-type';
import { normalizeGreenhouseLabel } from '@app/shared/utils/normalize-greenhouse-label';
import { mapLossTypeToApi } from '../utils/loss-type.util';
import type { LossType } from '../utils/loss-type.util';
import type {
  ApiHousingHistoryItem,
  ApiHousingHistoryLocation,
  ApiHousingHistorySummary,
} from '@app/core/models/api-types';

const EMPTY_LOC: StockHistoryLocation = {
  location: '',
  greenhouse: '',
  zone: '',
  system: '',
  layerLabel: '',
};

function pickString(...values: (string | null | undefined)[]): string {
  for (const value of values) {
    if (value != null && String(value).trim()) {
      return String(value).trim();
    }
  }
  return '';
}

function optionalPipeName(value: string | null | undefined): string | undefined {
  if (value == null) return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function layerLabel(api: {
  layerName?: string;
  layerCount?: number;
  pipeName?: string;
}): string {
  const name = (api.layerName ?? '').trim();
  if (name) return name;
  const count = api.layerCount;
  if (count != null && count > 0) return String(count);
  const pipe = (api.pipeName ?? '').trim();
  if (pipe) return pipe;
  return '';
}

function mapSide(
  api: ApiBatchHistoryItem,
  side: 'from' | 'to' | 'primary',
): StockHistoryLocation {
  if (side === 'from') {
    return {
      location: pickString(api.fromLocationName, api.fromlocationName),
      greenhouse: normalizeGreenhouseLabel(pickString(api.fromUnitName)),
      zone: pickString(api.fromZoneName),
      system: pickString(api.fromSystemName),
      layerLabel: layerLabel({
        layerName: api.fromLayerName,
        layerCount: api.fromLayerCount,
        pipeName: optionalPipeName(api.fromPipeName),
      }),
    };
  }
  if (side === 'to') {
    return {
      location: pickString(api.toLocationName),
      greenhouse: normalizeGreenhouseLabel(pickString(api.toUnitName)),
      zone: pickString(api.toZoneName),
      system: pickString(api.toSystemName),
      layerLabel: layerLabel({
        layerName: api.toLayerName,
        layerCount: api.toLayerCount,
        pipeName: optionalPipeName(api.toPipeName),
      }),
    };
  }
  return {
    location: pickString(api.locationName),
    greenhouse: normalizeGreenhouseLabel(pickString(api.unitName)),
    zone: pickString(api.zoneName),
    system: pickString(api.systemName),
    layerLabel: layerLabel(api),
  };
}

function hasLocationData(loc: StockHistoryLocation): boolean {
  return Boolean(
    loc.location || loc.greenhouse || loc.zone || loc.system || loc.layerLabel,
  );
}

function parseActionType(value: number | string | undefined | null): StockActionType {
  if (value === undefined || value === null || value === '') {
    return StockActionType.AddStock;
  }
  if (typeof value === 'number') {
    if (value >= StockActionType.AddStock && value <= StockActionType.Loss) {
      return value;
    }
    return StockActionType.AddStock;
  }
  const str = String(value).trim();
  const num = Number(str);
  if (!Number.isNaN(num) && num >= StockActionType.AddStock && num <= StockActionType.Loss) {
    return num as StockActionType;
  }
  switch (str.toLowerCase()) {
    case 'addstock':
    case 'add':
      return StockActionType.AddStock;
    case 'removestock':
    case 'remove':
      return StockActionType.RemoveStock;
    case 'transferstock':
    case 'transfer':
      return StockActionType.TransferStock;
    case 'mergestock':
    case 'merge':
      return StockActionType.MergeStock;
    case 'harveststock':
    case 'harvest':
      return StockActionType.HarvestStock;
    case 'loss':
      return StockActionType.Loss;
    default:
      return StockActionType.AddStock;
  }
}

function normalizeLossType(value: number | string | undefined): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  const str = String(value).trim().toLowerCase();
  const num = Number(str);
  if (!Number.isNaN(num)) return num;
  const slugMap: Record<string, LossType> = {
    disease: 'disease',
    مرض: 'disease',
    weather: 'weather',
    طقس: 'weather',
    electricity: 'electricity',
    كهرباء: 'electricity',
    pest: 'pest',
    حشرات: 'pest',
    آفة: 'pest',
    other: 'other',
    أخرى: 'other',
    آخر: 'other',
  };
  const slug = slugMap[str];
  return slug ? mapLossTypeToApi(slug) : 5;
}

function historyDate(api: ApiBatchHistoryItem): string {
  return (
    (api.creationDate ?? api.modificationDate ?? api.date ?? '').trim() ||
    new Date().toISOString()
  );
}

function recordedBy(api: ApiBatchHistoryItem): string | undefined {
  const value = (api.recordedBy ?? api.createdById ?? '').trim();
  return value || undefined;
}

export function mapBatchHistoryItem(api: ApiBatchHistoryItem): StockHistoryEntry {
  const actionType = parseActionType(api.actionType ?? api.actionTypeName);
  const date = historyDate(api);
  const quantity = api.quantity ?? 0;
  const primary = mapSide(api, 'primary');
  const from = mapSide(api, 'from');
  const to = mapSide(api, 'to');

  if (isTransferLikeAction(actionType)) {
    const hasFrom = hasLocationData(from);
    const hasTo = hasLocationData(to);
    return {
      id: String(api.id ?? `${date}-${actionType}`),
      actionType,
      date,
      quantity,
      from: hasFrom ? from : undefined,
      to: hasTo ? to : primary,
      recordedBy: recordedBy(api),
    };
  }

  if (actionType === StockActionType.Loss) {
    const displayLoc = hasLocationData(from) ? from : hasLocationData(to) ? to : primary;
    return {
      id: String(api.id ?? `${date}-${actionType}`),
      actionType,
      date,
      quantity,
      to: displayLoc,
      lossType: normalizeLossType(api.lossType),
      reason: api.reason,
      notes: api.notes,
      recordedBy: recordedBy(api),
    };
  }

  const displayLoc = hasLocationData(primary)
    ? primary
    : hasLocationData(to)
      ? to
      : from;

  return {
    id: String(api.id ?? `${date}-${actionType}`),
    actionType,
    date,
    quantity,
    to: displayLoc,
    lossType: normalizeLossType(api.lossType),
    reason: api.reason,
    notes: api.notes,
    recordedBy: recordedBy(api),
  };
}

/** When the API omits from* on transfers, use the previous event's destination as the source. */
export function enrichStockHistoryEntries(
  entries: readonly StockHistoryEntry[],
): StockHistoryEntry[] {
  const sorted = [...entries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const enriched: StockHistoryEntry[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i];
    if (isTransferLikeAction(entry.actionType) && !entry.from) {
      const prev = sorted[i - 1];
      if (prev && hasLocationData(prev.to)) {
        enriched.push({ ...entry, from: prev.to });
        continue;
      }
    }
    enriched.push(entry);
  }

  return enriched;
}

/** تسكين جديد أولاً، ثم باقي الأحداث من الأقدم للأحدث. */
export function sortStockHistoryForDisplay(
  entries: readonly StockHistoryEntry[],
): StockHistoryEntry[] {
  const byDate = (a: StockHistoryEntry, b: StockHistoryEntry): number =>
    new Date(a.date).getTime() - new Date(b.date).getTime();

  const addStock = entries
    .filter((e) => e.actionType === StockActionType.AddStock)
    .sort(byDate);
  const rest = entries
    .filter((e) => e.actionType !== StockActionType.AddStock)
    .sort(byDate);

  return [...addStock, ...rest];
}

/** تسكين جديد من صف الجدول (مصدر الحقيقة للموقع والكمية الأولية). */
export function allocationEntryFromRow(row: AllocationRow): StockHistoryEntry {
  const layerLabel = (row.layer || row.pipe).trim();
  const qty = row.initialQuantity > 0 ? row.initialQuantity : row.quantity;

  return {
    id: `table-allocation-${row.id}`,
    actionType: StockActionType.AddStock,
    date: row.allocatedDate,
    quantity: qty,
    to: {
      location: row.location,
      greenhouse: row.greenhouse,
      zone: row.zone,
      system: row.system,
      layerLabel,
    },
  };
}

/** يستبدل تسكين الـ API ببيانات الجدول ويعيد الربط والترتيب للعرض. */
export function buildMovementHistoryWithTableAllocation(
  apiEntries: readonly StockHistoryEntry[],
  row: AllocationRow,
): StockHistoryEntry[] {
  const withoutAdd = apiEntries.filter((e) => e.actionType !== StockActionType.AddStock);
  const initial = allocationEntryFromRow(row);
  return sortStockHistoryForDisplay(enrichStockHistoryEntries([initial, ...withoutAdd]));
}

function mapHousingHistoryLocation(
  api: ApiHousingHistoryLocation | null | undefined,
): StockHistoryLocation | undefined {
  if (!api) return undefined;
  const loc: StockHistoryLocation = {
    location: pickString(api.location),
    greenhouse: normalizeGreenhouseLabel(pickString(api.unit)),
    zone: pickString(api.zone),
    system: pickString(api.system),
    layerLabel: pickString(api.layer),
  };
  return hasLocationData(loc) ? loc : undefined;
}

function parseHousingHistoryTitle(title: string | undefined | null): StockActionType {
  const t = (title ?? '').trim().toLowerCase();
  if (!t) return StockActionType.AddStock;
  if (t.includes('تسكين') || t.includes('allocate') || t.includes('new')) {
    return StockActionType.AddStock;
  }
  if (t.includes('نقل') || t.includes('transfer')) {
    return StockActionType.TransferStock;
  }
  if (t.includes('دمج') || t.includes('merge')) {
    return StockActionType.MergeStock;
  }
  if (t.includes('حصاد') || t.includes('harvest')) {
    return StockActionType.HarvestStock;
  }
  if (t.includes('خس') || t.includes('loss') || t.includes('فاقد')) {
    return StockActionType.Loss;
  }
  if (t.includes('إزال') || t.includes('remove')) {
    return StockActionType.RemoveStock;
  }
  return StockActionType.AddStock;
}

export function mapHousingHistoryItem(api: ApiHousingHistoryItem): StockHistoryEntry {
  const actionType = parseHousingHistoryTitle(api.title);
  const from = mapHousingHistoryLocation(api.from);
  const to = mapHousingHistoryLocation(api.to);
  const date = (api.date ?? '').trim() || new Date().toISOString();
  const quantity = api.quantity ?? 0;

  if (isTransferLikeAction(actionType)) {
    return {
      id: String(api.id),
      actionType,
      date,
      quantity,
      from,
      to: to ?? from ?? EMPTY_LOC,
    };
  }

  const displayLoc = to ?? from ?? EMPTY_LOC;
  return {
    id: String(api.id),
    actionType,
    date,
    quantity,
    to: displayLoc,
  };
}

function mapHousingHistorySummary(api: ApiHousingHistorySummary): HousingHistorySummary {
  return {
    housingId: String(api.housingId),
    distributionId: String(api.distributionId),
    stockBatchId: String(api.stockBatchId),
    currentQuantity: api.currentQuantity ?? 0,
    location: mapHousingHistoryLocation(api.location) ?? EMPTY_LOC,
  };
}

export function mapHousingHistoryResponse(
  payload: ApiHousingHistoryResponse['result'],
): HousingHistoryResult {
  const mapped = (payload.items ?? []).map((item) => mapHousingHistoryItem(item));
  return {
    summary: mapHousingHistorySummary(payload.housing),
    entries: sortStockHistoryForDisplay(enrichStockHistoryEntries(mapped)),
  };
}
