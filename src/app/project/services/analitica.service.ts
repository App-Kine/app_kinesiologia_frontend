import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Platform } from '@ionic/angular';
import { NativeStorage } from '@ionic-native/native-storage/ngx';

import { BaseService } from '../../base/service/base.service';
import { AnalyticsService } from './analytics.service';
import { createLogger } from './logger';

const log = createLogger('analitica');

export interface AnaliticaResumen {
  aplicacion_id: number;
  curso_id: number;
  curso_codigo: string;
  curso_nombre: string;
  test_id: number;
  test_nombre: string;
  activo: boolean;
  total_evaluaciones: number;
  evaluaciones_anonimas: number;
  evaluaciones_identificadas: number;
  porcentaje_promedio: number | null;
}

export interface AnaliticaPregunta {
  pregunta_id: number;
  enunciado: string;
  total_respuestas: number;
  aciertos_int1: number;
  aciertos_int2: number;
  errores: number;
  total_intentos: number;
  tasa_error: number; // 0..1
  /** Tiempo promedio en segundos (agregado anónimo + identificadas). null si todavía no hay tiempos registrados. */
  tiempo_promedio_segundos: number | null;
}

export interface AnaliticaEvaluacion {
  evaluacion_id: number;
  modalidad: 'ANONIMA' | 'IDENTIFICADA';
  correo_estudiante: string | null;
  total_preguntas: number | null;
  aciertos_primer: number | null;
  aciertos_segundo: number | null;
  incorrectas: number | null;
  porcentaje_global: number | null;
  finalizada_en: string | null;
  /** Suma de tiempos por pregunta. null si todas las respuestas son pre-migración 2026-05-26. */
  tiempo_total_segundos: number | null;
}

/** Tiempo individual por pregunta para estudiantes IDENTIFICADOS. */
export interface AnaliticaTiempoIndividual {
  evaluacion_id: number;
  modalidad: 'IDENTIFICADA';
  correo_estudiante: string | null;
  pregunta_id: number;
  orden_presentacion: number;
  resultado: string | null;
  intentos_usados: number;
  tiempo_segundos: number;
}

export interface AnaliticaDetalle {
  resumen: AnaliticaResumen;
  preguntas: AnaliticaPregunta[];
  evaluaciones: AnaliticaEvaluacion[];
  tiempos_identificados: AnaliticaTiempoIndividual[];
}

@Injectable({ providedIn: 'root' })
export class AnaliticaService extends BaseService {
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

  /** Lista las aplicaciones del profesor con resumen estadístico. */
  async resumen(): Promise<AnaliticaResumen[]> {
    log.info('resumen');
    try {
      const data = await this.post(this.url + 'analitica/resumen', {});
      log.info('resumen OK', { filas: data?.length });
      return data;
    } catch (e) {
      log.error('resumen', e);
      throw e;
    }
  }

  /** Detalle analítico de una aplicación. */
  async detalle(aplicacionId: number): Promise<AnaliticaDetalle> {
    log.info('detalle', { aplicacionId });
    try {
      const data = await this.post(this.url + 'analitica/aplicacion', { aplicacionId });
      log.info('detalle OK');
      return data;
    } catch (e) {
      log.error('detalle', e);
      throw e;
    }
  }
}
