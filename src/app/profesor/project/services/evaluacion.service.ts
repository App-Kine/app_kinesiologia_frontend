import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Platform } from '@ionic/angular';
import { NativeStorage } from '@ionic-native/native-storage/ngx';

import { BaseService } from '../../base/service/base.service';
import { AnalyticsService } from './analytics.service';

/** Curso visible al estudiante (RF-02). */
export interface CursoPublico {
  curso_id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
}

/** Aplicación de test activa de un curso (RF-04). */
export interface AplicacionActiva {
  aplicacion_id: number;
  aplicacion_uuid: string;
  test_id: number;
  test_nombre: string;
  test_descripcion: string | null;
  cantidad_preguntas: number;
}

export interface AlternativaPublica {
  alternativa_id: number;
  texto: string;
  orden: number;
}

/** Pregunta SIN es_correcta (la corrección es server-side). */
export interface PreguntaEval {
  pregunta_id: number;
  orden_presentacion: number;
  enunciado: string;
  audio_grid_id: string | null;
  imagen_grid_id: string | null;
  video_grid_id: string | null;
  alternativas: AlternativaPublica[];
}

export interface EvaluacionIniciada {
  evaluacion_id: number;
  evaluacion_uuid: string;
  aplicacion_id: number;
  test_nombre: string;
  modalidad: 'ANONIMA' | 'IDENTIFICADA';
  total_preguntas: number;
  preguntas: PreguntaEval[];
}

/** Resultado de un intento (RF-32/34/35/36/38). */
export interface RespuestaResultado {
  correcta: boolean;
  intento: number;
  intentosUsados: number;
  finalizadaPregunta: boolean;
  puedeReintentar: boolean;
  correctaAlternativaId: number | null; // solo cuando finalizadaPregunta
  explicacion: string | null;           // solo cuando finalizadaPregunta
}

/** Resumen final (RF-39/40). */
export interface ResultadoFinal {
  evaluacion_id: number;
  modalidad: 'ANONIMA' | 'IDENTIFICADA';
  total_preguntas: number;
  aciertos_primer: number;
  aciertos_segundo: number;
  incorrectas: number;
  porcentaje_global: number;
}

/** Cabecera del informe completo descargable. */
export interface InformeCabecera {
  evaluacion_id: number;
  modalidad: 'ANONIMA' | 'IDENTIFICADA';
  correo_estudiante: string | null;
  test_nombre: string;
  curso_nombre: string;
  curso_codigo: string;
  total_preguntas: number;
  aciertos_primer: number;
  aciertos_segundo: number;
  incorrectas: number;
  porcentaje_global: number;
  finalizada_en: string;
}

/** Una pregunta dentro del informe completo. */
export interface InformePregunta {
  orden_presentacion: number;
  pregunta_id: number;
  enunciado: string;            // HTML sanitizado (puede tener <strong>, <ul>, etc.)
  explicacion_clinica: string;  // HTML sanitizado
  intentos_usados: number;
  resultado: 'CORRECTA_INT1' | 'CORRECTA_INT2' | 'INCORRECTA' | null;
  tiempo_segundos: number | null;
  alternativa_intento1_id: number | null;
  alternativa_intento2_id: number | null;
  alternativas: Array<{
    alternativa_id: number;
    texto: string;
    es_correcta: boolean;
    orden: number;
  }>;
}

export interface InformeCompleto {
  cabecera: InformeCabecera;
  preguntas: InformePregunta[];
}

@Injectable({ providedIn: 'root' })
export class EvaluacionService extends BaseService {
  private url: string;

  constructor(
    protected override httpClient: HttpClient,
    protected override storage: NativeStorage,
    protected override platform: Platform,
    protected override analyticsService: AnalyticsService
  ) {
    super(httpClient, platform, storage, analyticsService);
    this.url = this.BASE_URL;
  }

  /** Cursos activos (RF-02). Endpoint público. */
  listarCursos(): Promise<CursoPublico[]> {
    return this.post(this.url + 'evaluacion/cursos', {});
  }

  /** Tests (aplicaciones) activos de un curso (RF-04). */
  aplicacionesActivas(cursoId: number): Promise<AplicacionActiva[]> {
    return this.post(this.url + 'evaluacion/aplicacionesActivas', { cursoId });
  }

  /** Inicia la evaluación y trae las preguntas (RF-06..RF-14). */
  iniciar(
    aplicacionId: number,
    modalidad: 'ANONIMA' | 'IDENTIFICADA',
    correo?: string
  ): Promise<EvaluacionIniciada> {
    const args: any = { aplicacionId, modalidad };
    if (modalidad === 'IDENTIFICADA' && correo) args.correo = correo;
    return this.post(this.url + 'evaluacion/iniciar', args);
  }

  /**
   * Registra un intento de respuesta (RF-25/26/31).
   * `tiempoSegundos`: segundos en pantalla con la pregunta (pedido cliente
   * 2026-05-26). El backend solo lo persiste cuando este intento finaliza
   * la pregunta.
   */
  responder(
    evaluacionId: number,
    preguntaId: number,
    alternativaId: number,
    intento: 1 | 2,
    ordenPresentacion: number,
    tiempoSegundos?: number
  ): Promise<RespuestaResultado> {
    return this.post(this.url + 'evaluacion/responder', {
      evaluacionId,
      preguntaId,
      alternativaId,
      intento,
      ordenPresentacion,
      tiempoSegundos,
    });
  }

  /** Finaliza la evaluación y devuelve el resumen (RF-39/40). */
  finalizar(evaluacionId: number): Promise<ResultadoFinal> {
    return this.post(this.url + 'evaluacion/finalizar', { evaluacionId });
  }

  /**
   * Envía el informe de resultados al correo registrado (RF-41/42).
   * Se identifica por el UUID público (el id secuencial sería enumerable en
   * este endpoint sin login).
   */
  enviarInforme(
    evaluacionUuid: string
  ): Promise<{ enviado: boolean; correo: string; modo: string }> {
    return this.post(this.url + 'evaluacion/enviarInforme', { evaluacionUuid });
  }

  /**
   * Devuelve el informe completo (cabecera + todas las preguntas con
   * alternativas, selección, tiempo, etc.) para descarga PDF.
   * Pedido cliente 2026-05-26. Disponible para anónimas e identificadas.
   * Se identifica por el UUID público (ver nota en enviarInforme).
   */
  informeCompleto(evaluacionUuid: string): Promise<InformeCompleto> {
    return this.post(this.url + 'evaluacion/informeCompleto', { evaluacionUuid });
  }
}
