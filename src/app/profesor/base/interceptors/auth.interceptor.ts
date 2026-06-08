import { inject } from '@angular/core';
import {
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, from, switchMap, throwError } from 'rxjs';

import { AuthService } from '../../project/services/auth.service';
import { environment } from '../../../../environments/environment';

/**
 * Interceptor de seguridad: maneja respuestas HTTP 401/403 reales del backend.
 *
 * - 401 (token ausente/inválido/expirado): limpiamos la sesión (reutilizando
 *   AuthService.logout, que borra token/refresh/usuario/panel y redirige a
 *   /login) y propagamos un error claro de sesión expirada. Antes el panel
 *   solo inspeccionaba `data.status` de respuestas 200, así que un 401 dejaba
 *   al usuario atascado con un token inválido y sin redirección.
 * - 403 (sin permiso): propagamos un error "No autorizado" claro, sin tocar la
 *   sesión (el token es válido, solo falta permiso).
 *
 * Se registra en main.ts con provideHttpClient(withInterceptors([...])).
 */
let redirigiendoLogin = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 401) {
          // Sesión vencida/inválida: limpiar y mandar al login una sola vez
          // (evita loops si caen varias requests en paralelo).
          const limpiar = redirigiendoLogin
            ? Promise.resolve()
            : (redirigiendoLogin = true,
               authService.logout().finally(() => {
                 setTimeout(() => (redirigiendoLogin = false), 1500);
               }));
          return from(limpiar).pipe(
            switchMap(() =>
              throwError(
                () =>
                  new Error(
                    environment.ERROR_EXPIRED_TOKEN || 'Su sesión ha expirado'
                  )
              )
            )
          );
        }
        if (error.status === 403) {
          return throwError(
            () =>
              new Error(
                'No autorizado: no tiene permisos para realizar esta acción.'
              )
          );
        }
      }
      return throwError(() => error);
    })
  );
};
