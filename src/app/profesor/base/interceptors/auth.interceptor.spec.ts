import { TestBed } from '@angular/core/testing';
import {
  HttpErrorResponse,
  HttpHandlerFn,
  HttpRequest,
} from '@angular/common/http';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../../project/services/auth.service';
import { environment } from '../../../../environments/environment';

/**
 * Tests del interceptor de seguridad (auth.interceptor).
 *
 * Cubren los tres caminos:
 *  - 401: limpia sesión (AuthService.logout) y propaga error de sesión expirada.
 *  - 403: propaga error "No autorizado" SIN desloguear.
 *  - otros errores: se relanzan tal cual.
 *
 * Determinista: no hay red real. Se invoca el interceptor con un `next` mock
 * que devuelve `throwError(HttpErrorResponse)`. Router y AuthService son spies.
 */
describe('authInterceptor', () => {
  let routerSpy: jasmine.SpyObj<Router>;
  let authSpy: jasmine.SpyObj<AuthService>;

  const req = new HttpRequest('GET', '/api/algo');

  /** Ejecuta el interceptor dentro del contexto de inyección de TestBed. */
  function run(next: HttpHandlerFn) {
    return TestBed.runInInjectionContext(() => authInterceptor(req, next));
  }

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    authSpy = jasmine.createSpyObj<AuthService>('AuthService', ['logout']);
    // logout resuelve OK por defecto.
    authSpy.logout.and.returnValue(Promise.resolve());

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: AuthService, useValue: authSpy },
      ],
    });
  });

  it('deja pasar respuestas exitosas sin tocar la sesión', (done) => {
    const next: HttpHandlerFn = () => of({ ok: true } as any);

    run(next).subscribe({
      next: (v: any) => {
        expect(v).toEqual({ ok: true } as any);
        expect(authSpy.logout).not.toHaveBeenCalled();
        done();
      },
      error: () => done.fail('no debería emitir error'),
    });
  });

  it('ante 401 limpia la sesión (logout) y propaga error de sesión expirada', (done) => {
    const err = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' });
    const next: HttpHandlerFn = () => throwError(() => err);

    run(next).subscribe({
      next: () => done.fail('debería emitir error'),
      error: (e: Error) => {
        expect(authSpy.logout).toHaveBeenCalledTimes(1);
        expect(e).toEqual(jasmine.any(Error));
        expect(e.message).toBe(environment.ERROR_EXPIRED_TOKEN);
        done();
      },
    });
  });

  it('ante 403 propaga error "No autorizado" SIN desloguear', (done) => {
    const err = new HttpErrorResponse({ status: 403, statusText: 'Forbidden' });
    const next: HttpHandlerFn = () => throwError(() => err);

    run(next).subscribe({
      next: () => done.fail('debería emitir error'),
      error: (e: Error) => {
        expect(authSpy.logout).not.toHaveBeenCalled();
        expect(routerSpy.navigateByUrl).not.toHaveBeenCalled();
        expect(e).toEqual(jasmine.any(Error));
        expect(e.message).toContain('No autorizado');
        done();
      },
    });
  });

  it('relanza tal cual otros errores HTTP (ej. 500) sin desloguear', (done) => {
    const err = new HttpErrorResponse({ status: 500, statusText: 'Server Error' });
    const next: HttpHandlerFn = () => throwError(() => err);

    run(next).subscribe({
      next: () => done.fail('debería emitir error'),
      error: (e: unknown) => {
        expect(e).toBe(err);
        expect(authSpy.logout).not.toHaveBeenCalled();
        done();
      },
    });
  });

  it('relanza tal cual errores no-HTTP sin desloguear', (done) => {
    const err = new Error('boom');
    const next: HttpHandlerFn = () => throwError(() => err);

    run(next).subscribe({
      next: () => done.fail('debería emitir error'),
      error: (e: unknown) => {
        expect(e).toBe(err);
        expect(authSpy.logout).not.toHaveBeenCalled();
        done();
      },
    });
  });
});
