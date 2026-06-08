import { Router } from '@angular/router';

import { EstudianteCursosPage } from './estudiante-cursos.page';
import { EvaluacionService, CursoPublico } from '../../services/evaluacion.service';

/** Specs de carga + doRefresh de EstudianteCursosPage (sin render de plantilla). */
describe('EstudianteCursosPage (lógica)', () => {
  let page: EstudianteCursosPage;
  let evalSvc: jasmine.SpyObj<EvaluacionService>;
  let router: jasmine.SpyObj<Router>;

  const CURSOS: CursoPublico[] = [
    { curso_id: 1, codigo: 'KIN-1', nombre: 'Auscultación', descripcion: null },
  ];

  beforeEach(() => {
    evalSvc = jasmine.createSpyObj<EvaluacionService>('EvaluacionService', ['listarCursos']);
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    page = new EstudianteCursosPage(evalSvc, router);
  });

  it('cargar() éxito: llena cursos, apaga spinner y limpia error', async () => {
    evalSvc.listarCursos.and.resolveTo(CURSOS);
    await page.cargar();

    expect(page.cursos).toEqual(CURSOS);
    expect(page.cargando).toBeFalse();
    expect(page.error).toBeNull();
  });

  it('cargar() error (no silencioso): setea error y apaga spinner', async () => {
    evalSvc.listarCursos.and.rejectWith(new Error('sin red'));
    await page.cargar();

    expect(page.error).toBe('sin red');
    expect(page.cargando).toBeFalse();
  });

  it('cargar(silencioso=true) NO setea error en fallo (mantiene la lista visible)', async () => {
    page.cursos = CURSOS;
    evalSvc.listarCursos.and.rejectWith(new Error('transitorio'));

    await page.cargar(true);

    expect(page.error).toBeNull();
    expect(page.cursos).toEqual(CURSOS); // intacta
  });

  it('cargar() evita fetches solapados (inFlight)', async () => {
    let resolver!: (v: CursoPublico[]) => void;
    evalSvc.listarCursos.and.returnValue(new Promise((res) => (resolver = res)));

    const p1 = page.cargar();   // toma el lock
    const p2 = page.cargar();   // debe salir de inmediato (inFlight)

    resolver(CURSOS);
    await Promise.all([p1, p2]);

    expect(evalSvc.listarCursos).toHaveBeenCalledTimes(1);
  });

  it('doRefresh(): carga silenciosa y completa el evento del refresher', async () => {
    evalSvc.listarCursos.and.resolveTo(CURSOS);
    const ev = { target: { complete: jasmine.createSpy('complete') } };

    await page.doRefresh(ev);

    expect(page.cursos).toEqual(CURSOS);
    expect(ev.target.complete).toHaveBeenCalled();
  });

  it('abrir() navega a los tests del curso', () => {
    page.abrir(CURSOS[0]);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/estudiante/curso/1/tests');
  });
});
