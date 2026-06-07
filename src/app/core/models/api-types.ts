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

/** GET /api/Batch/fetch response item (nested shape + legacy flat fields). */
export interface ApiBatchItem {
  readonly id: number;
  readonly batchNumber?: string;
  readonly status?: ApiLocationStatus | string | null;
  readonly crop?: { readonly name?: string };
  readonly location?: { readonly location?: string; readonly unit?: string };
  readonly quantities?: {
    readonly initial?: number;
    readonly current?: number;
    readonly loss?: number;
    readonly lossPercentage?: number;
    readonly lossRecordsCount?: number;
  };
  readonly growth?: {
    readonly plantingDate?: string;
    readonly expectedHarvestDate?: string;
    readonly durationDays?: number;
    readonly daysPassed?: number;
    readonly progressPercent?: number;
    readonly stage?: string;
  };
  /** Legacy flat fields (older API shape). */
  readonly totalQuantity?: number;
  readonly quantity?: number;
  readonly active?: boolean;
  readonly cropTypeId?: number;
  readonly cropTypeName?: string;
  readonly plantingDate?: string;
  readonly growthDuration?: number;
  readonly daysPassed?: number;
  readonly growthRate?: number;
  readonly lossesCount?: number;
  readonly lossesPercentage?: number;
  readonly locationName?: string | null;
  readonly unitName?: string | null;
  readonly zoneName?: string | null;
  readonly growthStage?: string | null;
}

/** GET /api/BatchDistribution/fetch response item (nested + legacy flat fields). */
export interface ApiDistributionItem {
  readonly id: number;
  readonly plants?: {
    readonly quantity?: number;
  };
  readonly batch?: {
    readonly batchNumber?: string;
    readonly cropType?: { readonly id?: number; readonly name?: string };
    readonly plantingDate?: string;
    readonly daysSincePlanting?: number;
    readonly growthDuration?: number;
    readonly status?: string;
  };
  readonly placement?: {
    readonly locationName?: string;
    readonly unitName?: string;
    readonly zoneName?: string;
    readonly systemName?: string;
    readonly layerName?: string;
    readonly layerCapacity?: number;
  };
  readonly housing?: {
    readonly createdDate?: string;
    readonly daysInHousing?: number;
  };
  readonly activity?: {
    readonly moveCount?: number;
    readonly lossCount?: number;
  };
  /** Legacy flat fields */
  readonly layerId?: number;
  readonly quantity?: number;
  readonly stockBatchId?: number;
  readonly stockBatchNumber?: string;
  readonly pipeId?: number;
  readonly pipeName?: string;
  readonly cropType?: string;
  readonly locationName?: string;
  readonly unitName?: string;
  readonly zoneName?: string;
  readonly systemName?: string;
  readonly layerName?: string;
  readonly layerCount?: number;
  readonly moveCount?: number;
  readonly lossCount?: number;
  readonly initialQuantity?: number;
  readonly creationDate?: string;
  readonly growthDuration?: number;
  readonly daysPassed?: number;
  readonly status?: string;
}

/** Placement node in GET /api/BatchDistribution/{housingId}/history */
export interface ApiHousingHistoryLocation {
  readonly location?: string;
  readonly unit?: string;
  readonly zone?: string;
  readonly system?: string;
  readonly layer?: string;
}

/** Timeline row in housing history */
export interface ApiHousingHistoryItem {
  readonly id: number;
  readonly quantity: number;
  readonly title: string;
  readonly from?: ApiHousingHistoryLocation | null;
  readonly to?: ApiHousingHistoryLocation | null;
  readonly date: string;
}

/** Summary block in housing history response */
export interface ApiHousingHistorySummary {
  readonly distributionId: number;
  readonly housingId: number;
  readonly stockBatchId: number;
  readonly currentQuantity: number;
  readonly location: ApiHousingHistoryLocation;
}

/** GET /api/BatchDistribution/{housingId}/history */
export interface ApiHousingHistoryResponse {
  readonly result: {
    readonly housing: ApiHousingHistorySummary;
    readonly items: readonly ApiHousingHistoryItem[];
  };
  readonly message: string;
}

/** GET /api/Batch/history/{id} response item */
export interface ApiBatchHistoryItem {
  readonly id?: number;
  readonly stockBatchId?: number;
  readonly actionType?: number | string;
  /** e.g. "TransferStock" when actionType is numeric */
  readonly actionTypeName?: string;
  readonly quantity: number;
  readonly creationDate?: string;
  readonly modificationDate?: string;
  readonly date?: string;
  readonly locationName?: string;
  readonly unitName?: string;
  readonly zoneName?: string;
  readonly systemName?: string;
  readonly layerName?: string;
  readonly layerCount?: number;
  readonly fromLocationName?: string;
  /** API typo: lowercase "l" in location */
  readonly fromlocationName?: string | null;
  readonly fromUnitName?: string | null;
  readonly fromZoneName?: string | null;
  readonly fromSystemName?: string | null;
  readonly fromLayerName?: string;
  readonly fromLayerCount?: number;
  readonly fromPipeId?: number | null;
  readonly fromPipeName?: string | null;
  readonly toLocationName?: string | null;
  readonly toUnitName?: string | null;
  readonly toZoneName?: string | null;
  readonly toSystemName?: string | null;
  readonly toLayerName?: string;
  readonly toLayerCount?: number;
  readonly toPipeId?: number | null;
  readonly toPipeName?: string | null;
  readonly lossType?: number | string;
  readonly reason?: string;
  readonly notes?: string;
  readonly recordedBy?: string;
  readonly createdById?: string;
}

/** GET /api/CropType/fetch response item */
export interface ApiCropTypeItem {
  readonly id: number;
  readonly name: string;
  readonly growthDuration?: number;
  readonly activeBatchesCount?: number;
  /** Legacy API typo — fallback when `activeBatchesCount` is absent. */
  readonly activeStocs?: number;
  readonly cropCounts?: number;
  readonly stockBatch?: number;
  readonly status?: ApiLocationStatus;
  readonly deleted?: boolean;
}

/** GET /api/Losses/fetch response item (nested + legacy flat fields). */
export interface ApiLossItem {
  readonly id: number;
  readonly destructionDate?: string;
  readonly source?: {
    readonly id?: number;
    readonly title?: string;
  };
  readonly placement?: {
    readonly batchNumber?: string;
    readonly cropType?: string;
    readonly zoneName?: string;
    readonly systemName?: string;
    readonly layerName?: string;
    readonly housingId?: number;
  };
  readonly location?: {
    readonly locationName?: string;
    readonly unitName?: string;
  };
  readonly lossType?: number | {
    readonly id?: number;
    readonly title?: string;
  };
  readonly plants?: {
    readonly quantity?: number;
  };
  readonly reason?: string | {
    readonly reason?: string;
    readonly notes?: string | null;
  };
  /** Legacy flat fields */
  readonly batchId?: number;
  readonly batchNumber?: string;
  readonly housingId?: number;
  readonly pipeId?: number;
  readonly pipeName?: string;
  readonly locationName?: string;
  readonly zoneName?: string;
  readonly layerName?: string;
  readonly systemName?: string;
  readonly unitName?: string;
  readonly quantity?: number;
  readonly lossTypeEn?: string;
  readonly lossTypeAr?: string;
  readonly notes?: string | null;
  readonly creationDate?: string;
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

/** Status object on GET /api/Locations/fetch items */
export interface ApiLocationStatus {
  readonly isActive: boolean;
  readonly title?: string;
}

/** GET /api/Locations/fetch response item */
export interface ApiLocationItem {
  readonly id: number;
  readonly name: string;
  readonly address?: string;
  readonly greenhouseCount?: number;
  readonly totalCapacity?: number;
  readonly status?: ApiLocationStatus;
  /** @deprecated use status.isActive */
  readonly active?: boolean;
  /** @deprecated use greenhouseCount */
  readonly unitsCount?: number;
  readonly capacity?: number;
}

export interface ApiUnitLocationRef {
  readonly id: number;
  readonly name: string;
}

export interface ApiUnitOccupancy {
  readonly totalCapacity: number;
  readonly used: number;
  readonly percent: number;
}

/** GET /api/Units/fetch response item */
export interface ApiUnitItem {
  readonly id: number;
  readonly name: string;
  readonly address?: string;
  readonly location?: ApiUnitLocationRef;
  readonly zonesCount?: number;
  readonly occupancy?: ApiUnitOccupancy;
  readonly status?: ApiLocationStatus;
  /** @deprecated use status.isActive */
  readonly active?: boolean;
  /** @deprecated use location.id */
  readonly locationId?: number;
  /** @deprecated use location.name */
  readonly locationName?: string;
  /** @deprecated use occupancy.totalCapacity */
  readonly capacity?: number;
  /** @deprecated use occupancy.used */
  readonly used?: number;
  readonly available?: number;
  /** @deprecated use occupancy.percent */
  readonly occupancyPercent?: number;
}

/** GET /api/Zone/fetch response item */
export interface ApiZoneItem {
  readonly id: number;
  readonly name: string;
  readonly unit?: ApiUnitLocationRef;
  readonly location?: ApiUnitLocationRef;
  readonly systemsCount?: number;
  readonly occupancy?: ApiUnitOccupancy;
  readonly status?: ApiLocationStatus;
  readonly address?: string;
  /** @deprecated use unit.name */
  readonly unitName?: string;
  /** @deprecated use status.isActive */
  readonly active?: boolean;
  /** @deprecated use unit.id */
  readonly unitId?: number;
  /** @deprecated use location.id */
  readonly locationId?: number;
  /** @deprecated use location.name */
  readonly locationName?: string;
  readonly capacity?: number;
  readonly used?: number;
  readonly occupancyPercent?: number;
}

export interface ApiSystemTypeRef {
  readonly value: number;
  readonly title?: string;
}

/** GET /api/System/fetch response item */
export interface ApiSystemItem {
  readonly id: number;
  readonly name: string;
  readonly location?: ApiUnitLocationRef;
  readonly unit?: ApiUnitLocationRef;
  readonly zone?: ApiUnitLocationRef;
  readonly systemType?: ApiSystemTypeRef | number;
  readonly layersCount?: number;
  readonly occupancy?: ApiUnitOccupancy;
  readonly status?: ApiLocationStatus;
  readonly address?: string;
  /** @deprecated use zone.name */
  readonly zoneName?: string;
  /** @deprecated use status.isActive */
  readonly active?: boolean;
  /** @deprecated use zone.id */
  readonly zoneId?: number;
  /** @deprecated use unit.id */
  readonly unitId?: number;
  /** @deprecated use location.id */
  readonly locationId?: number;
  /** @deprecated use unit.name */
  readonly unitName?: string;
  /** @deprecated use location.name */
  readonly locationName?: string;
  readonly capacity?: number;
  readonly used?: number;
  readonly systemsCount?: number;
  readonly occupancyPercent?: number;
}

/** GET /api/Layer/fetch response item */
export interface ApiLayerItem {
  readonly id: number;
  readonly name: string;
  readonly location?: ApiUnitLocationRef;
  readonly unit?: ApiUnitLocationRef;
  readonly zone?: ApiUnitLocationRef;
  readonly system?: ApiUnitLocationRef;
  readonly occupancy?: ApiUnitOccupancy;
  readonly status?: ApiLocationStatus;
  readonly address?: string;
  /** @deprecated use status.isActive */
  readonly active?: boolean;
  /** @deprecated use system.id */
  readonly systemId?: number;
  /** @deprecated use zone.id */
  readonly zoneId?: number;
  /** @deprecated use unit.id */
  readonly unitId?: number;
  /** @deprecated use location.id */
  readonly locationId?: number;
  readonly capacity?: number;
  readonly used?: number;
  readonly available?: number;
  /** @deprecated use occupancy.percent */
  readonly occupancyPercent?: number;
  readonly systemName?: string;
  readonly zoneName?: string;
  readonly unitName?: string;
  readonly locationName?: string;
}

/** Layer distribution item for POST /api/Batch/Create */
export interface ApiCreateBatchLayerItem {
  readonly quantity: number;
  readonly layerId: number;
}

/** POST /api/Batch/Create request body */
export interface ApiCreateBatchCommand {
  readonly currentUserId: string;
  readonly batch: {
    readonly cropTypeId: number;
    readonly quantity: number;
    readonly layers: readonly ApiCreateBatchLayerItem[];
  };
}

/** PUT /api/Batch/Move request body */
export interface ApiMoveBatchDto {
  readonly housingId: number;
  readonly quantity: number;
  readonly layerId: number;
}

/** POST /api/Losses/Create — unified loss create (mode selects scenario). */
export enum LossCreateMode {
  HousingPartial = 1,
  HousingFull = 2,
  LayerFull = 3,
  BatchWipe = 4,
  LocationWipe = 5,
  UnitWipe = 6,
  ZoneWipe = 7,
  SystemWipe = 8,
}

export interface ApiCreateLossCommand {
  readonly mode: LossCreateMode;
  readonly lossType: number;
  readonly reason: string;
  readonly notes?: string;
  readonly creationDate?: string;
  readonly currentUserId: string;
  readonly housingId?: number;
  readonly quantity?: number;
  readonly layerId?: number;
  readonly stockBatchId?: number;
  readonly locationId?: number;
  readonly unitId?: number;
  readonly zoneId?: number;
  readonly systemId?: number;
}

/** @deprecated Use ApiCreateLossCommand with LossCreateMode instead. */
export interface ApiCreateScopedLossCommand {
  readonly lossType: number;
  readonly reason: string;
  readonly notes?: string;
  readonly creationDate?: string;
  readonly currentUserId: string;
  readonly source: number;
  readonly stockBatchId?: number;
  readonly locationId?: number;
  readonly unitId?: number;
  readonly zoneId?: number;
  readonly plantSystemId?: number;
  readonly layerId?: number;
  readonly totalQuantity?: number;
  readonly items?: readonly ApiCreateLossItem[];
}

export interface ApiCreateLossItem {
  readonly housingId: number;
  readonly quantity: number;
}

/** Query params for paginated fetch endpoints */
export interface ApiFetchParams {
  readonly PageNumber?: number;
  readonly PageSize?: number;
  readonly Search?: string;
  readonly Active?: boolean;
  readonly IgnoreInactive?: boolean;
  readonly SetOrder?: string;
}

/** Extended params for BatchDistribution/fetch */
export interface ApiDistributionFetchParams extends ApiFetchParams {
  readonly PipeId?: number;
  readonly LayerId?: number;
  readonly SystemId?: number;
  readonly ZoneId?: number;
  readonly UnitId?: number;
  readonly LocationId?: number;
  readonly StockBatchId?: number;
  readonly Status?: string;
  readonly SetOrder?: string;
}

/** GET /api/Losses/preview query params */
export interface ApiLossPreviewParams {
  readonly StockBatchId?: number;
  readonly LocationId?: number;
  readonly UnitId?: number;
  readonly ZoneId?: number;
  readonly SystemId?: number;
  readonly LayerId?: number;
  readonly HousingId?: number;
}

export interface ApiLossPreviewNamedRef {
  readonly id: number;
  readonly name: string;
}

export interface ApiLossPreviewPlacement {
  readonly location?: ApiLossPreviewNamedRef;
  readonly unit?: ApiLossPreviewNamedRef;
  readonly zone?: ApiLossPreviewNamedRef;
  readonly system?: ApiLossPreviewNamedRef;
  readonly layer?: ApiLossPreviewNamedRef;
}

export interface ApiLossPreviewHousing {
  readonly id: number;
  readonly quantity: number;
  readonly placement: ApiLossPreviewPlacement;
}

export interface ApiLossPreviewInfrastructure {
  readonly location?: ApiLossPreviewNamedRef | null;
  readonly unit?: ApiLossPreviewNamedRef | null;
  readonly zone?: ApiLossPreviewNamedRef | null;
  readonly system?: ApiLossPreviewNamedRef | null;
  readonly layer?: ApiLossPreviewNamedRef | null;
  readonly housing?: ApiLossPreviewNamedRef | null;
}

export interface ApiLossPreviewBatch {
  readonly id: number;
  readonly batchNumber?: string;
  readonly cropType?: string | ApiLossPreviewNamedRef | null;
}

export interface ApiLossPreviewResult {
  readonly scopeType: 'infrastructure' | 'batch';
  readonly batch?: ApiLossPreviewBatch | null;
  readonly infrastructure?: ApiLossPreviewInfrastructure | null;
  readonly summary: {
    readonly housingCount: number;
    readonly totalPlants: number;
  };
  readonly housings: readonly ApiLossPreviewHousing[];
}

/** Extended params for Losses/fetch */
export interface ApiLossesFetchParams extends Omit<ApiFetchParams, 'Active'> {
  readonly BatchId?: number;
  readonly LocationId?: number;
  readonly UnitId?: number;
  readonly ZoneId?: number;
  readonly SystemId?: number;
  readonly HousingId?: number;
  readonly LayerId?: number;
  readonly LossType?: number;
  readonly DateFrom?: string;
  readonly DateTo?: string;
}

/** GET /api/Customer/fetch response item (nested + legacy flat fields). */
export interface ApiCustomerItem {
  readonly id: number;
  readonly name: string;
  readonly contact?: {
    readonly phone?: string;
    readonly email?: string;
    readonly address?: string;
  };
  readonly status?: {
    readonly isActive?: boolean;
    readonly title?: string;
  };
  readonly purchases?: {
    readonly totalAmount?: number;
    readonly invoiceCount?: number;
  };
  readonly creationDate?: string;
  /** Legacy flat fields */
  readonly phone?: string;
  readonly email?: string;
  readonly address?: string;
  readonly active?: boolean;
  readonly totalPurchases?: number;
  readonly invoiceCount?: number;
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

/** GET /api/Harvest/Fetch params */
export interface ApiHarvestFetchParams extends ApiFetchParams {
  readonly StockBatchId?: number;
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

/** GET /api/Invoice/fetch response item (nested + legacy flat fields). */
export interface ApiInvoiceItem {
  readonly id: number;
  readonly invoiceNumber?: string;
  readonly customer?: {
    readonly id?: number;
    readonly name?: string;
    readonly phone?: string;
  };
  readonly invoiceDate?: string;
  readonly dueDate?: string;
  readonly paymentDate?: string;
  readonly totalAmount?: number;
  readonly payment?: {
    readonly isPaid?: boolean;
    readonly title?: string;
  };
  readonly pieceCount?: number;
  readonly grossWeightKg?: number;
  readonly rootWeightPerPlantKg?: number;
  readonly netWeightKg?: number;
  readonly sources?: readonly ApiInvoiceSourceItem[];
  /** Legacy flat fields */
  readonly customerId?: number;
  readonly customerName?: string;
  readonly customerPhone?: string;
  readonly isPaid?: boolean;
  readonly status?: string;
  readonly items?: readonly ApiInvoiceDetailItem[];
}

export interface ApiInvoiceSourceItem {
  readonly cropType?: string;
  readonly pieceCount?: number;
  readonly grossWeightKg?: number;
  readonly netWeightKg?: number;
  readonly pricePerKg?: number;
  readonly totalAmount?: number;
}

/** Query params for GET /api/Invoice/fetch */
export interface ApiInvoicesFetchParams extends ApiFetchParams {
  readonly CustomerId?: number;
  readonly InvoiceId?: number;
  readonly InvoiceNumber?: string;
  readonly IsPaid?: boolean;
  readonly HasDueDate?: boolean;
  readonly CropTypeId?: number;
  readonly StockBatchId?: number;
  readonly InvoiceDateFrom?: string;
  readonly InvoiceDateTo?: string;
  readonly DueDateFrom?: string;
  readonly DueDateTo?: string;
  readonly PaymentDateFrom?: string;
  readonly PaymentDateTo?: string;
  readonly MinAmount?: number;
  readonly MaxAmount?: number;
  readonly SetOrder?: string;
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

/** POST /api/Invoice/Create — harvest invoice from housings */
export interface ApiCreateInvoiceHousingItem {
  readonly housingId: number;
  readonly quantity: number;
  readonly weightKg: number;
}

export interface ApiCreateInvoiceCropPriceItem {
  readonly cropTypeId: number;
  readonly pricePerKg: number;
}

export interface ApiCreateInvoiceCommand {
  readonly currentUserId: string;
  readonly customerId: number;
  readonly invoiceDate: string;
  readonly dueDate?: string | null;
  readonly notes?: string | null;
  /** 0 = no roots */
  readonly rootWeightPerPlantKg: number;
  readonly cropPrices: readonly ApiCreateInvoiceCropPriceItem[];
  readonly housings: readonly ApiCreateInvoiceHousingItem[];
}

/** @deprecated legacy shape — use {@link ApiCreateInvoiceCommand} */
export interface ApiCreateInvoiceLegacyCommand {
  readonly currentUserId: string;
  readonly invoice: ApiInvoiceItem;
}

/** POST /api/Invoice/mark-paid */
export interface ApiMarkInvoicePaidCommand {
  readonly currentUserId: string;
  readonly invoiceId: number;
  readonly paymentDate?: string;
}

/** POST /api/Invoice/due-date */
export interface ApiUpdateInvoiceDueDateCommand {
  readonly currentUserId: string;
  readonly invoiceId: number;
  readonly dueDate?: string | null;
}
