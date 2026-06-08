import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Guard de sesión para rutas protegidas. Si no hay token guardado, redirige a
 * /login. Solo comprueba la PRESENCIA del token (no su vigencia): si el token
 * está expirado, el backend responde 401 y el authInterceptor cierra la sesión.
 *
 * NOTA DE SEGURIDAD: este guard solo controla la navegación en el navegador. La
 * autorización real es server-side: el backend valida el JWT en cada endpoint.
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
