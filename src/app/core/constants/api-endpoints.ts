export enum ApiController {
  Batch = 'Batch',
  BatchDistribution = 'BatchDistribution',
  CropType = 'CropType',
  Customer = 'Customer',
  Harvest = 'Harvest',
  Invoice = 'Invoice',
  Layer = 'Layer',
  Locations = 'Locations',
  Losses = 'Losses',
  Pipe = 'Pipe',
  System = 'System',
  Units = 'Units',
  Zone = 'Zone',
}

export enum ApiAction {
  Fetch = 'fetch',
  Create = 'Create',
  Update = 'update',
  Delete = 'Delete',
  Move = 'Move',
  Preview = 'preview',
}

/**
 * Helper to construct the full endpoint path
 * Usage: getEndpoint(ApiController.Locations, ApiAction.Fetch) -> 'Locations/fetch'
 */
export function getEndpoint(controller: ApiController, action: ApiAction): string {
  return `${controller}/${action}`;
}
