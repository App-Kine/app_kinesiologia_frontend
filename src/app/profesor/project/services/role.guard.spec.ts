import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { adminGuard, docenteGuard } from './role.guard';
import {
  AuthService,
  ROL_SUPERADMIN,
  ROL_PROFESOR,
} from './auth.service';

/**
 * Tests de los guards por rol (RNF-19: autorización por rol en frontend).
 *
 * adminGuard / docenteGuard:
 *  - No autenticado → bloquea y redirige a /login.
 *  - Autenticado con el rol correcto → deja pasar.
 *  - Autenticado SIN el rol → bloquea y redirige al panel que sí le corresponde
 *    (vía AuthService.rutaDestinoSegunRoles).
 *
 * Determinista: AuthService y Router son spies.
 */
describe('role guards', () => {
  let authSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  function run(guard: typeof adminGuard): Promise<boolean> {
    return TestBed.runInInjectionContext(() =>
      guard(null as any, null as any)
    ) as Promise<boolean>;
  }

  beforeEach(() => {
    authSpy = jasmine.createSpyObj<AuthService>('AuthService', [
      'isAuthenticated',
      'getRoles',
      'rutaDestinoSegunRoles',
    ]);
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });
  });

  describe('adminGuard', () => {
    it('bloquea y redirige a /login si no está autenticado', async () => {
      authSpy.isAuthenticated.and.resolveTo(false);

      await expectAsync(run(adminGuard)).toBeResolvedTo(false);
      expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/login', { replaceUrl: true });
      expect(authSpy.getRoles).not.toHaveBeenCalled();
    });

    it('deja pasar si tiene rol SUPERADMIN', async () => {
      authSpy.isAuthenticated.and.resolveTo(true);
      authSpy.getRoles.and.resolveTo([ROL_SUPERADMIN]);

      await expectAsync(run(adminGuard)).toBeResolvedTo(true);
      expect(routerSpy.navigateByUrl).not.toHaveBeenCalled();
    });

    it('bloquea y redirige al panel correcto si NO tiene rol SUPERADMIN', async () => {
      authSpy.isAuthenticated.and.resolveTo(true);
      authSpy.getRoles.and.resolveTo([ROL_PROFESOR]);
      authSpy.rutaDestinoSegunRoles.and.returnValue('/panel-docente');

      await expectAsync(run(adminGuard)).toBeResolvedTo(false);
      expect(authSpy.rutaDestinoSegunRoles).toHaveBeenCalledWith([ROL_PROFESOR]);
      expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/panel-docente', { replaceUrl: true });
    });
  });

  describe('docenteGuard', () => {
    it('bloquea y redirige a /login si no está autenticado', async () => {
      authSpy.isAuthenticated.and.resolveTo(false);

      await expectAsync(run(docenteGuard)).toBeResolvedTo(false);
      expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/login', { replaceUrl: true });
    });

    it('deja pasar si tiene rol PROFESOR', async () => {
      authSpy.isAuthenticated.and.resolveTo(true);
      authSpy.getRoles.and.resolveTo([ROL_PROFESOR]);

      await expectAsync(run(docenteGuard)).toBeResolvedTo(true);
      expect(routerSpy.navigateByUrl).not.toHaveBeenCalled();
    });

    it('bloquea y redirige al panel correcto si NO tiene rol PROFESOR', async () => {
      authSpy.isAuthenticated.and.resolveTo(true);
      authSpy.getRoles.and.resolveTo([ROL_SUPERADMIN]);
      authSpy.rutaDestinoSegunRoles.and.returnValue('/panel-admin');

      await expectAsync(run(docenteGuard)).toBeResolvedTo(false);
      expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/panel-admin', { replaceUrl: true });
    });
  });
});
