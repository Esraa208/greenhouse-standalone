import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { GhToastService } from '@app/core';
import { isAppError, normalizeAppError } from '../errors/app-error';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(GhToastService);

  return next(req).pipe(
    catchError((err: unknown) => {
      const normalized = isAppError(err) ? err : normalizeAppError(err);
      toastService.error(normalized.message);
      return throwError(() => normalized);
    })
  );
};
