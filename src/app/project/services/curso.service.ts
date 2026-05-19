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
}
