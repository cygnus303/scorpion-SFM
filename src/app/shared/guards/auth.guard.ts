import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { IdentityService } from '../services/identity.service';

export const authGuard: CanActivateFn = (route, state) => {
  const identityService = inject(IdentityService);
  const router = inject(Router);

  if (identityService.isAuthenticate()) {
    return true;
  } else {
    router.navigate(['/login']);
    return false;
  }
};
