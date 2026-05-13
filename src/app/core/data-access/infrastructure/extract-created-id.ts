/**
 * Reads `id` / `Id` from common API shapes (flat body, `result`, or `result.items[0]`).
 * Swagger POST responses vary — normalize here so create flows use the real server id.
 */
function readIdFromRecord(rec: Record<string, unknown>): string | undefined {
  const toId = (raw: unknown): string | undefined => {
    if (typeof raw === 'number' && Number.isFinite(raw)) return String(raw);
    if (typeof raw === 'string' && raw.trim() !== '') return raw.trim();
    return undefined;
  };

  // Priority 1: canonical keys.
  const direct = toId(rec['id'] ?? rec['Id']);
  if (direct !== undefined) return direct;

  // Priority 2: API-specific keys like `unitId`, `zoneId`, `cropTypeId`, ...
  for (const [key, value] of Object.entries(rec)) {
    if (!/id$/i.test(key)) continue;
    const candidate = toId(value);
    if (candidate !== undefined) return candidate;
  }

  return undefined;
}

export function extractCreatedId(body: unknown): string {
  if (body == null || typeof body !== 'object') {
    throw new Error('Create response missing id');
  }
  const o = body as Record<string, unknown>;
  const direct = readIdFromRecord(o);
  if (direct !== undefined) return direct;

  const result = o['result'];
  if (result && typeof result === 'object') {
    const r = result as Record<string, unknown>;
    const fromResult = readIdFromRecord(r);
    if (fromResult !== undefined) return fromResult;

    const items = r['items'];
    if (Array.isArray(items) && items.length > 0 && items[0] && typeof items[0] === 'object') {
      const nested = readIdFromRecord(items[0] as Record<string, unknown>);
      if (nested !== undefined) return nested;
    }
  }

  throw new Error('Create response did not include an id');
}
