import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Platform } from '@ionic/angular';
import { NativeStorage } from '@ionic-native/native-storage/ngx';

import { BaseService } from '../../base/service/base.service';
import { AnalyticsService } from './analytics.service';
import { createLogger } from './logger';

const log = createLogger('test');

export interface PreguntaEnTest {
  preguntaId: number;
  orden: number;
}

export interface TestInput {
  nombre: string;
  descripcion?: string | null;
  ordenAleatorio?: boolean;
  cursoOrigenId?: number | null;
  preguntas: PreguntaEnTest[];
}

export interface EditarTestInput {
  nombre: string;
  descripcion?: string | null;
  ordenAleatorio?: boolean;
}

export interface TestResumen {
  test_id: number;
  nombre: string;
  descripcion: string | null;
  orden_aleatorio: boolean;
  curso_origen_id: number | null;
  curso_nombre: string | null;
  activo: boolean;
  created_at: string;
  cantidad_preguntas: number;
}

export interface TestDetalle extends TestResumen {
  creado_por: number;
  clonado_de_id: number | null;
  updated_at: string;
  preguntas: {
    pregunta_id: number;
    orden: number;
    enunciado: string;
    explicacion_clinica?: string;
    audio_grid_id?: string | null;
    imagen_grid_id?: string | null;
    cantidad_alternativas?: number;
  }[];
}

@Injectable({ providedIn: 'root' })
export class TestService extends BaseService {
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

  async crear(t: TestInput): Promise<{ test_id: number }> {
    log.info('crear', { nombre: t.nombre, preguntas: t.preguntas?.length });
    try {
      const data = await this.post(this.url + 'crearTest', t);
      log.info('crear OK', data);
      return data;
    } catch (e) {
      log.error('crear', e);
      throw e;
    }
  }

  async listar(profesorId?: number): Promise<TestResumen[]> {
    log.info('listar', { profesorId });
    try {
      const args: any = {};
      if (profesorId != null) args.profesorId = profesorId;
      const data = await this.post(this.url + 'listarTests', args);
      log.info('listar OK', { filas: data?.length });
      return data;
    } catch (e) {
      log.error('listar', e);
      throw e;
    }
  }

  async obtener(testId: number): Promise<TestDetalle> {
    log.info('obtener', { testId });
    try {
      const data = await this.post(this.url + 'obtenerTest', { testId });
      log.info('obtener OK');
      return data;
    } catch (e) {
      log.error('obtener', e);
      throw e;
    }
  }

  async editar(testId: number, t: EditarTestInput): Promise<{ test_id: number }> {
    log.info('editar', { testId });
    try {
      const data = await this.post(this.url + 'editarTest', { ...t, testId });
      log.info('editar OK', data);
      return data;
    } catch (e) {
      log.error('editar', e);
      throw e;
    }
  }

  async eliminar(testId: number): Promise<{ test_id: number }> {
    log.info('eliminar', { testId });
    try {
      const data = await this.post(this.url + 'eliminarTest', { testId });
      log.info('eliminar OK', data);
      return data;
    } catch (e) {
      log.error('eliminar', e);
      throw e;
    }
  }
}
