export interface HarvestRow {
  readonly id: string;
  readonly batchNumber: string;
  readonly cropTypeName: string;
  readonly quantityHarvested: number;
  readonly rootWeight: number;
  readonly netWeight: number;
  readonly harvestValue?: number;
  readonly harvestDate: string;
  readonly customerName?: string;
}

export interface CreateHarvestDto {
  allocations: Array<{
    allocationId: string;
    harvestQuantity: number;
  }>;
  totalWeight: number;
  hasRoots: boolean;
  rootWeightPerPlantGrams?: number;
  pricePerKg: number;
  customerId: string;
  notes?: string;
}

export interface HarvestRefCustomer {
  readonly id: string;
  readonly name: string;
  readonly phone: string;
}





