import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Platform } from '@ionic/angular';
import { NativeStorage } from '@ionic-native/native-storage/ngx';

import { BaseService } from '../../base/service/base.service';
import { AnalyticsService } from './analytics.service';
<<<<<<< HEAD

export interface PreguntaEnTest {
  preguntaId: number;
  orden: number; // 1..N
}

export interface TestInput {
  nombre: string;
  descripcion?: string | null;
  ordenAleatorio?: boolean;
  cursoOrigenId?: number | null;
  preguntas: PreguntaEnTest[];
=======
import { createLogger } from './logger';

const log = createLogger('test');

export interface TestPreguntaInput {
  preguntaId: number;
  orden: number;
}

export interface CrearTestInput {
  nombre: string;
  descripcion?: string | null;
  ordenAleatorio: boolean;
  cursoOrigenId?: number | null;
  preguntas: TestPreguntaInput[];
>>>>>>> c1be50b161eba707808a3bf917f8d24005bc82c9
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

<<<<<<< HEAD
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
=======
export interface TestDetalle {
  test_id: number;
  nombre: string;
  descripcion: string | null;
  orden_aleatorio: boolean;
  creado_por: number;
  curso_origen_id: number | null;
  clonado_de_id: number | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
  preguntas: Array<{
    pregunta_id: number;
    orden: number;
    enunciado: string;
  }>;
>>>>>>> c1be50b161eba707808a3bf917f8d24005bc82c9
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

<<<<<<< HEAD
  crear(t: TestInput): Promise<{ test_id: number }> {
    return this.post(this.url + 'crearTest', t);
  }

  listar(profesorId?: number): Promise<TestResumen[]> {
    const args: any = {};
    if (profesorId != null) args.profesorId = profesorId;
    return this.post(this.url + 'listarTests', args);
  }

  obtener(testId: number): Promise<TestDetalle> {
    return this.post(this.url + 'obtenerTest', { testId });
=======
  async crear(input: CrearTestInput): Promise<{ test_id: number }> {
    log.info('crear', { preguntas: input.preguntas?.length });
    try {
      const data = await this.post(this.url + 'crearTest', input);
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
      const params: any = {};
      if (Number.isInteger(profesorId)) params.profesorId = profesorId;
      const data = await this.post(this.url + 'listarTests', params);
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
>>>>>>> c1be50b161eba707808a3bf917f8d24005bc82c9
  }
}
