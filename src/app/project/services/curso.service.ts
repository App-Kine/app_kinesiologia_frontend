import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Platform } from '@ionic/angular';
import { NativeStorage } from '@ionic-native/native-storage/ngx';

import { BaseService } from '../../base/service/base.service';
import { AnalyticsService } from './analytics.service';
<<<<<<< HEAD

export interface Curso {
=======
import { createLogger } from './logger';

export interface CursoResumen {
>>>>>>> c1be50b161eba707808a3bf917f8d24005bc82c9
  curso_id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
}

<<<<<<< HEAD
=======
const log = createLogger('curso');

>>>>>>> c1be50b161eba707808a3bf917f8d24005bc82c9
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

<<<<<<< HEAD
  listarActivos(): Promise<Curso[]> {
    return this.post(this.url + 'cursos/listar', {});
  }

  misCursos(profesorId?: number): Promise<Curso[]> {
    const args: any = {};
    if (profesorId != null) args.profesorId = profesorId;
    return this.post(this.url + 'cursos/misCursos', args);
=======
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
>>>>>>> c1be50b161eba707808a3bf917f8d24005bc82c9
  }
}
