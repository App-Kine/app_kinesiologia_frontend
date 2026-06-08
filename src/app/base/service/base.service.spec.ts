import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { Platform } from '@ionic/angular';
import { NativeStorage } from '@ionic-native/native-storage/ngx';

import { BaseService } from './base.service';
import { AnalyticsService } from '../../project/services/analytics.service';
import { environment } from '../../../environments/environment';

describe('BaseService.handleError', () => {
  let service: BaseService;
  let analyticsSpy: jasmine.SpyObj<AnalyticsService>;

  beforeEach(() => {
    analyticsSpy = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['ErrorHandler']);

    TestBed.configureTestingModule({
      providers: [
        BaseService,
        // HttpClient real (no se llega a usar en handleError, pero BaseService
        // lo inyecta en el constructor).
        provideHttpClient(),
        // Mocks: no necesitamos plataforma ni storage reales para ejercitar
        // handleError (normalización de errores de transporte).
        {
          provide: Platform,
          useValue: { is: () => false } as Partial<Platform>,
        },
        {
          provide: NativeStorage,
          useValue: jasmine.createSpyObj('NativeStorage', [
            'setItem', 'getItem', 'remove', 'clear',
          ]),
        },
        { provide: AnalyticsService, useValue: analyticsSpy },
      ],
    });

    service = TestBed.inject(BaseService);
  });

  // handleError es privado: lo invocamos vía cast a any.
  const call = (err: any) => (service as any).handleError(err);

  it('status 0 -> "Sin conexión..."', () => {
    const err = new HttpErrorResponse({ status: 0, statusText: 'Unknown Error' });
    const result = call(err);
    expect(result instanceof Error).toBeTrue();
    expect(result.message).toBe('Sin conexión. Verifica tu internet e inténtalo de nuevo.');
    expect(analyticsSpy.ErrorHandler).toHaveBeenCalledWith(err);
  });

  it('status >= 500 -> error del servidor', () => {
    const err = new HttpErrorResponse({ status: 500, statusText: 'Internal Server Error' });
    const result = call(err);
    expect(result instanceof Error).toBeTrue();
    expect(result.message).toBe('Error del servidor. Intenta más tarde.');
    expect(analyticsSpy.ErrorHandler).toHaveBeenCalledWith(err);
  });

  it('status 503 también cae en el rango >= 500', () => {
    const err = new HttpErrorResponse({ status: 503, statusText: 'Service Unavailable' });
    expect(call(err).message).toBe('Error del servidor. Intenta más tarde.');
  });

  it('status 401 -> mensaje de sesión expirada (ERROR_EXPIRED_TOKEN)', () => {
    const err = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' });
    const result = call(err);
    expect(result instanceof Error).toBeTrue();
    expect(result.message).toBe(environment.ERROR_EXPIRED_TOKEN);
  });

  it('otros status HTTP devuelven el message original del HttpErrorResponse', () => {
    const err = new HttpErrorResponse({ status: 404, statusText: 'Not Found' });
    const result = call(err);
    expect(result instanceof Error).toBeTrue();
    // Para 404 (no 0/>=500/401) usa error.message crudo.
    expect(result.message).toBe(err.message);
  });

  it('errores NO-HTTP con "Invalid Credentials" se reescriben', () => {
    const result = call(new Error('Invalid Credentials'));
    expect(result.message).toContain('contraseña');
    expect(analyticsSpy.ErrorHandler).toHaveBeenCalled();
  });

  it('errores NO-HTTP con "ETIMEDOUT" se reescriben', () => {
    const result = call(new Error('ETIMEDOUT'));
    expect(result.message).toContain('tiempo de espera');
  });

  it('errores NO-HTTP "Not Found" se reescriben a servicio no encontrado', () => {
    const result = call(new Error('Not Found'));
    expect(result.message).toContain('Servicio no encontrado');
  });

  it('errores NO-HTTP genéricos se devuelven tal cual', () => {
    const original = new Error('algo raro');
    const result = call(original);
    expect(result).toBe(original);
    expect(result.message).toBe('algo raro');
  });

  // Regresión: en web (no móvil) removeStoreData debe borrar la key de
  // localStorage. Antes la rama web faltaba y el logout no borraba el token.
  it('removeStoreData en web borra la key de localStorage', async () => {
    const spy = spyOn(localStorage, 'removeItem');
    await service.removeStoreData(environment.DATA_KEY_TOKEN);
    expect(spy).toHaveBeenCalledWith(environment.DATA_KEY_TOKEN);
  });
});

/**
 * Tests de BaseService.post() que ejercitan proccessResponse (privado) a
 * través de la API pública. Cubre las tres ramas del envelope:
 *   OK         -> resuelve con data
 *   ERROR      -> rechaza con el error normalizado
 *   tokenError -> limpia sesión y RECHAZA (no deja la promesa colgada) — el fix.
 */
describe('BaseService.proccessResponse (vía post)', () => {
  let service: BaseService;
  let httpMock: HttpTestingController;
  let storageSpy: jasmine.SpyObj<NativeStorage>;

  const URL = 'http://test.local/x';

  beforeEach(() => {
    storageSpy = jasmine.createSpyObj('NativeStorage', ['setItem', 'getItem', 'remove', 'clear']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        BaseService,
        // NO-móvil -> token / clear van por localStorage (mockeado).
        { provide: Platform, useValue: { is: () => false } as Partial<Platform> },
        { provide: NativeStorage, useValue: storageSpy },
        {
          provide: AnalyticsService,
          useValue: jasmine.createSpyObj('AnalyticsService', ['ErrorHandler']),
        },
      ],
    });

    service = TestBed.inject(BaseService);
    httpMock = TestBed.inject(HttpTestingController);

    // getAngularHeaders lee el token; sin token para no añadir Authorization.
    spyOn(window.localStorage, 'getItem').and.returnValue(null);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('arma el body como arg=<json> con Content-Type form-urlencoded', fakeAsync(() => {
    service.post(URL, { a: 1, b: 'z' }).then(() => {});
    tick();

    const req = httpMock.expectOne(URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Content-Type')).toBe('application/x-www-form-urlencoded');
    const sent = JSON.parse(decodeURIComponent(String(req.request.body).replace(/^arg=/, '')));
    expect(sent).toEqual({ a: 1, b: 'z' });

    req.flush({ status: 'OK', data: null });
    tick();
  }));

  it('rama OK: resuelve la promesa con data', fakeAsync(() => {
    let res: any;
    service.post(URL, {}).then((r) => (res = r));
    tick();

    httpMock.expectOne(URL).flush({ status: 'OK', data: { hola: 'mundo' } });
    tick();

    expect(res).toEqual({ hola: 'mundo' });
  }));

  it('rama ERROR normal: rechaza, no resuelve (conserva message)', fakeAsync(() => {
    let err: any;
    let resolved = false;
    service.post(URL, {}).then(() => (resolved = true)).catch((e) => (err = e));
    tick();

    httpMock.expectOne(URL).flush({ status: 'ERROR', error: { message: 'algo falló' } });
    tick();

    expect(resolved).toBeFalse();
    expect(err).toBeTruthy();
    expect(err.message).toBe('algo falló');
  }));

  it('rama tokenError: SETTLEA (rechaza, no cuelga) con sesión expirada y limpia sesión', fakeAsync(() => {
    const clearSpy = spyOn(window.localStorage, 'clear');

    let err: any;
    let settled = false;
    service.post(URL, {})
      .then(() => (settled = true))
      .catch((e) => { settled = true; err = e; });
    tick();

    // El backend devuelve un message que CONTIENE "tokenError".
    httpMock.expectOne(URL).flush({ status: 'ERROR', error: { message: 'tokenError: jwt expired' } });
    tick();

    // El fix: la promesa SE SETTLEA (no queda colgada) -> spinner no se queda pegado.
    expect(settled).toBeTrue();
    expect(err).toBeTruthy();
    expect(err.message).toBe(environment.ERROR_EXPIRED_TOKEN);
    expect(clearSpy).toHaveBeenCalled();
  }));

  it('status desconocido: rechaza con "Invalid Response From Server"', fakeAsync(() => {
    let err: any;
    service.post(URL, {}).catch((e) => (err = e));
    tick();

    httpMock.expectOne(URL).flush({ status: 'RARO' });
    tick();

    expect(err).toBeTruthy();
    expect(err.message).toContain('Invalid Response From Server');
  }));

  it('fallo de transporte 0 (sin conexión): handleError normaliza el mensaje', fakeAsync(() => {
    let err: any;
    service.post(URL, {}).catch((e) => (err = e));
    tick();

    httpMock
      .expectOne(URL)
      .error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
    tick();

    expect(err).toBeTruthy();
    expect(err.message).toContain('Sin conexión');
  }));

  it('fallo de transporte 401: mensaje de sesión expirada', fakeAsync(() => {
    let err: any;
    service.post(URL, {}).catch((e) => (err = e));
    tick();

    httpMock.expectOne(URL).flush('no', { status: 401, statusText: 'Unauthorized' });
    tick();

    expect(err.message).toBe(environment.ERROR_EXPIRED_TOKEN);
  }));
});
