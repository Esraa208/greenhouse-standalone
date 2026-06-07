export interface InvoiceHousingDraft {
  readonly housingId: string;
  readonly label: string;
  readonly cropTypeId: string;
  readonly cropTypeName: string;
  readonly availableQuantity: number;
  quantity: number;
  weightKg: number | null;
}

export interface InvoiceLayerGroupDraft {
  readonly layerId: string;
  readonly layerLabel: string;
  readonly pathLabel: string;
  readonly housings: readonly InvoiceHousingDraft[];
}

export interface InvoiceCropPriceDraft {
  readonly cropTypeId: string;
  readonly cropTypeName: string;
  pricePerKg: number | null;
}

export interface CreateInvoiceFromHarvestDto {
  readonly customerId: string;
  readonly invoiceDate: string;
  readonly dueDate?: string;
  readonly notes?: string;
  readonly hasRoots: boolean;
  readonly rootWeightPerPlantGrams?: number;
  readonly housings: ReadonlyArray<{
    readonly housingId: string;
    readonly quantity: number;
    readonly weightKg: number;
  }>;
  readonly cropPrices: ReadonlyArray<{
    readonly cropTypeId: string;
    readonly pricePerKg: number;
  }>;
}

export interface InvoiceCreateCascade {
  locationId: string;
  greenhouseId: string;
  zoneId: string;
  systemId: string;
  layerId: string;
}

export interface InvoiceCreateFormState {
  customerId: string;
  invoiceDate: string;
  dueDate: string;
  notes: string;
  hasRoots: boolean;
  rootWeightPerPlant: number | null;
  valid: boolean;
}

export const DEFAULT_INVOICE_CREATE_CASCADE: InvoiceCreateCascade = {
  locationId: '',
  greenhouseId: '',
  zoneId: '',
  systemId: '',
  layerId: '',
};
