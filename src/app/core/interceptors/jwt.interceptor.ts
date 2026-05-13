import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  // Replace with a real auth service if needed later
  const token = localStorage.getItem('gh_token');
  if (token) {
    const cloned = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
    return next(cloned);
  }
  return next(req);
};





