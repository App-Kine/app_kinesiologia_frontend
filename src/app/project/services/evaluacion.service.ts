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

/**
 * NUEVA SHAPE (auditoría 2026-05-28).
 * `iniciar` ya NO crea fila en BD, así que ya NO devuelve evaluacion_id.
 * Trae la modalidad y el correo elegidos para que el cliente los recuerde
 * y los reenvíe en /enviar al final.
 */
export interface EvaluacionIniciada {
  aplicacion_id: number;
  test_nombre: string;
  modalidad: 'ANONIMA' | 'IDENTIFICADA';
  correo: string | null;          // null si ANONIMA
  total_preguntas: number;
  preguntas: PreguntaEval[];
}

/** Una respuesta bufferada en cliente que se mandará al final. */
export interface RespuestaParaEnviar {
  preguntaId: number;
  ordenPresentacion: number;
  alternativaIntento1Id: number;
  alternativaIntento2Id: number | null;
  tiempoSegundos: number | null;
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
  /** Identificador público no adivinable: se usa para pedir el informe. */
  evaluacion_uuid: string;
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
   * Corrige un intento SIN persistir nada (auditoría 2026-05-28).
   * Devuelve si la respuesta es correcta + (si la pregunta queda finalizada)
   * la alternativa correcta y la explicación clínica.
   *
   * NADA se guarda en la BD: si el estudiante cierra el navegador ahora,
   * no queda rastro alguno.
   */
  corregir(
    aplicacionId: number,
    preguntaId: number,
    alternativaId: number,
    intento: 1 | 2
  ): Promise<RespuestaResultado> {
    return this.post(this.url + 'evaluacion/corregir', {
      aplicacionId,
      preguntaId,
      alternativaId,
      intento,
    });
  }

  /**
   * Envía la evaluación COMPLETA al final del test (auditoría 2026-05-28).
   *
   * Crea la fila auris.evaluacion, inserta todas las auris.respuesta_pregunta
   * y calcula los totales — todo en UNA transacción atómica en backend.
   *
   * Es el único momento en el que algo se persiste. Si el estudiante NO llama
   * a este método (cerró el navegador, perdió conexión), la BD no tiene rastro.
   */
  enviar(
    aplicacionId: number,
    modalidad: 'ANONIMA' | 'IDENTIFICADA',
    respuestas: RespuestaParaEnviar[],
    correo?: string | null
  ): Promise<ResultadoFinal> {
    const args: any = { aplicacionId, modalidad, respuestas };
    if (modalidad === 'IDENTIFICADA' && correo) args.correo = correo;
    return this.post(this.url + 'evaluacion/enviar', args);
  }

  /**
   * Envía el informe de resultados al correo registrado (RF-41/42).
   * Se identifica por el UUID público (no por el id secuencial, que sería
   * enumerable en este endpoint sin login).
   */
  enviarInforme(
    evaluacionUuid: string,
    pdfBase64?: string
  ): Promise<{ enviado: boolean; correo: string; modo: string }> {
    return this.post(this.url + 'evaluacion/enviarInforme', { evaluacionUuid, pdfBase64 });
  }

  /**
   * Devuelve el informe completo (cabecera + todas las preguntas con
   * alternativas, selección, tiempo, etc.) para descarga PDF.
   * Pedido cliente 2026-05-26. Disponible para anónimas e identificadas.
   * Se identifica por el UUID público (ver nota de seguridad en enviarInforme).
   */
  informeCompleto(evaluacionUuid: string): Promise<InformeCompleto> {
    return this.post(this.url + 'evaluacion/informeCompleto', { evaluacionUuid });
  }
}
