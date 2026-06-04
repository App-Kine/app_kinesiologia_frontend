import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { Platform } from '@ionic/angular';
import { NativeStorage } from '@ionic-native/native-storage/ngx';

import { MultimediaService } from './multimedia.service';
import { AnalyticsService } from './analytics.service';
import { environment } from '../../../environments/environment';

/**
 * Construye un File falso con un tamaño arbitrario sin tener que crear bytes
 * reales (rendimiento + determinismo). El tamaño se sobreescribe vía
 * defineProperty porque File.size es de solo lectura.
 */
function fakeFile(name: string, type: string, size: number): File {
  const f = new File(['x'], name, { type });
  Object.defineProperty(f, 'size', { value: size });
  return f;
}

describe('MultimediaService', () => {
  let service: MultimediaService;
  let httpMock: HttpTestingController;

  const LOGICA = environment.LOGICA_API_URL;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        MultimediaService,
        // NO-móvil -> getStoreData usa localStorage (mockeado).
        { provide: Platform, useValue: { is: () => false } as Partial<Platform> },
        {
          provide: NativeStorage,
          useValue: jasmine.createSpyObj('NativeStorage', [
            'setItem', 'getItem', 'remove', 'clear',
          ]),
        },
        {
          provide: AnalyticsService,
          useValue: jasmine.createSpyObj('AnalyticsService', ['ErrorHandler']),
        },
      ],
    });

    service = TestBed.inject(MultimediaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('se crea', () => {
    expect(service).toBeTruthy();
  });

  // ---- URLs públicas de streaming ----
  describe('URLs públicas', () => {
    it('urlAudio/urlImagen/urlVideo construyen la URL contra la lógica', () => {
      expect(service.urlAudio('abc')).toBe(LOGICA + 'multimedia/audio/abc');
      expect(service.urlImagen('def')).toBe(LOGICA + 'multimedia/imagen/def');
      expect(service.urlVideo('ghi')).toBe(LOGICA + 'multimedia/video/ghi');
    });
  });

  // ---- Validación cliente (validar) ----
  describe('validar()', () => {
    it('acepta un audio MP3 dentro del límite (retorna null)', () => {
      const f = fakeFile('a.mp3', 'audio/mpeg', 1024);
      expect(service.validar(f, 'audio')).toBeNull();
    });

    it('rechaza un mime no permitido para audio', () => {
      const f = fakeFile('a.txt', 'text/plain', 10);
      const err = service.validar(f, 'audio');
      expect(err).toContain('Formato no permitido');
      expect(err).toContain('text/plain');
    });

    it('muestra "desconocido" cuando el file no tiene type', () => {
      const f = fakeFile('a', '', 10);
      const err = service.validar(f, 'imagen');
      expect(err).toContain('desconocido');
    });

    it('rechaza un audio que supera AUDIO_MAX', () => {
      const f = fakeFile('big.mp3', 'audio/mpeg', MultimediaService.AUDIO_MAX + 1);
      const err = service.validar(f, 'audio');
      expect(err).toContain('supera el límite');
    });

    it('rechaza una imagen que supera IMAGEN_MAX (RNF-39, 2MB)', () => {
      const f = fakeFile('big.png', 'image/png', MultimediaService.IMAGEN_MAX + 1);
      expect(service.validar(f, 'imagen')).toContain('supera el límite');
    });

    it('acepta una imagen PNG en el límite exacto', () => {
      const f = fakeFile('ok.png', 'image/png', MultimediaService.IMAGEN_MAX);
      expect(service.validar(f, 'imagen')).toBeNull();
    });

    it('acepta un video MP4 dentro del límite y rechaza si excede VIDEO_MAX', () => {
      expect(service.validar(fakeFile('v.mp4', 'video/mp4', 1024), 'video')).toBeNull();
      expect(
        service.validar(fakeFile('v.mp4', 'video/mp4', MultimediaService.VIDEO_MAX + 1), 'video'),
      ).toContain('supera el límite');
    });
  });

  // ---- subir(): validación local cortocircuita antes de HTTP ----
  describe('subirImagen() validación local', () => {
    it('rechaza ANTES de pegarle al servidor si el mime es inválido', async () => {
      const f = fakeFile('a.gif', 'image/gif', 10);
      await expectAsync(service.subirImagen(f)).toBeRejectedWithError(/Formato no permitido/);
      // No debe haber salido ninguna request.
      httpMock.expectNone(() => true);
    });

    it('rechaza ANTES de HTTP si supera el tamaño', async () => {
      const f = fakeFile('big.png', 'image/png', MultimediaService.IMAGEN_MAX + 1);
      await expectAsync(service.subirImagen(f)).toBeRejectedWithError(/supera el límite/);
      httpMock.expectNone(() => true);
    });
  });

  // ---- subir(): URL, FormData y header Bearer ----
  describe('subir() request', () => {
    it('postea multipart al endpoint con preguntaId y header Bearer', fakeAsync(() => {
      // getStoreData (web) hace JSON.parse del valor -> guardamos JSON.stringify.
      spyOn(window.localStorage, 'getItem').and.returnValue(JSON.stringify('mi-token-jwt'));
      const f = fakeFile('latido.mp3', 'audio/mpeg', 2048);

      let res: any;
      service.subirAudio(f, 42).then((r) => (res = r));
      // authHeaders -> await getStoreData (microtarea) antes del POST.
      tick();

      const req = httpMock.expectOne(LOGICA + 'multimedia/subirAudio');
      expect(req.request.method).toBe('POST');
      // Header Authorization en formato Bearer.
      expect(req.request.headers.get('Authorization')).toBe('Bearer mi-token-jwt');
      // Body es FormData con el archivo y el preguntaId.
      const body = req.request.body as FormData;
      expect(body instanceof FormData).toBeTrue();
      expect(body.get('preguntaId')).toBe('42');
      expect(body.get('archivo')).toBeTruthy();

      req.flush({ status: 'OK', data: { grid_id: 'g1', contentType: 'audio/mpeg' } });
      tick();
      expect(res).toEqual({ grid_id: 'g1', contentType: 'audio/mpeg' });
    }));

    it('NO duplica el prefijo Bearer si el token ya lo trae', fakeAsync(() => {
      spyOn(window.localStorage, 'getItem').and.returnValue(JSON.stringify('Bearer ya-con-prefijo'));
      const f = fakeFile('x.png', 'image/png', 100);

      service.subirImagen(f).then(() => {});
      tick();

      const req = httpMock.expectOne(LOGICA + 'multimedia/subirImagen');
      expect(req.request.headers.get('Authorization')).toBe('Bearer ya-con-prefijo');
      req.flush({ status: 'OK', data: { grid_id: 'g', contentType: 'image/png' } });
      tick();
    }));

    it('omite preguntaId del FormData cuando no se pasa', fakeAsync(() => {
      spyOn(window.localStorage, 'getItem').and.returnValue(null);
      const f = fakeFile('v.mp4', 'video/mp4', 100);

      service.subirVideo(f).then(() => {});
      tick();

      const req = httpMock.expectOne(LOGICA + 'multimedia/subirVideo');
      const body = req.request.body as FormData;
      expect(body.get('preguntaId')).toBeNull();
      // Sin token -> sin Authorization.
      expect(req.request.headers.has('Authorization')).toBeFalse();
      req.flush({ status: 'OK', data: { grid_id: 'g', contentType: 'video/mp4' } });
      tick();
    }));

    it('rechaza con el mensaje del envelope cuando status != OK (desempacar)', fakeAsync(() => {
      spyOn(window.localStorage, 'getItem').and.returnValue(null);
      const f = fakeFile('a.mp3', 'audio/mpeg', 100);

      let err: any;
      service.subirAudio(f).catch((e) => (err = e));
      tick();

      const req = httpMock.expectOne(LOGICA + 'multimedia/subirAudio');
      req.flush({ status: 'ERROR', error: { message: 'cuota excedida' } });
      tick();

      expect(err).toBeTruthy();
      expect(err.message).toBe('cuota excedida');
    }));
  });

  // ---- eliminar(): header form-urlencoded + body arg= ----
  describe('eliminar()', () => {
    it('postea arg= con gridId/tipo y Content-Type form-urlencoded', fakeAsync(() => {
      spyOn(window.localStorage, 'getItem').and.returnValue(JSON.stringify('tok'));
      service.eliminar('grid-9', 'imagen').then(() => {});
      tick();

      const req = httpMock.expectOne(LOGICA + 'multimedia/eliminar');
      expect(req.request.headers.get('Content-Type')).toBe('application/x-www-form-urlencoded');
      const sent = JSON.parse(decodeURIComponent(String(req.request.body).replace(/^arg=/, '')));
      expect(sent).toEqual({ gridId: 'grid-9', tipo: 'imagen' });

      req.flush({ status: 'OK', data: null });
      tick();
    }));
  });
});
