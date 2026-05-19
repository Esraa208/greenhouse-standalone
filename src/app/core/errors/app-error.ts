import { HttpErrorResponse } from '@angular/common/http';

export interface AppError {
  code: number | string;
  message: string;
  details?: unknown;
}

function pickFirstApiMessage(
  payload?: { message?: unknown; detail?: unknown; title?: unknown },
  fallback?: string,
): string | undefined {
  const candidates = [payload?.message, payload?.detail, payload?.title, fallback];
  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

export function isAppError(error: unknown): error is AppError {
  if (!error || typeof error !== 'object') return false;
  const candidate = error as Partial<AppError>;
  return typeof candidate.message === 'string' && 'code' in candidate;
}

export function normalizeAppError(error: unknown): AppError {
  if (isAppError(error)) return error;

  if (error instanceof HttpErrorResponse) {
    const payload = error.error as {
      code?: unknown;
      message?: unknown;
      title?: unknown;
      detail?: unknown;
      detailize?: unknown;
      details?: unknown;
    } | string | null | undefined;

    const payloadMessage =
      typeof payload === 'string' && payload.trim()
        ? payload.trim()
        : pickFirstApiMessage(
            payload && typeof payload === 'object' ? payload : undefined,
            error.message,
          );
    const message = payloadMessage ?? 'A network error occurred.';

    const payloadObj = payload && typeof payload === 'object' ? payload : undefined;
    return {
      code:
        typeof payloadObj?.code === 'number' || typeof payloadObj?.code === 'string'
          ? payloadObj.code
          : error.status || -1,
      message,
      details: payloadObj?.details ?? payloadObj?.detailize ?? error.error,
    };
  }

  if (error instanceof Error) {
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'A network error occurred.',
      details: error,
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: 'A network error occurred.',
    details: error,
  };
}
