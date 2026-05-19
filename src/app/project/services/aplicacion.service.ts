import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Platform } from '@ionic/angular';
import { NativeStorage } from '@ionic-native/native-storage/ngx';

import { BaseService } from '../../base/service/base.service';
import { AnalyticsService } from './analytics.service';
<<<<<<< HEAD

export interface AplicacionInput {
=======
import { createLogger } from './logger';

const log = createLogger('aplicacion');

export interface CrearAplicacionInput {
>>>>>>> c1be50b161eba707808a3bf917f8d24005bc82c9
  testId: number;
  cursoId: number;
}

export interface AplicacionResumen {
  aplicacion_id: number;
  aplicacion_uuid: string;
  test_id: number;
  test_nombre: string;
  curso_id: number;
  curso_codigo: string;
  curso_nombre: string;
  profesor_id: number;
  activo: boolean;
<<<<<<< HEAD
=======
  visible_desde: string | null;
  visible_hasta: string | null;
>>>>>>> c1be50b161eba707808a3bf917f8d24005bc82c9
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class AplicacionService extends BaseService {
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
  crear(a: AplicacionInput): Promise<{ aplicacion_id: number }> {
    return this.post(this.url + 'crearAplicacion', a);
  }

  listar(profesorId?: number): Promise<AplicacionResumen[]> {
    const args: any = {};
    if (profesorId != null) args.profesorId = profesorId;
    return this.post(this.url + 'listarAplicaciones', args);
  }

  setActivo(aplicacionId: number, activo: boolean): Promise<any> {
    return this.post(this.url + 'setActivoAplicacion', {
      aplicacionId,
      activo,
    });
=======
  async crear(input: CrearAplicacionInput): Promise<{ aplicacion_id: number; aplicacion_uuid: string }> {
    log.info('crear', input);
    try {
      const data = await this.post(this.url + 'crearAplicacion', input);
      log.info('crear OK', data);
      return data;
    } catch (e) {
      log.error('crear', e);
      throw e;
    }
  }

  /**
   * Lista aplicaciones. Filtros opcionales por profesor y/o curso.
   * En el panel docente, cursoId permite ver solo las del curso seleccionado.
   */
  async listar(profesorId?: number, cursoId?: number): Promise<AplicacionResumen[]> {
    log.info('listar', { profesorId, cursoId });
    try {
      const params: any = {};
      if (Number.isInteger(profesorId)) params.profesorId = profesorId;
      if (Number.isInteger(cursoId)) params.cursoId = cursoId;
      const data = await this.post(this.url + 'listarAplicaciones', params);
      log.info('listar OK', { filas: data?.length });
      return data;
    } catch (e) {
      log.error('listar', e);
      throw e;
    }
  }

  async setActivo(aplicacionId: number, activo: boolean): Promise<{ aplicacion_id: number; activo: boolean }> {
    log.info('setActivo', { aplicacionId, activo });
    try {
      const data = await this.post(this.url + 'setActivoAplicacion', { aplicacionId, activo });
      log.info('setActivo OK');
      return data;
    } catch (e) {
      log.error('setActivo', e);
      throw e;
    }
>>>>>>> c1be50b161eba707808a3bf917f8d24005bc82c9
  }
}
