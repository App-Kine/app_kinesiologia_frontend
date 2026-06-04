import { ActivatedRoute, Router } from '@angular/router';

import { EstudianteInicioPage } from './estudiante-inicio.page';
import { EvaluacionService } from '../../services/evaluacion.service';

/**
 * Specs de la lógica de EstudianteInicioPage SIN render de plantilla:
 * instanciamos la clase a mano con deps mockeadas (validación de correo +
 * navegación con state).
 */
describe('EstudianteInicioPage (lógica)', () => {
  let page: EstudianteInicioPage;
  let evalSvc: jasmine.SpyObj<EvaluacionService>;
  let router: jasmine.SpyObj<Router>;
  let paramValue: string | null;

  function build(aplicacionId: string | null): void {
    paramValue = aplicacionId;
    const route = {
      snapshot: { paramMap: { get: (_: string) => paramValue } },
    } as unknown as ActivatedRoute;

    evalSvc = jasmine.createSpyObj<EvaluacionService>('EvaluacionService', ['iniciar']);
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);

    page = new EstudianteInicioPage(route, router, evalSvc);
    page.ngOnInit();
  }

  beforeEach(() => build('5'));

  it('se crea y captura el aplicacionId de la URL', () => {
    expect(page).toBeTruthy();
    expect(page.aplicacionId).toBe(5);
  });

  it('aplicacionId 0/NaN -> error "Evaluación inválida" y no llama a iniciar', async () => {
    build('abc'); // Number('abc') = NaN -> falsy
    await page.comenzar();
    expect(page.error).toBe('Evaluación inválida');
    expect(evalSvc.iniciar).not.toHaveBeenCalled();
  });

  describe('modalidad IDENTIFICADA: validación de correo', () => {
    beforeEach(() => { page.modalidad = 'IDENTIFICADA'; });

    it('correo vacío (o solo espacios) -> pide correo, no llama a iniciar', async () => {
      page.correo = '   ';
      await page.comenzar();
      expect(page.error).toContain('Ingresa tu correo');
      expect(evalSvc.iniciar).not.toHaveBeenCalled();
    });

    it('correo con formato inválido -> error RF-09, no llama a iniciar', async () => {
      page.correo = 'no-es-correo';
      await page.comenzar();
      expect(page.error).toContain('RF-09');
      expect(evalSvc.iniciar).not.toHaveBeenCalled();
    });

    it('correo válido (con espacios alrededor) -> se hace trim y se envía limpio', async () => {
      page.correo = '  alumno@uv.cl  ';
      evalSvc.iniciar.and.resolveTo({ aplicacion_id: 5 } as any);

      await page.comenzar();

      expect(evalSvc.iniciar).toHaveBeenCalledWith(5, 'IDENTIFICADA', 'alumno@uv.cl');
      expect(page.error).toBeNull();
    });
  });

  describe('modalidad ANONIMA', () => {
    it('NO exige correo y llama a iniciar con correo undefined', async () => {
      page.modalidad = 'ANONIMA';
      page.correo = 'lo-que-sea'; // se ignora en anónima
      evalSvc.iniciar.and.resolveTo({ aplicacion_id: 5 } as any);

      await page.comenzar();

      expect(evalSvc.iniciar).toHaveBeenCalledWith(5, 'ANONIMA', undefined);
    });
  });

  describe('navegación', () => {
    it('en éxito navega a la evaluación con el state.evaluacion', async () => {
      const ev = { aplicacion_id: 5, preguntas: [], modalidad: 'ANONIMA' };
      page.modalidad = 'ANONIMA';
      evalSvc.iniciar.and.resolveTo(ev as any);

      await page.comenzar();

      expect(router.navigateByUrl).toHaveBeenCalledWith(
        '/estudiante/evaluacion/5',
        { state: { evaluacion: ev } },
      );
      // flag de carga se resetea en finally.
      expect(page.iniciando).toBeFalse();
    });

    it('si iniciar() rechaza -> setea error y resetea iniciando, sin navegar', async () => {
      page.modalidad = 'ANONIMA';
      evalSvc.iniciar.and.rejectWith(new Error('backend caído'));

      await page.comenzar();

      expect(page.error).toBe('backend caído');
      expect(page.iniciando).toBeFalse();
      expect(router.navigateByUrl).not.toHaveBeenCalled();
    });

    it('error sin message usa mensaje por defecto', async () => {
      page.modalidad = 'ANONIMA';
      evalSvc.iniciar.and.rejectWith({});

      await page.comenzar();

      expect(page.error).toBe('No se pudo iniciar la evaluación');
    });
  });
});
