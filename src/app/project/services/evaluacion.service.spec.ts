import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { Platform } from '@ionic/angular';
import { NativeStorage } from '@ionic-native/native-storage/ngx';

import { EvaluacionService } from './evaluacion.service';
import { AnalyticsService } from './analytics.service';
import { environment } from '../../../environments/environment';

describe('EvaluacionService', () => {
  let service: EvaluacionService;
  let httpMock: HttpTestingController;

  const BASE = environment.BASE_API_URL;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        EvaluacionService,
        // Forzamos plataforma NO-móvil para que getStoreData use localStorage
        // (mockeado) en vez de NativeStorage.
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

    service = TestBed.inject(EvaluacionService);
    httpMock = TestBed.inject(HttpTestingController);

    // getAngularHeaders lee el token vía getStoreData -> localStorage.
    // Lo dejamos vacío para no añadir Authorization y evitar dependencias.
    spyOn(window.localStorage, 'getItem').and.returnValue(null);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('se crea', () => {
    expect(service).toBeTruthy();
  });

  it('listarCursos postea a la URL correcta y mapea data', fakeAsync(() => {
    const cursos = [
      { curso_id: 1, codigo: 'KIN-1', nombre: 'Auscultación', descripcion: null },
    ];
    let resultado: any;
    service.listarCursos().then((r) => (resultado = r));

    // getAngularHeaders es async (await getStoreData) -> dejamos resolver
    // la microtarea antes de que se dispare el POST.
    tick();

    const req = httpMock.expectOne(BASE + 'evaluacion/cursos');
    expect(req.request.method).toBe('POST');
    // El body va como arg=<json-encodeado>.
    expect(req.request.body).toContain('arg=');
    expect(decodeURIComponent(req.request.body)).toContain('{}');

    // proccessResponse espera { status:'OK', data }.
    req.flush({ status: 'OK', data: cursos });
    tick();

    expect(resultado).toEqual(cursos);
  }));

  it('iniciar IDENTIFICADA postea aplicacionId, modalidad y correo', fakeAsync(() => {
    const respuesta = {
      aplicacion_id: 7,
      test_nombre: 'Test cardíaco',
      modalidad: 'IDENTIFICADA',
      correo: 'a@b.cl',
      total_preguntas: 0,
      preguntas: [],
    };
    let resultado: any;
    service.iniciar(7, 'IDENTIFICADA', 'a@b.cl').then((r) => (resultado = r));
    tick();

    const req = httpMock.expectOne(BASE + 'evaluacion/iniciar');
    expect(req.request.method).toBe('POST');
    const sentArgs = JSON.parse(
      decodeURIComponent(req.request.body.replace(/^arg=/, '')),
    );
    expect(sentArgs).toEqual({ aplicacionId: 7, modalidad: 'IDENTIFICADA', correo: 'a@b.cl' });

    req.flush({ status: 'OK', data: respuesta });
    tick();
    expect(resultado).toEqual(respuesta);
  }));

  it('iniciar ANONIMA NO incluye correo en el body', fakeAsync(() => {
    service.iniciar(9, 'ANONIMA').then(() => {});
    tick();

    const req = httpMock.expectOne(BASE + 'evaluacion/iniciar');
    const sentArgs = JSON.parse(
      decodeURIComponent(req.request.body.replace(/^arg=/, '')),
    );
    expect(sentArgs).toEqual({ aplicacionId: 9, modalidad: 'ANONIMA' });
    expect(sentArgs.correo).toBeUndefined();

    req.flush({ status: 'OK', data: {} });
    tick();
  }));

  it('informeCompleto postea el evaluacionUuid a la URL correcta', fakeAsync(() => {
    const informe = { cabecera: { evaluacion_id: 3 }, preguntas: [] };
    let resultado: any;
    service.informeCompleto('uuid-123').then((r) => (resultado = r));
    tick();

    const req = httpMock.expectOne(BASE + 'evaluacion/informeCompleto');
    const sentArgs = JSON.parse(
      decodeURIComponent(req.request.body.replace(/^arg=/, '')),
    );
    expect(sentArgs).toEqual({ evaluacionUuid: 'uuid-123' });

    req.flush({ status: 'OK', data: informe });
    tick();
    expect(resultado).toEqual(informe as any);
  }));

  it('una respuesta status ERROR rechaza la promesa (handleError)', fakeAsync(() => {
    let err: any;
    service.listarCursos().catch((e) => (err = e));
    tick();

    const req = httpMock.expectOne(BASE + 'evaluacion/cursos');
    req.flush({ status: 'ERROR', error: { message: 'algo falló' } });
    tick();

    // proccessResponse -> onError(handleError(data.error)): la promesa se
    // rechaza con el error normalizado (que conserva el message original).
    expect(err).toBeTruthy();
    expect(err.message).toBe('algo falló');
  }));
});
