import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Platform } from '@ionic/angular';
import { NativeStorage } from '@ionic-native/native-storage/ngx';

import { BaseService } from '../../base/service/base.service';
import { AnalyticsService } from './analytics.service';

export interface AplicacionInput {
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
  }
}
