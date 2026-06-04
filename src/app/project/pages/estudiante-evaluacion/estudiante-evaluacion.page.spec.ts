import { Router } from '@angular/router';

import { EstudianteEvaluacionPage } from './estudiante-evaluacion.page';
import {
  EvaluacionService, EvaluacionIniciada, RespuestaResultado,
} from '../../services/evaluacion.service';
import { MultimediaService } from '../../services/multimedia.service';

/**
 * Specs de la lógica de buffer y finalizar de EstudianteEvaluacionPage SIN
 * render: instanciamos la clase con deps mockeadas. El buffer privado se lee
 * vía cast a any.
 */
describe('EstudianteEvaluacionPage (buffer + finalizar)', () => {
  let page: EstudianteEvaluacionPage;
  let evalSvc: jasmine.SpyObj<EvaluacionService>;
  let router: jasmine.SpyObj<Router>;
  let media: jasmine.SpyObj<MultimediaService>;

  const EV: EvaluacionIniciada = {
    aplicacion_id: 5,
    test_nombre: 'Test cardíaco',
    modalidad: 'IDENTIFICADA',
    correo: 'a@uv.cl',
    total_preguntas: 2,
    preguntas: [
      {
        pregunta_id: 100, orden_presentacion: 1, enunciado: 'P1',
        audio_grid_id: null, imagen_grid_id: null, video_grid_id: null,
        alternativas: [
          { alternativa_id: 11, texto: 'a', orden: 1 },
          { alternativa_id: 12, texto: 'b', orden: 2 },
        ],
      },
      {
        pregunta_id: 200, orden_presentacion: 2, enunciado: 'P2',
        audio_grid_id: null, imagen_grid_id: null, video_grid_id: null,
        alternativas: [
          { alternativa_id: 21, texto: 'a', orden: 1 },
          { alternativa_id: 22, texto: 'b', orden: 2 },
        ],
      },
    ],
  };

  const finalizada = (correcta: boolean): RespuestaResultado => ({
    correcta, intento: 1, intentosUsados: 1, finalizadaPregunta: true,
    puedeReintentar: false, correctaAlternativaId: 11, explicacion: 'porque sí',
  });
  const fallaIntento1 = (): RespuestaResultado => ({
    correcta: false, intento: 1, intentosUsados: 1, finalizadaPregunta: false,
    puedeReintentar: true, correctaAlternativaId: null, explicacion: null,
  });

  const buffer = () => (page as any).bufferRespuestas as any[];

  function build(state?: any): void {
    evalSvc = jasmine.createSpyObj<EvaluacionService>('EvaluacionService', ['corregir', 'enviar']);
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    media = jasmine.createSpyObj<MultimediaService>('MultimediaService', ['urlAudio', 'urlImagen', 'urlVideo']);
    page = new EstudianteEvaluacionPage(router, evalSvc, media);
    // ngOnInit lee history.state.
    window.history.replaceState(state ?? { evaluacion: EV }, '');
    page.ngOnInit();
  }

  beforeEach(() => build());

  it('ngOnInit carga la evaluación desde history.state', () => {
    expect(page.ev).toEqual(EV);
    expect(page.total).toBe(2);
    expect(page.error).toBeNull();
  });

  it('ngOnInit sin state válido -> setea error', () => {
    build({});
    expect(page.ev).toBeNull();
    expect(page.error).toContain('No se encontró la evaluación');
  });

  describe('confirmar() + buffer', () => {
    it('acierto en intento 1 -> bufferea con alternativa1 = elegida e intento2 null', async () => {
      page.seleccionar(11);
      evalSvc.corregir.and.resolveTo(finalizada(true));

      await page.confirmar();

      expect(page.fase).toBe('feedback');
      expect(buffer().length).toBe(1);
      expect(buffer()[0]).toEqual(jasmine.objectContaining({
        preguntaId: 100,
        ordenPresentacion: 1,
        alternativaIntento1Id: 11,
        alternativaIntento2Id: null,
      }));
      expect(page.enviando).toBeFalse();
    });

    it('fallo intento1 NO bufferea pero recuerda altIntento1; tras intento2 bufferea ambas', async () => {
      // Intento 1 fallido.
      page.seleccionar(12);
      evalSvc.corregir.and.resolveTo(fallaIntento1());
      await page.confirmar();

      expect(buffer().length).toBe(0);
      expect((page as any).altIntento1).toBe(12);

      // Reintento -> intento 2.
      page.reintentar();
      expect(page.intento).toBe(2);
      expect(page.altBloqueada).toBe(12);

      page.seleccionar(11);
      evalSvc.corregir.and.resolveTo(finalizada(true));
      await page.confirmar();

      expect(buffer().length).toBe(1);
      expect(buffer()[0]).toEqual(jasmine.objectContaining({
        alternativaIntento1Id: 12, // recordada del intento 1
        alternativaIntento2Id: 11, // la del intento 2
      }));
    });

    it('si corregir() rechaza -> setea error y resetea enviando, sin bufferear', async () => {
      page.seleccionar(11);
      evalSvc.corregir.and.rejectWith(new Error('corregir falló'));

      await page.confirmar();

      expect(page.error).toBe('corregir falló');
      expect(page.enviando).toBeFalse();
      expect(buffer().length).toBe(0);
    });

    it('no hace nada si no hay selección', async () => {
      page.seleccion = null;
      await page.confirmar();
      expect(evalSvc.corregir).not.toHaveBeenCalled();
    });
  });

  describe('siguiente() / finalizar()', () => {
    it('siguiente en pregunta no-última avanza idx y resetea estado de pregunta', async () => {
      expect(page.esUltima).toBeFalse();
      page.seleccion = 11;
      page.intento = 2;
      await page.siguiente();

      expect(page.idx).toBe(1);
      expect(page.seleccion).toBeNull();
      expect(page.intento as number).toBe(1);
      expect(page.altBloqueada).toBeNull();
      expect((page as any).altIntento1).toBeNull();
    });

    it('en la última pregunta, siguiente() finaliza: envía el buffer y navega al resultado', async () => {
      // Responder P1 (acierta).
      page.seleccionar(11);
      evalSvc.corregir.and.resolveTo(finalizada(true));
      await page.confirmar();
      await page.siguiente(); // -> idx 1 (última)

      // Responder P2 (acierta).
      page.seleccionar(21);
      evalSvc.corregir.and.resolveTo({ ...finalizada(true), correctaAlternativaId: 21 });
      await page.confirmar();

      expect(page.esUltima).toBeTrue();
      evalSvc.enviar.and.resolveTo({ evaluacion_uuid: 'uuid-final' } as any);

      await page.siguiente(); // -> finalizar()

      // Envía las 2 respuestas bufferadas con modalidad/correo de la evaluación.
      expect(evalSvc.enviar).toHaveBeenCalledTimes(1);
      const args = evalSvc.enviar.calls.mostRecent().args;
      expect(args[0]).toBe(5);               // aplicacion_id
      expect(args[1]).toBe('IDENTIFICADA');  // modalidad
      expect((args[2] as any[]).length).toBe(2);
      expect(args[3]).toBe('a@uv.cl');       // correo

      expect(router.navigateByUrl).toHaveBeenCalledWith(
        '/estudiante/resultado/uuid-final',
        jasmine.objectContaining({ replaceUrl: true }),
      );
    });

    it('si enviar() falla -> setea error y RESETEA finalizando (no deja spinner colgado)', async () => {
      page.idx = 1; // forzamos última
      evalSvc.enviar.and.rejectWith(new Error('rollback'));

      await page.siguiente();

      expect(page.error).toBe('rollback');
      expect(page.finalizando).toBeFalse();
      expect(router.navigateByUrl).not.toHaveBeenCalled();
    });
  });

  it('volverACursos navega a la lista de cursos con replaceUrl', () => {
    page.volverACursos();
    expect(router.navigateByUrl).toHaveBeenCalledWith(
      '/estudiante/cursos', { replaceUrl: true },
    );
  });
});
