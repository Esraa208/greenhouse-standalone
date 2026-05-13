import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  // Basic mock check, adjust to real auth logic
  const isLoggedIn = !!localStorage.getItem('gh_token');
  
  if (!isLoggedIn) {
    // For local development without login mock, just allow it through initially
    // return router.createUrlTree(['/login']);
    return true; 
  }
  return true;
};





