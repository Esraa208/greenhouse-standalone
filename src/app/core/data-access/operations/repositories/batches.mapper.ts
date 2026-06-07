import type { ApiBatchItem, ApiCreateBatchCommand } from '@app/core/data-access/api';
import type { BatchRow, BatchStatus, BatchGrowthStageKey, CreateBatchDto } from '../models/batch.model';
import { normalizeGreenhouseLabel } from '@app/shared/utils/normalize-greenhouse-label';

function readStatusLabel(api: ApiBatchItem): string {
  const st = api.status;
  if (st && typeof st === 'object' && 'title' in st) {
    return String(st.title ?? '').trim();
  }
  return typeof st === 'string' ? st.trim() : '';
}

function readIsActive(api: ApiBatchItem, currentQty: number): boolean {
  const st = api.status;
  if (st && typeof st === 'object' && 'isActive' in st) {
    return Boolean(st.isActive);
  }
  if (api.active != null) return api.active;
  return currentQty > 0;
}

/** Maps API status (nested or legacy) + quantity to domain status. */
export function mapBatchStatus(api: ApiBatchItem, currentQty?: number): BatchStatus {
  const qty = currentQty ?? api.quantities?.current ?? api.quantity ?? 0;
  const label = readStatusLabel(api).toLowerCase();
  if (label.includes('حصاد') || label.includes('harvest') || label.includes('محصول')) {
    return 'harvested';
  }
  if (label.includes('مفقود') || label.includes('فقد') || label.includes('lost')) {
    return 'lost';
  }
  if (qty === 0) return 'harvested';
  if (!readIsActive(api, qty)) return 'harvested';
  return 'active';
}

export function formatBatchLocation(api: ApiBatchItem): string {
  const site = (api.location?.location ?? api.locationName ?? '').trim();
  const unit = normalizeGreenhouseLabel(api.location?.unit ?? api.unitName ?? '');
  const zone = (api.zoneName ?? '').trim();
  return [site, unit, zone].filter((p) => p.length > 0).join(' · ');
}

export function parseBatchPlantingDate(raw: string | undefined): string | null {
  if (!raw?.trim()) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime()) || d.getFullYear() < 1900) return null;
  return raw;
}

export function resolveGrowthPercent(api: ApiBatchItem, status: BatchStatus): number {
  const nested = api.growth?.progressPercent;
  if (nested != null && Number.isFinite(nested) && nested >= 0) {
    return Math.round(nested * 10) / 10;
  }

  const rate = api.growthRate;
  if (rate != null && Number.isFinite(rate) && rate >= 0) {
    return Math.round(rate * 10) / 10;
  }
  if (status === 'harvested') return 100;

  const duration = api.growth?.durationDays ?? api.growthDuration ?? 0;
  const days = api.growth?.daysPassed ?? api.daysPassed ?? 0;
  if (duration > 0 && days >= 0) {
    return Math.round((days / duration) * 1000) / 10;
  }
  return 0;
}

/** Stage order: شتلات → نضج مبكر → نمو خضري → حصاد */
export const BATCH_GROWTH_STAGE_ORDER: readonly BatchGrowthStageKey[] = [
  'seedlings',
  'early',
  'vegetative',
  'harvest',
] as const;

/** Four table stages: شتلات → نضج مبكر → نمو خضري → حصاد */
export function resolveGrowthStageKey(
  percent: number,
  status: BatchStatus,
  apiStage?: string | null
): BatchGrowthStageKey {
  const s = (apiStage ?? '').trim();
  if (status === 'harvested' || s.includes('حصاد') || s.includes('harvest')) return 'harvest';
  if (s.includes('شتلات') || s.includes('seedling')) return 'seedlings';
  if (s.includes('نضج مبكر') || s.includes('early')) return 'early';
  if (s.includes('نمو خضري') || s.includes('vegetative') || s.includes('نباتي')) return 'vegetative';

  if (percent >= 100) return 'harvest';
  if (percent < 25) return 'seedlings';
  if (percent < 50) return 'early';
  if (percent < 85) return 'vegetative';
  return 'harvest';
}

/** Days shown in growth card (actual age; not clamped to duration). */
export function resolveDisplayDays(
  growthDuration: number,
  daysPassed: number,
  growthPercent: number,
  status: BatchStatus
): { current: number; total: number } {
  const total = Math.max(0, growthDuration);
  if (total === 0 && daysPassed <= 0) return { current: 0, total: 0 };

  if (status === 'harvested') {
    const current = daysPassed > 0 ? daysPassed : total;
    return { current, total: total || current };
  }

  if (daysPassed > 0) {
    return { current: daysPassed, total };
  }

  if (total > 0 && growthPercent > 0) {
    return { current: Math.round((growthPercent / 100) * total), total };
  }

  return { current: 0, total };
}

export function resolveBatchLosses(
  api: ApiBatchItem,
  initialQuantity: number,
  quantity: number
): { lossesCount: number; lossesPercentage: number } {
  const q = api.quantities;
  if (q && (q.loss != null || q.lossPercentage != null)) {
    const lossesCount = q.loss ?? Math.max(0, initialQuantity - quantity);
    const lossesPercentage =
      q.lossPercentage != null && q.lossPercentage >= 0
        ? Math.round(q.lossPercentage)
        : initialQuantity > 0
          ? Math.round((lossesCount / initialQuantity) * 100)
          : 0;
    return { lossesCount, lossesPercentage };
  }

  const apiCount = api.lossesCount ?? 0;
  const apiPct = api.lossesPercentage ?? 0;

  if (apiCount > 0 || (apiPct > 0 && apiPct <= 100)) {
    const lossesCount =
      apiCount > 0 ? apiCount : Math.round((apiPct / 100) * initialQuantity);
    const lossesPercentage =
      apiPct > 0 && apiPct <= 100
        ? Math.round(apiPct)
        : initialQuantity > 0
          ? Math.round((lossesCount / initialQuantity) * 100)
          : 0;
    return { lossesCount, lossesPercentage };
  }

  if (initialQuantity > quantity) {
    const lossesCount = initialQuantity - quantity;
    return {
      lossesCount,
      lossesPercentage:
        initialQuantity > 0
          ? Math.round((lossesCount / initialQuantity) * 100)
          : 0,
    };
  }

  return { lossesCount: 0, lossesPercentage: 0 };
}

export function mapBatchToRow(api: ApiBatchItem): BatchRow {
  const initialQuantity =
    api.quantities?.initial ?? api.totalQuantity ?? api.quantity ?? 0;
  const quantity = api.quantities?.current ?? api.quantity ?? 0;
  const initial = initialQuantity > 0 ? initialQuantity : quantity;

  const growthDuration = api.growth?.durationDays ?? api.growthDuration ?? 0;
  const daysPassed = api.growth?.daysPassed ?? api.daysPassed ?? 0;
  const plantingDate = parseBatchPlantingDate(
    api.growth?.plantingDate ?? api.plantingDate
  );
  const status = mapBatchStatus(api, quantity);
  const growthPercent = resolveGrowthPercent(api, status);
  const apiStage = api.growth?.stage ?? api.growthStage ?? '';
  const growthStageKey = resolveGrowthStageKey(growthPercent, status, apiStage);
  const growthStageLabel = apiStage.trim() || undefined;

  let expectedHarvestDate = api.growth?.expectedHarvestDate?.trim() ?? '';
  if (!expectedHarvestDate && plantingDate && growthDuration > 0) {
    const d = new Date(plantingDate);
    d.setDate(d.getDate() + growthDuration);
    expectedHarvestDate = d.toISOString();
  }

  const { lossesCount, lossesPercentage } = resolveBatchLosses(api, initial, quantity);

  const locationSite = (api.location?.location ?? api.locationName ?? '').trim() || undefined;
  const greenhouseName =
    normalizeGreenhouseLabel(api.location?.unit ?? api.unitName ?? '') || undefined;
  const zone = (api.zoneName ?? '').trim() || undefined;

  return {
    id: String(api.id),
    batchNumber: api.batchNumber?.trim() || `BTH-${String(api.id).padStart(3, '0')}`,
    name: api.batchNumber?.trim() || `BTH-${api.id}`,
    cropType: api.crop?.name?.trim() ?? api.cropTypeName?.trim() ?? '',
    cropTypeId: api.cropTypeId != null ? String(api.cropTypeId) : '',
    quantity,
    initialQuantity: initial,
    plantingDate: plantingDate ?? '',
    expectedHarvestDate,
    growthDuration,
    daysPassed,
    growthStageKey,
    growthStageLabel,
    growthPercent,
    status,
    isActive: readIsActive(api, quantity),
    locationName: formatBatchLocation(api),
    locationSite,
    greenhouseName,
    zoneName: zone,
    lossesCount,
    lossesPercentage,
  };
}

/** Maps domain DTO → POST /api/Batch/Create body */
export function toApiCreateBatchCommand(
  dto: CreateBatchDto,
  currentUserId = 'system',
): ApiCreateBatchCommand {
  return {
    currentUserId,
    batch: {
      cropTypeId: Number(dto.cropTypeId),
      quantity: dto.quantity,
      layers: dto.layers.map((layer) => ({
        quantity: layer.quantity,
        layerId: Number(layer.layerId),
      })),
    },
  };
}
