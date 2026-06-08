import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
  TestRequest,
} from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { Platform } from '@ionic/angular';
import { NativeStorage } from '@ionic-native/native-storage/ngx';

import { BaseService } from '../../base/service/base.service';
import { AnalyticsService } from './analytics.service';
import { environment } from '../../../../environments/environment';

import { CursoService } from './curso.service';
import { TestService } from './test.service';
import { PreguntaService } from './pregunta.service';
import { AplicacionService } from './aplicacion.service';
import { InvitacionService } from './invitacion.service';
import { AnaliticaService } from './analitica.service';
import { UsuarioService } from './usuario.service';

/**
 * Tests deterministas (HttpTestingController) de los servicios CRUD que extienden
 * BaseService. Verifican el contrato compartido:
 *   - cada método postea a la URL correcta
 *   - el body viaja como `arg=<json url-encoded>` (formato de BaseService.post)
 *   - una respuesta `{status:'OK', data}` se mapea a `data`
 *   - una respuesta `{status:'ERROR', error}` rechaza la promesa
 *
 * Al ejercitar el `post` real (no stubeado) tambien se cubre de paso
 * BaseService.proccessResponse (rama OK/ERROR) y el armado de headers.
 */
const BASE = environment.BASE_API_URL;

/**
 * BaseService.post es async (await getAngularHeaders → getStoreData) y recién
 * después despacha la request. Esperamos unos ticks de microtareas para que la
 * request ya esté encolada en el backend de pruebas antes de expectOne().
 */
async function tick(): Promise<void> {
  for (let i = 0; i < 5; i++) await Promise.resolve();
}

/** Parsea el body `arg=<json>` que arma BaseService.post y devuelve el objeto. */
function parseArg(req: TestRequest): any {
  const body = req.request.body as string;
  expect(typeof body).toBe('string');
  expect(body.startsWith('arg=')).toBe(true);
  return JSON.parse(decodeURIComponent(body.slice('arg='.length)));
}

describe('Servicios CRUD (contrato BaseService.post)', () => {
  let httpMock: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    localStorage.clear();
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    routerSpy.navigateByUrl.and.resolveTo(true);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        CursoService, TestService, PreguntaService, AplicacionService,
        InvitacionService, AnaliticaService, UsuarioService,
        { provide: Router, useValue: routerSpy },
        {
          provide: NativeStorage,
          useValue: jasmine.createSpyObj('NativeStorage', ['setItem', 'getItem', 'remove', 'clear']),
        },
        // Plataforma web (no hibrida) → storage por localStorage, sin nativo.
        { provide: Platform, useValue: { is: (k: string) => k === 'desktop' } },
        { provide: AnalyticsService, useValue: jasmine.createSpyObj('AnalyticsService', ['ErrorHandler']) },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  /**
   * Ejercita un metodo del servicio: dispara la llamada, atrapa la unica request,
   * valida URL + body, responde con el envelope OK y verifica el mapeo a data.
   */
  async function expectOk(opts: {
    call: () => Promise<any>;
    url: string;
    expectedArg: any;
    data: any;
  }): Promise<void> {
    const promise = opts.call();
    await tick();
    const req = httpMock.expectOne(opts.url);
    expect(req.request.method).toBe('POST');
    expect(parseArg(req)).toEqual(opts.expectedArg);
    req.flush({ status: 'OK', data: opts.data });
    await expectAsync(promise).toBeResolvedTo(opts.data);
  }

  // -------- CursoService --------
  describe('CursoService', () => {
    let svc: CursoService;
    beforeEach(() => (svc = TestBed.inject(CursoService)));

    it('listar → cursos/listar con {}', () =>
      expectOk({ call: () => svc.listar(), url: BASE + 'cursos/listar', expectedArg: {}, data: [{ curso_id: 1 }] }));

    it('listarMisCursos → cursos/misCursos con {}', () =>
      expectOk({ call: () => svc.listarMisCursos(), url: BASE + 'cursos/misCursos', expectedArg: {}, data: [] }));

    it('crear → cursos/crear con el input', () =>
      expectOk({
        call: () => svc.crear({ codigo: 'K101', nombre: 'Kine', descripcion: 'd' }),
        url: BASE + 'cursos/crear',
        expectedArg: { codigo: 'K101', nombre: 'Kine', descripcion: 'd' },
        data: { curso_id: 7 },
      }));

    it('editar → cursos/editar mezcla input + cursoId', () =>
      expectOk({
        call: () => svc.editar(9, { codigo: 'K1', nombre: 'N' }),
        url: BASE + 'cursos/editar',
        expectedArg: { codigo: 'K1', nombre: 'N', cursoId: 9 },
        data: { curso_id: 9 },
      }));

    it('eliminar → cursos/eliminar con {cursoId}', () =>
      expectOk({ call: () => svc.eliminar(4), url: BASE + 'cursos/eliminar', expectedArg: { cursoId: 4 }, data: { curso_id: 4 } }));

    it('obtenerConAplicaciones → cursos/obtener con {cursoId}', () =>
      expectOk({ call: () => svc.obtenerConAplicaciones(4), url: BASE + 'cursos/obtener', expectedArg: { cursoId: 4 }, data: { curso_id: 4, aplicaciones: [] } }));

    it('rechaza cuando el backend responde {status:ERROR}', async () => {
      const promise = svc.listar();
      await tick();
      const req = httpMock.expectOne(BASE + 'cursos/listar');
      req.flush({ status: 'ERROR', error: { message: 'Algo falló' } });
      await expectAsync(promise).toBeRejected();
    });
  });

  // -------- TestService --------
  describe('TestService', () => {
    let svc: TestService;
    beforeEach(() => (svc = TestBed.inject(TestService)));

    it('crear → crearTest con el input completo', () =>
      expectOk({
        call: () => svc.crear({ nombre: 'T', preguntas: [{ preguntaId: 1, orden: 1 }] }),
        url: BASE + 'crearTest',
        expectedArg: { nombre: 'T', preguntas: [{ preguntaId: 1, orden: 1 }] },
        data: { test_id: 3 },
      }));

    it('listar sin profesorId → listarTests con {}', () =>
      expectOk({ call: () => svc.listar(), url: BASE + 'listarTests', expectedArg: {}, data: [] }));

    it('listar con profesorId → incluye profesorId', () =>
      expectOk({ call: () => svc.listar(5), url: BASE + 'listarTests', expectedArg: { profesorId: 5 }, data: [] }));

    it('listarPagina → listarTests con page/pageSize', () =>
      expectOk({
        call: () => svc.listarPagina(2, 10),
        url: BASE + 'listarTests',
        expectedArg: { page: 2, pageSize: 10 },
        data: { items: [], page: 2, pageSize: 10, hasMore: false },
      }));

    it('obtener → obtenerTest con {testId}', () =>
      expectOk({ call: () => svc.obtener(8), url: BASE + 'obtenerTest', expectedArg: { testId: 8 }, data: { test_id: 8 } }));

    it('editar → editarTest mezcla input + testId', () =>
      expectOk({
        call: () => svc.editar(8, { nombre: 'NN' }),
        url: BASE + 'editarTest',
        expectedArg: { nombre: 'NN', testId: 8 },
        data: { test_id: 8 },
      }));

    it('eliminar → eliminarTest con {testId}', () =>
      expectOk({ call: () => svc.eliminar(8), url: BASE + 'eliminarTest', expectedArg: { testId: 8 }, data: { test_id: 8 } }));
  });

  // -------- PreguntaService --------
  describe('PreguntaService', () => {
    let svc: PreguntaService;
    const p = {
      enunciado: 'E', explicacionClinica: 'X',
      alternativas: [{ texto: 'a', esCorrecta: true, orden: 1 }],
    };
    beforeEach(() => (svc = TestBed.inject(PreguntaService)));

    it('crear → crearPregunta con el input', () =>
      expectOk({ call: () => svc.crear(p), url: BASE + 'crearPregunta', expectedArg: p, data: { pregunta_id: 2 } }));

    it('listar con profesorId → listarPreguntas con profesorId', () =>
      expectOk({ call: () => svc.listar(3), url: BASE + 'listarPreguntas', expectedArg: { profesorId: 3 }, data: [] }));

    it('obtener → obtenerPregunta con {preguntaId}', () =>
      expectOk({ call: () => svc.obtener(2), url: BASE + 'obtenerPregunta', expectedArg: { preguntaId: 2 }, data: { pregunta_id: 2 } }));

    it('editar → editarPregunta mezcla input + preguntaId', () =>
      expectOk({ call: () => svc.editar(2, p), url: BASE + 'editarPregunta', expectedArg: { ...p, preguntaId: 2 }, data: { pregunta_id: 2 } }));

    it('eliminar → eliminarPregunta con {preguntaId}', () =>
      expectOk({ call: () => svc.eliminar(2), url: BASE + 'eliminarPregunta', expectedArg: { preguntaId: 2 }, data: { pregunta_id: 2 } }));

    it('agregarATest → agregarPreguntaATest mezcla input + testId', () =>
      expectOk({ call: () => svc.agregarATest(9, p), url: BASE + 'agregarPreguntaATest', expectedArg: { ...p, testId: 9 }, data: { pregunta_id: 2, orden: 1 } }));

    it('quitarDeTest → quitarPreguntaDeTest con {testId, preguntaId}', () =>
      expectOk({ call: () => svc.quitarDeTest(9, 2), url: BASE + 'quitarPreguntaDeTest', expectedArg: { testId: 9, preguntaId: 2 }, data: { huerfanaEliminada: false } }));
  });

  // -------- AplicacionService --------
  describe('AplicacionService', () => {
    let svc: AplicacionService;
    beforeEach(() => (svc = TestBed.inject(AplicacionService)));

    it('crear → crearAplicacion con {testId, cursoId}', () =>
      expectOk({ call: () => svc.crear({ testId: 1, cursoId: 2 }), url: BASE + 'crearAplicacion', expectedArg: { testId: 1, cursoId: 2 }, data: { aplicacion_id: 5, aplicacion_uuid: 'u' } }));

    it('listar sin filtros → listarAplicaciones con {}', () =>
      expectOk({ call: () => svc.listar(), url: BASE + 'listarAplicaciones', expectedArg: {}, data: [] }));

    it('listar con ambos filtros → incluye profesorId y cursoId', () =>
      expectOk({ call: () => svc.listar(3, 4), url: BASE + 'listarAplicaciones', expectedArg: { profesorId: 3, cursoId: 4 }, data: [] }));

    it('setActivo → setActivoAplicacion con {aplicacionId, activo}', () =>
      expectOk({ call: () => svc.setActivo(5, false), url: BASE + 'setActivoAplicacion', expectedArg: { aplicacionId: 5, activo: false }, data: { aplicacion_id: 5, activo: false } }));

    it('eliminar → eliminarAplicacion con {aplicacionId}', () =>
      expectOk({ call: () => svc.eliminar(5), url: BASE + 'eliminarAplicacion', expectedArg: { aplicacionId: 5 }, data: { aplicacion_id: 5 } }));
  });

  // -------- InvitacionService --------
  describe('InvitacionService', () => {
    let svc: InvitacionService;
    beforeEach(() => (svc = TestBed.inject(InvitacionService)));

    it('crear → crearInvitacion con {correo}', () =>
      expectOk({ call: () => svc.crear('x@y.cl'), url: BASE + 'crearInvitacion', expectedArg: { correo: 'x@y.cl' }, data: { invitacion_id: 'i', correo_destino: 'x@y.cl', expira_en: 'z' } }));

    it('listar → listarInvitaciones con {}', () =>
      expectOk({ call: () => svc.listar(), url: BASE + 'listarInvitaciones', expectedArg: {}, data: [] }));

    it('verificar → verificarInvitacion con {token}', () =>
      expectOk({ call: () => svc.verificar('t'), url: BASE + 'verificarInvitacion', expectedArg: { token: 't' }, data: { invitacion_id: 'i', correo_destino: 'c', expira_en: 'z' } }));

    it('completar → completarInvitacion con {token, nombre, password}', () =>
      expectOk({ call: () => svc.completar('t', 'Juan', 'pass'), url: BASE + 'completarInvitacion', expectedArg: { token: 't', nombre: 'Juan', password: 'pass' }, data: { ok: true } }));
  });

  // -------- AnaliticaService --------
  describe('AnaliticaService', () => {
    let svc: AnaliticaService;
    beforeEach(() => (svc = TestBed.inject(AnaliticaService)));

    it('resumen → analitica/resumen con {}', () =>
      expectOk({ call: () => svc.resumen(), url: BASE + 'analitica/resumen', expectedArg: {}, data: [] }));

    it('detalle → analitica/aplicacion con {aplicacionId}', () =>
      expectOk({ call: () => svc.detalle(11), url: BASE + 'analitica/aplicacion', expectedArg: { aplicacionId: 11 }, data: { resumen: {}, preguntas: [], evaluaciones: [], tiempos_identificados: [] } }));
  });

  // -------- UsuarioService --------
  describe('UsuarioService', () => {
    let svc: UsuarioService;
    beforeEach(() => (svc = TestBed.inject(UsuarioService)));

    it('listar → listarUsuarios con {}', () =>
      expectOk({ call: () => svc.listar(), url: BASE + 'listarUsuarios', expectedArg: {}, data: [] }));

    it('eliminar → eliminarUsuario con {usuario_id}', () =>
      expectOk({ call: () => svc.eliminar(7), url: BASE + 'eliminarUsuario', expectedArg: { usuario_id: 7 }, data: { usuario_id: 7, activo: false } }));

    it('reactivar → reactivarUsuario con {usuario_id}', () =>
      expectOk({ call: () => svc.reactivar(7), url: BASE + 'reactivarUsuario', expectedArg: { usuario_id: 7 }, data: { usuario_id: 7, activo: true } }));
  });
});
