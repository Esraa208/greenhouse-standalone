import type { ApiLossItem } from '@app/core/data-access/api';
import type { LossRecord } from '../models/allocation.model';
import type { LossRow, LossSourceType } from '../models/loss.model';
import { mapLossTypeFromApi } from '../utils/loss-type.util';
import { normalizeGreenhouseLabel } from '@app/shared/utils/normalize-greenhouse-label';

function pickString(...values: (string | null | undefined)[]): string {
  for (const value of values) {
    if (value != null && String(value).trim()) {
      return String(value).trim();
    }
  }
  return '';
}

export function readLossTypeId(api: ApiLossItem): number {
  const raw = api.lossType;
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (raw && typeof raw === 'object' && raw.id != null) return raw.id;
  return 5;
}

export function readLossTypeLabel(api: ApiLossItem): string | undefined {
  const raw = api.lossType;
  if (raw && typeof raw === 'object') {
    const title = raw.title?.trim();
    if (title) return title;
  }
  const legacy = pickString(api.lossTypeAr, api.lossTypeEn);
  return legacy || undefined;
}

export function readLossDate(api: ApiLossItem): string {
  return (
    pickString(api.destructionDate, api.creationDate) || new Date().toISOString()
  );
}

export function readLossQuantity(api: ApiLossItem): number {
  return api.plants?.quantity ?? api.quantity ?? 0;
}

export function readLossReason(api: ApiLossItem): string {
  if (api.reason != null && typeof api.reason === 'object') {
    return pickString(api.reason.reason);
  }
  return pickString(api.reason as string | undefined);
}

export function readLossNotes(api: ApiLossItem): string | undefined {
  if (api.reason != null && typeof api.reason === 'object') {
    const notes = api.reason.notes?.trim();
    return notes || undefined;
  }
  const notes = api.notes?.trim();
  return notes || undefined;
}

export function readLossHousingId(api: ApiLossItem): number | undefined {
  return api.placement?.housingId ?? api.housingId;
}

function readSourceTypeLabel(api: ApiLossItem): string {
  return pickString(api.source?.title);
}

function mapSourceType(api: ApiLossItem): LossSourceType {
  const title = readSourceTypeLabel(api).toLowerCase();
  if (title.includes('دفعة') || title.includes('batch')) return 'batch';
  if (title.includes('طبقة') || title.includes('layer')) return 'layer';
  if (title.includes('تسك') || title.includes('alloc') || title.includes('housing')) {
    return 'allocation';
  }
  if (readLossHousingId(api)) return 'allocation';
  if (api.placement?.batchNumber && !readLossHousingId(api)) return 'batch';
  return 'allocation';
}

function readLossSourceName(api: ApiLossItem): string {
  const batch = pickString(api.placement?.batchNumber, api.batchNumber);
  const crop = pickString(api.placement?.cropType);
  if (batch && crop) return `${batch} - ${crop}`;
  return batch || crop || readSourceTypeLabel(api);
}

export function readLossSourcePath(api: ApiLossItem): string {
  const parts = [
    pickString(api.placement?.zoneName, api.zoneName),
    pickString(api.placement?.systemName, api.systemName),
    pickString(api.placement?.layerName, api.layerName),
    pickString(api.pipeName),
  ].filter(Boolean);
  return parts.join(' • ');
}

export function readLossLocationName(api: ApiLossItem): string {
  return pickString(api.location?.locationName, api.locationName);
}

export function readLossUnitName(api: ApiLossItem): string {
  return normalizeGreenhouseLabel(
    pickString(api.location?.unitName, api.unitName),
  );
}

export function mapApiLossToRecord(api: ApiLossItem): LossRecord {
  const typeId = readLossTypeId(api);
  return {
    id: String(api.id),
    date: readLossDate(api),
    lossType: mapLossTypeFromApi(typeId),
    lossTypeLabel: readLossTypeLabel(api),
    quantity: readLossQuantity(api),
    reason: readLossReason(api),
    notes: readLossNotes(api),
  };
}

export function mapApiLossToRow(api: ApiLossItem): LossRow {
  const sourceType = mapSourceType(api);
  const sourceTypeLabel = readSourceTypeLabel(api);
  return {
    id: String(api.id),
    date: readLossDate(api),
    sourceType,
    sourceTypeLabel,
    sourceName: readLossSourceName(api),
    sourcePath: readLossSourcePath(api),
    location: readLossLocationName(api),
    greenhouse: readLossUnitName(api),
    lossType: mapLossTypeFromApi(readLossTypeId(api)),
    lossTypeLabel: readLossTypeLabel(api),
    quantity: readLossQuantity(api),
    reason: readLossReason(api),
    notes: readLossNotes(api),
  };
}
