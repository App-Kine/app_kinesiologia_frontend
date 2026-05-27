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

export interface PreguntaInput {
  enunciado: string;
  explicacionClinica: string;
  audioGridId?: string | null;
  imagenGridId?: string | null;
  videoGridId?: string | null;
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
  video_grid_id: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
  cantidad_alternativas: number;
}

export interface PreguntaDetalle extends PreguntaResumen {
  explicacion_clinica: string;
  creado_por: number;
  clonada_de_id: number | null;
  alternativas: {
    alternativa_id: number;
    texto: string;
    es_correcta: boolean;
    orden: number;
  }[];
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

  async crear(p: PreguntaInput): Promise<{ pregunta_id: number }> {
    log.info('crear', { alternativas: p.alternativas?.length });
    try {
      const data = await this.post(this.url + 'crearPregunta', p);
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
      const args: any = {};
      if (profesorId != null) args.profesorId = profesorId;
      const data = await this.post(this.url + 'listarPreguntas', args);
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

  async editar(preguntaId: number, p: PreguntaInput): Promise<{ pregunta_id: number }> {
    log.info('editar', { preguntaId });
    try {
      const data = await this.post(this.url + 'editarPregunta', { ...p, preguntaId });
      log.info('editar OK', data);
      return data;
    } catch (e) {
      log.error('editar', e);
      throw e;
    }
  }

  async eliminar(preguntaId: number): Promise<{ pregunta_id: number }> {
    log.info('eliminar', { preguntaId });
    try {
      const data = await this.post(this.url + 'eliminarPregunta', { preguntaId });
      log.info('eliminar OK');
      return data;
    } catch (e) {
      log.error('eliminar', e);
      throw e;
    }
  }

  async agregarATest(testId: number, p: PreguntaInput): Promise<{ pregunta_id: number; orden: number }> {
    log.info('agregarATest', { testId });
    try {
      const data = await this.post(this.url + 'agregarPreguntaATest', { ...p, testId });
      log.info('agregarATest OK', data);
      return data;
    } catch (e) {
      log.error('agregarATest', e);
      throw e;
    }
  }

  async quitarDeTest(testId: number, preguntaId: number): Promise<{ huerfanaEliminada: boolean }> {
    log.info('quitarDeTest', { testId, preguntaId });
    try {
      const data = await this.post(this.url + 'quitarPreguntaDeTest', { testId, preguntaId });
      log.info('quitarDeTest OK', data);
      return data;
    } catch (e) {
      log.error('quitarDeTest', e);
      throw e;
    }
  }
}
