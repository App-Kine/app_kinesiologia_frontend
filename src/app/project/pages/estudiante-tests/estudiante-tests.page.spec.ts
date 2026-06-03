import { ActivatedRoute, Router } from '@angular/router';

import { EstudianteTestsPage } from './estudiante-tests.page';
import { EvaluacionService, AplicacionActiva } from '../../services/evaluacion.service';

/** Specs de carga + doRefresh de EstudianteTestsPage (sin render de plantilla). */
describe('EstudianteTestsPage (lógica)', () => {
  let page: EstudianteTestsPage;
  let evalSvc: jasmine.SpyObj<EvaluacionService>;
  let router: jasmine.SpyObj<Router>;
  let cursoIdParam: string | null;

  const APPS: AplicacionActiva[] = [
    {
      aplicacion_id: 7, aplicacion_uuid: 'u7', test_id: 3,
      test_nombre: 'Soplos', test_descripcion: null, cantidad_preguntas: 5,
    },
  ];

  function build(cursoId: string | null): void {
    cursoIdParam = cursoId;
    const route = {
      snapshot: { paramMap: { get: (_: string) => cursoIdParam } },
    } as unknown as ActivatedRoute;
    evalSvc = jasmine.createSpyObj<EvaluacionService>('EvaluacionService', ['aplicacionesActivas']);
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    page = new EstudianteTestsPage(route, router, evalSvc);
    page.ngOnInit();
  }

  beforeEach(() => build('1'));

  it('ngOnInit captura el cursoId de la URL', () => {
    expect(page.cursoId).toBe(1);
  });

  it('cargar() sin cursoId -> error "Curso inválido" y no consulta', async () => {
    build('abc'); // NaN -> falsy
    await page.cargar();
    expect(page.error).toBe('Curso inválido');
    expect(evalSvc.aplicacionesActivas).not.toHaveBeenCalled();
  });

  it('cargar() éxito: llena aplicaciones, apaga spinner y limpia error', async () => {
    evalSvc.aplicacionesActivas.and.resolveTo(APPS);
    await page.cargar();

    expect(page.aplicaciones).toEqual(APPS);
    expect(page.cargando).toBeFalse();
    expect(page.error).toBeNull();
    expect(evalSvc.aplicacionesActivas).toHaveBeenCalledWith(1);
  });

  it('cargar() error no silencioso: setea error', async () => {
    evalSvc.aplicacionesActivas.and.rejectWith(new Error('boom'));
    await page.cargar();
    expect(page.error).toBe('boom');
    expect(page.cargando).toBeFalse();
  });

  it('cargar(silencioso=true) ignora el error y mantiene la lista', async () => {
    page.aplicaciones = APPS;
    evalSvc.aplicacionesActivas.and.rejectWith(new Error('transitorio'));

    await page.cargar(true);

    expect(page.error).toBeNull();
    expect(page.aplicaciones).toEqual(APPS);
  });

  it('cargar() evita fetches solapados (inFlight)', async () => {
    let resolver!: (v: AplicacionActiva[]) => void;
    evalSvc.aplicacionesActivas.and.returnValue(new Promise((res) => (resolver = res)));

    const p1 = page.cargar();
    const p2 = page.cargar();

    resolver(APPS);
    await Promise.all([p1, p2]);

    expect(evalSvc.aplicacionesActivas).toHaveBeenCalledTimes(1);
  });

  it('doRefresh(): carga silenciosa y completa el evento del refresher', async () => {
    evalSvc.aplicacionesActivas.and.resolveTo(APPS);
    const ev = { target: { complete: jasmine.createSpy('complete') } };

    await page.doRefresh(ev);

    expect(page.aplicaciones).toEqual(APPS);
    expect(ev.target.complete).toHaveBeenCalled();
  });

  it('comenzar() navega a la página de inicio de la aplicación', () => {
    page.comenzar(APPS[0]);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/estudiante/inicio/7');
  });

  afterEach(() => {
    // El test corre fuera del ciclo de Ionic; aseguramos limpiar cualquier
    // intervalo si algún test llamó ionViewWillEnter.
    page.ionViewWillLeave();
  });
});
