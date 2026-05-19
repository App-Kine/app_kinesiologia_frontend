import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Platform } from '@ionic/angular';
import { NativeStorage } from '@ionic-native/native-storage/ngx';

import { BaseService } from '../../base/service/base.service';
import { AnalyticsService } from './analytics.service';
import { createLogger } from './logger';

export interface CursoResumen {
  curso_id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
}

export interface CrearCursoInput {
  codigo: string;
  nombre: string;
  descripcion?: string | null;
}

const log = createLogger('curso');

@Injectable({ providedIn: 'root' })
export class CursoService extends BaseService {
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

  /** Lista todos los cursos activos. */
  async listar(): Promise<CursoResumen[]> {
    log.info('listar');
    try {
      const data = await this.post(this.url + 'cursos/listar', {});
      log.info('listar OK', { filas: data?.length });
      return data;
    } catch (e) {
      log.error('listar', e);
      throw e;
    }
  }

  /** Lista solo los cursos donde el profesor autenticado está asignado (RF-61). */
  async listarMisCursos(): Promise<CursoResumen[]> {
    log.info('misCursos');
    try {
      const data = await this.post(this.url + 'cursos/misCursos', {});
      log.info('misCursos OK', { filas: data?.length });
      return data;
    } catch (e) {
      log.error('misCursos', e);
      throw e;
    }
  }

  /** Crear un curso (el profesor queda como creador y asignado). */
  async crear(input: CrearCursoInput): Promise<{ curso_id: number }> {
    log.info('crear', input);
    try {
      const data = await this.post(this.url + 'cursos/crear', input);
      log.info('crear OK', data);
      return data;
    } catch (e) {
      log.error('crear', e);
      throw e;
    }
  }

  /** Obtiene un curso + sus aplicaciones de test. */
  async obtenerConAplicaciones(cursoId: number): Promise<any> {
    log.info('obtenerConAplicaciones', { cursoId });
    try {
      const data = await this.post(this.url + 'cursos/obtener', { cursoId });
      log.info('obtenerConAplicaciones OK');
      return data;
    } catch (e) {
      log.error('obtenerConAplicaciones', e);
      throw e;
    }
  }
}
