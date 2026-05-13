import { HttpErrorResponse } from '@angular/common/http';

export interface AppError {
  code: number | string;
  message: string;
  details?: unknown;
}

export function isAppError(error: unknown): error is AppError {
  if (!error || typeof error !== 'object') return false;
  const candidate = error as Partial<AppError>;
  return typeof candidate.message === 'string' && 'code' in candidate;
}

export function normalizeAppError(error: unknown): AppError {
  if (isAppError(error)) return error;

  if (error instanceof HttpErrorResponse) {
    const payload = error.error as { code?: unknown; message?: unknown; detailize?: unknown; details?: unknown } | null | undefined;
    const message =
      typeof payload?.message === 'string' && payload.message.trim()
        ? payload.message
        : typeof error.message === 'string' && error.message.trim()
          ? error.message
          : 'A network error occurred.';

    return {
      code: typeof payload?.code === 'number' || typeof payload?.code === 'string' ? payload.code : error.status || -1,
      message,
      details: payload?.details ?? payload?.detailize ?? error.error,
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
