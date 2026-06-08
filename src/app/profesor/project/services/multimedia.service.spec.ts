import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { Platform } from '@ionic/angular';
import { NativeStorage } from '@ionic-native/native-storage/ngx';

import { MultimediaService } from './multimedia.service';
import { AnalyticsService } from './analytics.service';
import { environment } from '../../../../environments/environment';

/**
 * Tests de MultimediaService.
 *
 * Cubre:
 *   - validar(): tipo MIME y tamaño por cada tipo (audio/imagen/video), con
 *     límites RNF-39 (imagen ≤ 2MB) y los demás.
 *   - subir*(): falla en validación local sin tocar la red; con archivo válido
 *     postea multipart a LOGICA_API_URL con header Authorization: Bearer.
 *   - eliminar(): body `arg=<json>` + Bearer.
 *   - urls públicas.
 *   - desempacar(): {status:OK}→data, ERROR→throw.
 *
 * Determinista: HttpTestingController + plataforma web (localStorage).
 */
const LOGICA = environment.LOGICA_API_URL;

/** subir/eliminar son async (await authHeaders) → request en una microtarea. */
async function tick(): Promise<void> {
  for (let i = 0; i < 5; i++) await Promise.resolve();
}

/** Construye un File falso con un type/size controlados (sin leer bytes reales). */
function fakeFile(name: string, type: string, size: number): File {
  const f = new File(['x'], name, { type });
  Object.defineProperty(f, 'size', { value: size });
  return f;
}

describe('MultimediaService', () => {
  let svc: MultimediaService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    const routerSpy = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    routerSpy.navigateByUrl.and.resolveTo(true);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        MultimediaService,
        { provide: Router, useValue: routerSpy },
        { provide: NativeStorage, useValue: jasmine.createSpyObj('NativeStorage', ['setItem', 'getItem', 'remove', 'clear']) },
        { provide: Platform, useValue: { is: (k: string) => k === 'desktop' } },
        { provide: AnalyticsService, useValue: jasmine.createSpyObj('AnalyticsService', ['ErrorHandler']) },
      ],
    });

    svc = TestBed.inject(MultimediaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('validar', () => {
    it('acepta un audio MP3 dentro del límite (null = sin error)', () => {
      expect(svc.validar(fakeFile('a.mp3', 'audio/mpeg', 1024), 'audio')).toBeNull();
    });

    it('rechaza tipo MIME no permitido', () => {
      const err = svc.validar(fakeFile('a.gif', 'image/gif', 1024), 'imagen');
      expect(err).toContain('Formato no permitido');
      expect(err).toContain('image/gif');
    });

    it('rechaza imagen que supera 2 MB (RNF-39)', () => {
      const err = svc.validar(fakeFile('big.png', 'image/png', MultimediaService.IMAGEN_MAX + 1), 'imagen');
      expect(err).toContain('supera el límite');
    });

    it('acepta imagen justo en el límite (2 MB exactos)', () => {
      expect(svc.validar(fakeFile('ok.png', 'image/png', MultimediaService.IMAGEN_MAX), 'imagen')).toBeNull();
    });

    it('rechaza audio que supera 10 MB', () => {
      const err = svc.validar(fakeFile('big.wav', 'audio/wav', MultimediaService.AUDIO_MAX + 1), 'audio');
      expect(err).toContain('supera el límite');
    });

    it('rechaza video que supera 50 MB', () => {
      const err = svc.validar(fakeFile('big.mp4', 'video/mp4', MultimediaService.VIDEO_MAX + 1), 'video');
      expect(err).toContain('supera el límite');
    });

    it('mensaje incluye "desconocido" cuando el type está vacío', () => {
      const err = svc.validar(fakeFile('x', '', 10), 'audio');
      expect(err).toContain('desconocido');
    });
  });

  describe('subir', () => {
    it('falla en validación local SIN llamar a la red', async () => {
      await expectAsync(
        svc.subirImagen(fakeFile('a.gif', 'image/gif', 10))
      ).toBeRejectedWithError(/Formato no permitido/);
      httpMock.expectNone(() => true);
    });

    it('subirImagen válido → POST multipart con Authorization Bearer y resuelve data', async () => {
      localStorage.setItem(environment.DATA_KEY_TOKEN, JSON.stringify('jwt-abc'));
      const file = fakeFile('foto.png', 'image/png', 1000);

      const promise = svc.subirImagen(file, 42);
      await tick();
      const req = httpMock.expectOne(LOGICA + 'multimedia/subirImagen');

      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBe(true);
      expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-abc');
      // FormData → el navegador pone el Content-Type con boundary, no lo seteamos.
      expect(req.request.headers.has('Content-Type')).toBe(false);

      const fd = req.request.body as FormData;
      expect(fd.get('preguntaId')).toBe('42');

      req.flush({ status: 'OK', data: { grid_id: 'g1', contentType: 'image/png' } });
      await expectAsync(promise).toBeResolvedTo({ grid_id: 'g1', contentType: 'image/png' });
    });

    it('no antepone "Bearer " si el token ya lo trae', async () => {
      localStorage.setItem(environment.DATA_KEY_TOKEN, JSON.stringify('Bearer ya-prefijado'));
      const promise = svc.subirAudio(fakeFile('a.mp3', 'audio/mpeg', 1000));
      await tick();
      const req = httpMock.expectOne(LOGICA + 'multimedia/subirAudio');
      expect(req.request.headers.get('Authorization')).toBe('Bearer ya-prefijado');
      req.flush({ status: 'OK', data: { grid_id: 'g', contentType: 'audio/mpeg' } });
      await promise;
    });

    it('rechaza si el backend responde {status:ERROR}', async () => {
      const promise = svc.subirVideo(fakeFile('v.mp4', 'video/mp4', 1000));
      await tick();
      const req = httpMock.expectOne(LOGICA + 'multimedia/subirVideo');
      req.flush({ status: 'ERROR', error: { message: 'rechazado backend' } });
      await expectAsync(promise).toBeRejectedWithError('rechazado backend');
    });
  });

  describe('eliminar', () => {
    it('POST con body arg=<json> y Content-Type form-urlencoded + Bearer', async () => {
      localStorage.setItem(environment.DATA_KEY_TOKEN, JSON.stringify('jwt-del'));
      const promise = svc.eliminar('grid-9', 'audio');
      await tick();
      const req = httpMock.expectOne(LOGICA + 'multimedia/eliminar');

      expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-del');
      expect(req.request.headers.get('Content-Type')).toBe('application/x-www-form-urlencoded');
      const body = req.request.body as string;
      expect(JSON.parse(decodeURIComponent(body.slice(4)))).toEqual({ gridId: 'grid-9', tipo: 'audio' });

      req.flush({ status: 'OK', data: null });
      await expectAsync(promise).toBeResolved();
    });
  });

  describe('urls públicas', () => {
    it('construye urlAudio/urlImagen/urlVideo con el gridId', () => {
      expect(svc.urlAudio('g')).toBe(LOGICA + 'multimedia/audio/g');
      expect(svc.urlImagen('g')).toBe(LOGICA + 'multimedia/imagen/g');
      expect(svc.urlVideo('g')).toBe(LOGICA + 'multimedia/video/g');
    });
  });
});
