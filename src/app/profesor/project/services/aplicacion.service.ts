import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Platform } from '@ionic/angular';
import { NativeStorage } from '@ionic-native/native-storage/ngx';

import { BaseService } from '../../base/service/base.service';
import { AnalyticsService } from './analytics.service';
import { createLogger } from './logger';

const log = createLogger('aplicacion');

export interface CrearAplicacionInput {
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
  visible_desde: string | null;
  visible_hasta: string | null;
  created_at: string;
}

/** Página de resultados paginados (escalabilidad). */
export interface AplicacionPagina {
  items: AplicacionResumen[];
  page: number;
  pageSize: number;
  hasMore: boolean;
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

  /**
   * Igual que listar() pero paginado (escalabilidad): pide una página y dice si
   * hay más. El backend devuelve { items, page, pageSize, hasMore }.
   */
  async listarPagina(
    page = 1,
    pageSize = 20,
    profesorId?: number,
    cursoId?: number
  ): Promise<AplicacionPagina> {
    log.info('listarPagina', { page, pageSize });
    try {
      const params: any = { page, pageSize };
      if (Number.isInteger(profesorId)) params.profesorId = profesorId;
      if (Number.isInteger(cursoId)) params.cursoId = cursoId;
      const data = await this.post(this.url + 'listarAplicaciones', params);
      log.info('listarPagina OK', { filas: data?.items?.length, hasMore: data?.hasMore });
      return data;
    } catch (e) {
      log.error('listarPagina', e);
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
  }

  async eliminar(aplicacionId: number): Promise<{ aplicacion_id: number }> {
    log.info('eliminar', { aplicacionId });
    try {
      const data = await this.post(this.url + 'eliminarAplicacion', { aplicacionId });
      log.info('eliminar OK');
      return data;
    } catch (e) {
      log.error('eliminar', e);
      throw e;
    }
  }
}
