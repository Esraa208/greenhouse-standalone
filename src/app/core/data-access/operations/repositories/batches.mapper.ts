import type { ApiBatchItem, ApiCreateBatchCommand } from '@app/core/data-access/api';
import type { BatchRow, BatchStatus, BatchGrowthStageKey, CreateBatchDto } from '../models/batch.model';

/** Maps API status text (Arabic/English) + `active` flag to domain status. */
export function mapBatchStatus(api: ApiBatchItem): BatchStatus {
  const label = (api.status ?? '').trim().toLowerCase();
  if (label.includes('حصاد') || label.includes('harvest')) return 'harvested';
  if (label.includes('مفقود') || label.includes('فقد') || label.includes('lost')) return 'lost';
  if (label.includes('نشط') || label.includes('active')) return 'active';
  if (!api.active) return 'harvested';
  return 'active';
}

export function formatBatchLocation(api: ApiBatchItem): string {
  const parts = [api.locationName, api.unitName, api.zoneName]
    .map((p) => (p ?? '').trim())
    .filter((p) => p.length > 0);
  return parts.join(' · ');
}

export function parseBatchPlantingDate(raw: string | undefined): string | null {
  if (!raw?.trim()) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime()) || d.getFullYear() < 1900) return null;
  return raw;
}

export function resolveGrowthPercent(api: ApiBatchItem, status: BatchStatus): number {
  const rate = api.growthRate;
  if (rate != null && Number.isFinite(rate) && rate >= 0 && rate <= 100) {
    return Math.round(rate);
  }
  if (status === 'harvested') return 100;

  const duration = api.growthDuration ?? 0;
  const days = api.daysPassed ?? 0;
  if (duration > 0 && days >= 0 && days <= duration * 2) {
    return Math.min(100, Math.round((days / duration) * 100));
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

/** Days row: current / total (clamped; derived from % when API days are invalid). */
export function resolveDisplayDays(
  growthDuration: number,
  daysPassed: number,
  growthPercent: number,
  status: BatchStatus
): { current: number; total: number } {
  const total = Math.max(0, growthDuration);
  if (total === 0) return { current: 0, total: 0 };

  if (status === 'harvested') {
    return { current: total, total };
  }

  let current = daysPassed;
  const invalidDays = current < 0 || current > total * 2;
  if (invalidDays) {
    current = Math.round((growthPercent / 100) * total);
  } else {
    current = Math.min(total, Math.max(0, current));
  }
  return { current, total };
}

export function resolveBatchLosses(
  api: ApiBatchItem,
  initialQuantity: number,
  quantity: number
): { lossesCount: number; lossesPercentage: number } {
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
  const growthDuration = api.growthDuration ?? 0;
  const daysPassed = api.daysPassed ?? 0;
  const plantingDate = parseBatchPlantingDate(api.plantingDate);
  const status = mapBatchStatus(api);
  const growthPercent = resolveGrowthPercent(api, status);
  const growthStageKey = resolveGrowthStageKey(growthPercent, status, api.growthStage);

  let expectedHarvestDate = '';
  if (plantingDate && growthDuration > 0) {
    const d = new Date(plantingDate);
    d.setDate(d.getDate() + growthDuration);
    expectedHarvestDate = d.toISOString();
  }

  const total = api.totalQuantity ?? 0;
  const quantity = api.quantity ?? 0;
  const initialQuantity = total > 0 ? total : quantity;
  const { lossesCount, lossesPercentage } = resolveBatchLosses(
    api,
    initialQuantity,
    quantity
  );

  const locationSite = (api.locationName ?? '').trim() || undefined;
  const greenhouseName = (api.unitName ?? '').trim() || undefined;
  const zone = (api.zoneName ?? '').trim() || undefined;

  return {
    id: String(api.id),
    batchNumber: api.batchNumber?.trim() || `BTH-${String(api.id).padStart(3, '0')}`,
    name: api.batchNumber?.trim() || `BTH-${api.id}`,
    cropType: api.cropTypeName?.trim() || '',
    cropTypeId: String(api.cropTypeId),
    quantity,
    initialQuantity,
    plantingDate: plantingDate ?? '',
    expectedHarvestDate,
    growthDuration,
    daysPassed,
    growthStageKey,
    growthPercent,
    status,
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
      name: dto.name.trim(),
      cropTypeId: Number(dto.cropTypeId),
      quantity: dto.quantity,
      layers: dto.layers.map((layer) => ({
        quantity: layer.quantity,
        layerId: Number(layer.layerId),
      })),
    },
  };
}
