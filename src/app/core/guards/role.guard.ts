import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ApiRole } from '../../shared/models/auth.model';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const allowed: ApiRole[] = route.data['roles'] ?? [];

  if (!auth.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  const role = auth.role();
  if (allowed.length === 0 || (role && allowed.includes(role))) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};
