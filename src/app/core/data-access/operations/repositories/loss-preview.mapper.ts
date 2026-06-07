import type {
  ApiLossPreviewBatch,
  ApiLossPreviewInfrastructure,
  ApiLossPreviewNamedRef,
  ApiLossPreviewPlacement,
  ApiLossPreviewResult,
} from '@app/core/data-access/api';
import type {
  LossPreviewBatch,
  LossPreviewHousing,
  LossPreviewInfrastructure,
  LossPreviewRef,
  LossScopePreview,
} from '../models/loss-preview.model';

function mapRef(ref?: { id: number; name: string } | null): LossPreviewRef | undefined {
  if (!ref?.id) return undefined;
  return { id: String(ref.id), name: ref.name?.trim() ?? '' };
}

function resolveCropTypeName(
  cropType?: string | ApiLossPreviewNamedRef | null,
): string {
  if (!cropType) return '';
  if (typeof cropType === 'string') return cropType.trim();
  return cropType.name?.trim() ?? '';
}

function mapInfrastructure(
  infra?: ApiLossPreviewInfrastructure | null,
): LossPreviewInfrastructure | undefined {
  if (!infra) return undefined;
  return {
    location: mapRef(infra.location),
    unit: mapRef(infra.unit),
    zone: mapRef(infra.zone),
    system: mapRef(infra.system),
    layer: mapRef(infra.layer),
    housing: mapRef(infra.housing),
  };
}

function mapBatch(batch?: ApiLossPreviewBatch | null): LossPreviewBatch | undefined {
  if (!batch?.id) return undefined;
  return {
    id: String(batch.id),
    batchNumber: batch.batchNumber?.trim() ?? `BTH-${String(batch.id).padStart(3, '0')}`,
    cropType: resolveCropTypeName(batch.cropType),
  };
}

export function formatLossPreviewPlacementPath(placement: ApiLossPreviewPlacement): string {
  return [
    placement.location?.name,
    placement.unit?.name,
    placement.zone?.name,
    placement.system?.name,
    placement.layer?.name,
  ]
    .filter((part) => part?.trim())
    .join(' ← ');
}

export function mapApiLossPreviewResult(api: ApiLossPreviewResult): LossScopePreview {
  return {
    scopeType: api.scopeType,
    batch: mapBatch(api.batch),
    infrastructure: mapInfrastructure(api.infrastructure),
    summary: {
      housingCount: api.summary?.housingCount ?? 0,
      totalPlants: api.summary?.totalPlants ?? 0,
    },
    housings: (api.housings ?? []).map(
      (housing): LossPreviewHousing => ({
        id: String(housing.id),
        quantity: housing.quantity ?? 0,
        pathLabel: formatLossPreviewPlacementPath(housing.placement ?? {}),
        layerId: housing.placement?.layer?.id
          ? String(housing.placement.layer.id)
          : undefined,
      }),
    ),
  };
}
