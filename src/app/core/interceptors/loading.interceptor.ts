import { HttpInterceptorFn } from '@angular/common/http';
import { finalize } from 'rxjs';
// Optional: If you had a global loading service, you'd inject it here
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    finalize(() => {
      // Hook into a global transition signal
    })
  );
};





