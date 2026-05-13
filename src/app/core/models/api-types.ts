/* Typed API response interfaces for GreenHouse backend */

/**
 * Generic paginated response wrapper from all API endpoints.
 * Pattern: { result: { items: T[], totalCount, pageNumber, pageSize, totalPages }, message: string }
 */
export interface ApiPaginatedResult<T> {
  readonly result: {
    readonly items: readonly T[];
    readonly totalCount: number;
    readonly pageNumber: number;
    readonly pageSize: number;
    readonly totalPages: number;
  };
  readonly message: string;
}

/** GET /api/Batch/fetch response item */
export interface ApiBatchItem {
  readonly id: number;
  readonly quantity: number;
  readonly active: boolean;
  readonly cropTypeId: number;
  readonly cropTypeName: string;
  readonly plantingDate: string;
  readonly growthDuration: number;
  readonly daysPassed: number;
}

/** GET /api/BatchDistribution/fetch response item */
export interface ApiDistributionItem {
  readonly id: number;
  readonly quantity: number;
  readonly stockBatchId: number;
  readonly stockBatchNumber: string;
  readonly pipeId: number;
  readonly pipeName: string;
}

/** GET /api/CropType/fetch response item */
export interface ApiCropTypeItem {
  readonly id: number;
  readonly name: string;
  readonly activeStocs: number;
  readonly cropCounts: number;
  readonly deleted: boolean;
  readonly stockBatch: unknown;
}

/** GET /api/Losses/fetch response item */
export interface ApiLossItem {
  readonly id: number;
  readonly batchId: number;
  readonly batchNumber: string;
  readonly distributionId: number;
  readonly pipeId: number;
  readonly pipeName: string;
  readonly quantity: number;
  readonly lossType: number;
  readonly reason: string;
  readonly creationDate: string;
}

/** GET /api/Pipe/fetch response item — includes full hierarchy names */
export interface ApiPipeItem {
  readonly id: number;
  readonly name: string;
  readonly address?: string;
  readonly layerId: number;
  readonly active: boolean;
  readonly pipesCapacity: number;
  readonly used?: number;
  readonly occupancyPercentage?: number;
  readonly occupancyState?: string;
  readonly layerName: string;
  readonly systemId?: number;
  readonly systemName: string;
  readonly zoneId?: number;
  readonly zoneName: string;
  readonly unitId?: number;
  readonly unitName: string;
  readonly locationId?: number;
  readonly locationName: string;
}

/** GET /api/Locations/fetch response item */
export interface ApiLocationItem {
  readonly id: number;
  readonly name: string;
  readonly address?: string;
  readonly active: boolean;
  readonly unitsCount: number;
  readonly totalCapacity: number;
  readonly capacity: number;
}

/** GET /api/Units/fetch response item */
export interface ApiUnitItem {
  readonly id: number;
  readonly name: string;
  readonly address?: string;
  readonly active: boolean;
  readonly locationId: number;
  readonly locationName?: string;
  readonly capacity?: number;
  readonly zonesCount?: number;
  readonly used?: number;
  readonly available?: number;
  /** Occupancy % when provided by API */
  readonly occupancy?: number;
}

/** GET /api/Zone/fetch response item */
export interface ApiZoneItem {
  readonly id: number;
  readonly name: string;
  readonly address?: string;
  readonly active: boolean;
  readonly unitId: number;
  readonly unitName?: string;
  readonly locationId?: number;
  readonly locationName?: string;
  readonly capacity?: number;
  readonly systemsCount?: number;
  readonly used?: number;
  readonly occupancy?: number;
}

/** GET /api/System/fetch response item */
export interface ApiSystemItem {
  readonly id: number;
  readonly name: string;
  readonly address?: string;
  readonly active: boolean;
  /** Parent zone (when API returns it). */
  readonly zoneId?: number;
  /** Parent unit / greenhouse (when API returns it). */
  readonly unitId?: number;
  readonly locationId?: number;
  readonly systemType?: number;
  readonly capacity?: number;
  readonly layersCount?: number;
  /** Some responses use this name for child count; map to `layersCount` in the domain row. */
  readonly systemsCount?: number;
  readonly used?: number;
  readonly occupancy?: number;
  readonly zoneName?: string;
  readonly unitName?: string;
  readonly locationName?: string;
}

/** GET /api/Layer/fetch response item */
export interface ApiLayerItem {
  readonly id: number;
  readonly name: string;
  readonly address?: string;
  readonly active: boolean;
  readonly systemId?: number;
  readonly zoneId?: number;
  readonly unitId?: number;
  readonly locationId?: number;
  readonly capacity?: number;
  readonly used?: number;
  readonly occupancy?: number;
  readonly systemName?: string;
  readonly zoneName?: string;
  readonly unitName?: string;
  readonly locationName?: string;
}

/** POST /api/Batch/Create request body */
export interface ApiCreateBatchCommand {
  readonly currentUserId: string;
  readonly batch: {
    readonly name: string;
    readonly cropTypeId: number;
    readonly quantity: number;
    readonly pipeId: number;
  };
}

/** PUT /api/Batch/Move request body */
export interface ApiMoveBatchDto {
  readonly distributionId: number;
  readonly toPipeId: number;
  readonly fromPipeId: number;
  readonly quantity: number;
}

/** POST /api/Losses/Create request body */
export interface ApiCreateLossCommand {
  readonly batchId: number;
  readonly lossType: number;
  readonly reason: string;
  readonly currentUserId: string;
  readonly items: readonly ApiCreateLossItem[];
}

export interface ApiCreateLossItem {
  readonly distributionId: number;
  readonly quantity: number;
}

/** Query params for paginated fetch endpoints */
export interface ApiFetchParams {
  readonly PageNumber?: number;
  readonly Search?: string;
  readonly Active?: boolean;
  readonly SetOrder?: string;
}

/** Extended params for BatchDistribution/fetch */
export interface ApiDistributionFetchParams extends ApiFetchParams {
  readonly PipeId?: number;
  readonly SystemId?: number;
  readonly ZoneId?: number;
  readonly UnitId?: number;
  readonly LocationId?: number;
  readonly StockBatchId?: number;
}

/** Extended params for Losses/fetch */
export interface ApiLossesFetchParams extends Omit<ApiFetchParams, 'Active' | 'SetOrder'> {
  readonly BatchId?: number;
  readonly PipeId?: number;
  readonly LossType?: number;
}

/** GET /api/Customer response item */
export interface ApiCustomerItem {
  readonly id: number;
  readonly name: string;
  readonly phone: string;
  readonly email: string;
  readonly address: string;
}

/** POST /api/Customer request body */
export interface ApiCreateCustomerCommand {
  readonly currentUserId: string;
  readonly customer: {
    readonly name: string;
    readonly phone: string;
    readonly email: string;
    readonly address: string;
  };
}

/** GET /api/Harvest/Fetch response item */
export interface ApiHarvestItem {
  readonly id: number;
  readonly stockBatchId: number;
  readonly date: string;
  readonly totalQuantity: number;
  readonly netWeight: number;
  readonly value: number;
  readonly notes: string;
  readonly details: readonly ApiHarvestDetailItem[];
}

export interface ApiHarvestDetailItem {
  readonly layerId: number;
  readonly quantity: number;
  readonly netWeight: number;
  readonly unit: string;
}

/** POST /api/Harvest/Create request body */
export interface ApiCreateHarvestDto {
  readonly stockBatchId: number;
  readonly date: string;
  readonly totalQuantity: number;
  readonly netWeight: number;
  readonly value: number;
  readonly notes: string;
  readonly details: readonly ApiHarvestDetailItem[];
}

/** GET /api/Invoice response item */
export interface ApiInvoiceItem {
  readonly id: number;
  readonly invoiceNumber: string;
  readonly customerId: number;
  readonly customerName: string;
  readonly customerPhone: string;
  readonly invoiceDate: string;
  readonly dueDate?: string;
  readonly totalAmount: number;
  readonly paymentDate?: string;
  readonly status: string;
  readonly items: readonly ApiInvoiceDetailItem[];
}

export interface ApiInvoiceDetailItem {
  readonly id: number;
  readonly itemNumber: number;
  readonly itemCode: string;
  readonly productName: string;
  readonly quantityKg: number;
  readonly weightPerCartonKg: number;
  readonly totalWeightKg: number;
  readonly pricePerUnit: number;
  readonly total: number;
}

/** POST /api/Invoice request body */
export interface ApiCreateInvoiceCommand {
  readonly currentUserId: string;
  readonly invoice: ApiInvoiceItem;
}
