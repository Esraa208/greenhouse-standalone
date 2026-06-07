import type { ApiCreateInvoiceCommand } from '@app/core/models/api-types';
import type { CreateInvoiceFromHarvestDto } from '../models/invoice-create.model';
import { dateInputToApiDateTime } from '../utils/invoice-date.util';

export function mapCreateInvoiceToApi(dto: CreateInvoiceFromHarvestDto): ApiCreateInvoiceCommand {
  const rootWeightPerPlantKg = dto.hasRoots
    ? (dto.rootWeightPerPlantGrams ?? 0) / 1000
    : 0;

  return {
    currentUserId: 'system',
    customerId: Number(dto.customerId),
    invoiceDate: dateInputToApiDateTime(dto.invoiceDate),
    dueDate: dto.dueDate ? dateInputToApiDateTime(dto.dueDate) : null,
    notes: dto.notes?.trim() || null,
    rootWeightPerPlantKg,
    cropPrices: dto.cropPrices.map((c) => ({
      cropTypeId: Number(c.cropTypeId),
      pricePerKg: c.pricePerKg,
    })),
    housings: dto.housings.map((h) => ({
      housingId: Number(h.housingId),
      quantity: h.quantity,
      weightKg: h.weightKg,
    })),
  };
}
