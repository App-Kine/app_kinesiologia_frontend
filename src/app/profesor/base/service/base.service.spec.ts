import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { Platform } from '@ionic/angular';
import { NativeStorage } from '@ionic-native/native-storage/ngx';

import { BaseService } from './base.service';
import { AnalyticsService } from '../../project/services/analytics.service';
import { environment } from '../../../../environments/environment';

/**
 * Tests de BaseService.post + proccessResponse (privado, ejercitado vía post).
 *
 * Cubre el contrato compartido por todos los servicios CRUD:
 *   - body `arg=<json url-encoded>` y Content-Type x-www-form-urlencoded
 *   - header Authorization con el token guardado
 *   - {status:OK} resuelve con data; {status:ERROR} rechaza
 *   - sesión expirada (mensaje con "expirada"/"Token"): limpia token + redirige /login
 *   - status desconocido → rechaza ("Invalid Response From Server")
 *
 * Determinista: HttpTestingController, plataforma web (localStorage), Router stub.
 */
const URL = environment.BASE_API_URL + 'algunEndpoint';

/** post() es async (await headers) → la request se despacha en una microtarea. */
async function tick(): Promise<void> {
  for (let i = 0; i < 5; i++) await Promise.resolve();
}

describe('BaseService (post / proccessResponse)', () => {
  let service: BaseService;
  let httpMock: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;
  let analyticsSpy: jasmine.SpyObj<AnalyticsService>;

  beforeEach(() => {
    localStorage.clear();
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    routerSpy.navigateByUrl.and.resolveTo(true);
    analyticsSpy = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['ErrorHandler']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        BaseService,
        { provide: Router, useValue: routerSpy },
        { provide: NativeStorage, useValue: jasmine.createSpyObj('NativeStorage', ['setItem', 'getItem', 'remove', 'clear']) },
        // Plataforma web → storage por localStorage.
        { provide: Platform, useValue: { is: (k: string) => k === 'desktop' } },
        { provide: AnalyticsService, useValue: analyticsSpy },
      ],
    });

    service = TestBed.inject(BaseService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('serializa el body como arg=<json> y setea Content-Type x-www-form-urlencoded', async () => {
    const promise = service.post(URL, { a: 1, b: 'há cé' });
    await tick();
    const req = httpMock.expectOne(URL);

    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Content-Type')).toBe('application/x-www-form-urlencoded');
    const body = req.request.body as string;
    expect(body.startsWith('arg=')).toBe(true);
    expect(JSON.parse(decodeURIComponent(body.slice(4)))).toEqual({ a: 1, b: 'há cé' });

    req.flush({ status: 'OK', data: { ok: true } });
    await promise;
  });

  it('agrega header Authorization cuando hay token guardado', async () => {
    localStorage.setItem(environment.DATA_KEY_TOKEN, JSON.stringify('tok-xyz'));

    const promise = service.post(URL, {});
    await tick();
    const req = httpMock.expectOne(URL);
    expect(req.request.headers.get('Authorization')).toBe('tok-xyz');

    req.flush({ status: 'OK', data: null });
    await promise;
  });

  it('NO agrega Authorization cuando no hay token', async () => {
    const promise = service.post(URL, {});
    await tick();
    const req = httpMock.expectOne(URL);
    expect(req.request.headers.has('Authorization')).toBe(false);

    req.flush({ status: 'OK', data: 1 });
    await promise;
  });

  it('{status:OK} resuelve con data', async () => {
    const promise = service.post(URL, {});
    await tick();
    httpMock.expectOne(URL).flush({ status: 'OK', data: { id: 9 } });
    await expectAsync(promise).toBeResolvedTo({ id: 9 });
  });

  it('{status:ERROR} (error genérico) rechaza y NO redirige', async () => {
    const promise = service.post(URL, {});
    await tick();
    httpMock.expectOne(URL).flush({ status: 'ERROR', error: { message: 'Boom genérico' } });

    await expectAsync(promise).toBeRejected();
    expect(routerSpy.navigateByUrl).not.toHaveBeenCalled();
    expect(analyticsSpy.ErrorHandler).toHaveBeenCalled();
  });

  it('status desconocido rechaza con "Invalid Response From Server"', async () => {
    const promise = service.post(URL, {});
    await tick();
    httpMock.expectOne(URL).flush({ status: 'WAT' });
    await expectAsync(promise).toBeRejectedWithError(/Invalid Response From Server/);
  });

  describe('sesión expirada', () => {
    it('mensaje con "expirada" → limpia token, redirige /login y rechaza con ERROR_EXPIRED_TOKEN', async () => {
      localStorage.setItem(environment.DATA_KEY_TOKEN, JSON.stringify('tok-viejo'));

      const promise = service.post(URL, {});
      await tick();
      httpMock.expectOne(URL).flush({ status: 'ERROR', error: { message: 'La sesión está expirada' } });

      await expectAsync(promise).toBeRejectedWithError(environment.ERROR_EXPIRED_TOKEN);
      expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/login', { replaceUrl: true });
      // El token fue removido del storage (web → localStorage).
      expect(localStorage.getItem(environment.DATA_KEY_TOKEN)).toBeNull();
    });

    it('mensaje con "Token" → también trata como sesión expirada', async () => {
      const promise = service.post(URL, {});
      await tick();
      httpMock.expectOne(URL).flush({ status: 'ERROR', error: { message: 'Invalid Token signature' } });

      await expectAsync(promise).toBeRejectedWithError(environment.ERROR_EXPIRED_TOKEN);
      expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/login', { replaceUrl: true });
    });
  });

  it('mensaje "Invalid Credentials" → mensaje amigable de contraseña', async () => {
    const promise = service.post(URL, {});
    await tick();
    httpMock.expectOne(URL).flush({ status: 'ERROR', error: { message: 'Invalid Credentials' } });

    // handleError reescribe el mensaje pero devuelve el objeto error tal cual
    // (no necesariamente una instancia de Error), así que validamos por message.
    const err = await promise.then(() => null, (e) => e);
    expect(err).withContext('debe rechazar').not.toBeNull();
    expect(err.message).toContain('contraseña ingresada no es correcta');
  });
});
