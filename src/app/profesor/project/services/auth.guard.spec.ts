import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { authGuard } from './auth.guard';
import { AuthService } from './auth.service';

/**
 * Tests del authGuard (RNF: rutas protegidas).
 *
 * - Con token (isAuthenticated true) → deja pasar (true), sin redirigir.
 * - Sin token (isAuthenticated false) → bloquea (false) y redirige a /login.
 *
 * Determinista: AuthService y Router son spies.
 */
describe('authGuard', () => {
  let authSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  function run(): Promise<boolean> {
    return TestBed.runInInjectionContext(() => authGuard(null as any, null as any)) as Promise<boolean>;
  }

  beforeEach(() => {
    authSpy = jasmine.createSpyObj<AuthService>('AuthService', ['isAuthenticated']);
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });
  });

  it('deja pasar cuando hay token (isAuthenticated true)', async () => {
    authSpy.isAuthenticated.and.resolveTo(true);

    await expectAsync(run()).toBeResolvedTo(true);
    expect(routerSpy.navigateByUrl).not.toHaveBeenCalled();
  });

  it('bloquea y redirige a /login cuando no hay token', async () => {
    authSpy.isAuthenticated.and.resolveTo(false);

    await expectAsync(run()).toBeResolvedTo(false);
    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/login', { replaceUrl: true });
  });
});
