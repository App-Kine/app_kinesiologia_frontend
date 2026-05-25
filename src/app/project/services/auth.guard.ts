import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Guard para rutas protegidas. Si no hay token guardado, redirige a /login.
 *
 * Uso en app.routes.ts:
 *   { path: 'tabs', canActivate: [authGuard], loadComponent: ... }
 */
export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (await auth.isAuthenticated()) return true;
  router.navigateByUrl('/login', { replaceUrl: true });
  return false;
};
