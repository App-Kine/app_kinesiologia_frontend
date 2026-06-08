import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, ROL_SUPERADMIN, ROL_PROFESOR } from './auth.service';

/**
 * Guards basados en rol. Cubren RNF-19 (autorización por rol en frontend).
 *
 * - adminGuard: solo permite si el usuario tiene rol SUPERADMIN.
 * - docenteGuard: solo permite si el usuario tiene rol PROFESOR.
 *
 * Si no está autenticado → /login.
 * Si está autenticado pero no tiene el rol → redirige al panel que sí le corresponde.
 *
 * NOTA DE SEGURIDAD: estos guards son control de navegación/UX en el cliente,
 * NO la frontera de seguridad. La autorización por rol REAL la impone el backend
 * validando el JWT y el rol en cada endpoint; el guard solo evita mostrar
 * pantallas que igualmente no devolverían datos sin el rol correcto.
 */

async function _guardForRol(
    rol: string,
    auth: AuthService,
    router: Router
): Promise<boolean> {
    if (!(await auth.isAuthenticated())) {
        router.navigateByUrl('/login', { replaceUrl: true });
        return false;
    }

    const roles = await auth.getRoles();
    if (roles.includes(rol)) return true;

    // No tiene el rol pedido: lo mandamos a su panel correcto
    router.navigateByUrl(auth.rutaDestinoSegunRoles(roles), {
        replaceUrl: true,
    });
    return false;
}

export const adminGuard: CanActivateFn = async () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    return _guardForRol(ROL_SUPERADMIN, auth, router);
};

export const docenteGuard: CanActivateFn = async () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    return _guardForRol(ROL_PROFESOR, auth, router);
};
