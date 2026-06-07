import type { RecordAllocationLossDto, LossTypeRef } from '../models/allocation.model';
import type { CreateLossDto } from '../models/loss.model';
import type { CreateBatchLossDto } from '../models/loss-registration.model';
import { mapLossTypeToApi } from '../utils/loss-type.util';
import {
  ApiCreateLossCommand,
  LossCreateMode,
} from '@app/core/data-access/api';

export function toCreationDateIso(date: string): string {
  const trimmed = date.trim();
  if (!trimmed) return new Date().toISOString();
  if (trimmed.includes('T')) return trimmed;
  return new Date(`${trimmed}T12:00:00`).toISOString();
}

/** Allocation loss from تسكين — LayerFull when layerId known, else HousingPartial. */
export function toAllocationLossCommand(dto: RecordAllocationLossDto): ApiCreateLossCommand {
  const base = {
    lossType: mapLossTypeToApi(dto.lossType),
    reason: dto.reason,
    notes: dto.notes,
    creationDate: toCreationDateIso(dto.date),
    currentUserId: 'system',
  };

  if (dto.layerId) {
    return {
      ...base,
      mode: LossCreateMode.LayerFull,
      layerId: Number(dto.layerId),
    };
  }

  return {
    ...base,
    mode: LossCreateMode.HousingPartial,
    housingId: Number(dto.allocationId),
    quantity: dto.quantity,
  };
}

export function toLossPageCommand(dto: CreateLossDto): ApiCreateLossCommand {
  const base = {
    lossType: mapLossTypeToApi(dto.lossType),
    reason: dto.reason,
    notes: dto.notes,
    creationDate: toCreationDateIso(dto.date),
    currentUserId: 'system',
  };

  if (dto.mode === 'batch') {
    return {
      ...base,
      mode: LossCreateMode.BatchWipe,
      stockBatchId: Number(dto.batchId ?? 0),
    };
  }

  if (dto.allocationId) {
    return {
      ...base,
      mode: LossCreateMode.HousingPartial,
      housingId: Number(dto.allocationId),
      quantity: dto.quantity ?? 0,
    };
  }

  if (dto.layerId) {
    return {
      ...base,
      mode: LossCreateMode.LayerFull,
      layerId: Number(dto.layerId),
    };
  }

  if (dto.systemId) {
    return {
      ...base,
      mode: LossCreateMode.SystemWipe,
      systemId: Number(dto.systemId),
    };
  }

  if (dto.zoneId) {
    return {
      ...base,
      mode: LossCreateMode.ZoneWipe,
      zoneId: Number(dto.zoneId),
    };
  }

  if (dto.greenhouseId) {
    return {
      ...base,
      mode: LossCreateMode.UnitWipe,
      unitId: Number(dto.greenhouseId),
    };
  }

  if (dto.locationId) {
    return {
      ...base,
      mode: LossCreateMode.LocationWipe,
      locationId: Number(dto.locationId),
    };
  }

  return {
    ...base,
    mode: LossCreateMode.HousingPartial,
    housingId: 0,
    quantity: dto.quantity ?? 0,
  };
}

export function toBatchLossCommand(dto: CreateBatchLossDto): ApiCreateLossCommand {
  const base = {
    lossType: mapLossTypeToApi(dto.lossType),
    reason: dto.reason,
    notes: dto.notes,
    creationDate: toCreationDateIso(dto.date),
    currentUserId: 'system',
  };

  if (dto.registerWholeBatch) {
    return {
      ...base,
      mode: LossCreateMode.BatchWipe,
      stockBatchId: Number(dto.batchId),
    };
  }

  const first = dto.items[0];
  return {
    ...base,
    mode: LossCreateMode.HousingPartial,
    housingId: Number(first?.housingId ?? 0),
    quantity: first?.quantity ?? dto.quantity,
  };
}
