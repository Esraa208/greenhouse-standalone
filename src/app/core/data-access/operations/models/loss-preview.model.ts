export interface LossPreviewRef {
  readonly id: string;
  readonly name: string;
}

export interface LossPreviewHousing {
  readonly id: string;
  readonly quantity: number;
  readonly pathLabel: string;
  readonly layerId?: string;
}

export interface LossPreviewInfrastructure {
  readonly location?: LossPreviewRef;
  readonly unit?: LossPreviewRef;
  readonly zone?: LossPreviewRef;
  readonly system?: LossPreviewRef;
  readonly layer?: LossPreviewRef;
  readonly housing?: LossPreviewRef;
}

export interface LossPreviewBatch {
  readonly id: string;
  readonly batchNumber: string;
  readonly cropType: string;
}

export interface LossScopePreview {
  readonly scopeType: 'infrastructure' | 'batch';
  readonly batch?: LossPreviewBatch;
  readonly infrastructure?: LossPreviewInfrastructure;
  readonly summary: {
    readonly housingCount: number;
    readonly totalPlants: number;
  };
  readonly housings: readonly LossPreviewHousing[];
}
