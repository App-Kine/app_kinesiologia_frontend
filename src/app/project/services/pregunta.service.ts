import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Platform } from '@ionic/angular';
import { NativeStorage } from '@ionic-native/native-storage/ngx';

import { BaseService } from '../../base/service/base.service';
import { AnalyticsService } from './analytics.service';
import { createLogger } from './logger';

const log = createLogger('pregunta');

export interface AlternativaInput {
  texto: string;
  esCorrecta: boolean;
  orden: number;
}

export interface CrearPreguntaInput {
  enunciado: string;
  explicacionClinica: string;
  audioGridId?: string | null;
  imagenGridId?: string | null;
  cursoOrigenId?: number | null;
  alternativas: AlternativaInput[];
}

export interface PreguntaResumen {
  pregunta_id: number;
  enunciado: string;
  curso_origen_id: number | null;
  curso_nombre: string | null;
  audio_grid_id: string | null;
  imagen_grid_id: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface AlternativaDetalle {
  alternativa_id: number;
  texto: string;
  es_correcta: boolean;
  orden: number;
}

export interface PreguntaDetalle {
  pregunta_id: number;
  enunciado: string;
  explicacion_clinica: string;
  audio_grid_id: string | null;
  imagen_grid_id: string | null;
  creado_por: number;
  curso_origen_id: number | null;
  clonada_de_id: number | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
  alternativas: AlternativaDetalle[];
}

@Injectable({ providedIn: 'root' })
export class PreguntaService extends BaseService {
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

  async crear(input: CrearPreguntaInput): Promise<{ pregunta_id: number }> {
    log.info('crear', { alts: input.alternativas?.length });
    try {
      const data = await this.post(this.url + 'crearPregunta', input);
      log.info('crear OK', data);
      return data;
    } catch (e) {
      log.error('crear', e);
      throw e;
    }
  }

  async listar(profesorId?: number): Promise<PreguntaResumen[]> {
    log.info('listar', { profesorId });
    try {
      const params: any = {};
      if (Number.isInteger(profesorId)) params.profesorId = profesorId;
      const data = await this.post(this.url + 'listarPreguntas', params);
      log.info('listar OK', { filas: data?.length });
      return data;
    } catch (e) {
      log.error('listar', e);
      throw e;
    }
  }

  async obtener(preguntaId: number): Promise<PreguntaDetalle> {
    log.info('obtener', { preguntaId });
    try {
      const data = await this.post(this.url + 'obtenerPregunta', { preguntaId });
      log.info('obtener OK');
      return data;
    } catch (e) {
      log.error('obtener', e);
      throw e;
    }
  }
}
