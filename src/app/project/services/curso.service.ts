import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Platform } from '@ionic/angular';
import { NativeStorage } from '@ionic-native/native-storage/ngx';

import { BaseService } from '../../base/service/base.service';
import { AnalyticsService } from './analytics.service';

export interface Curso {
  curso_id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
}

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

  listarActivos(): Promise<Curso[]> {
    return this.post(this.url + 'cursos/listar', {});
  }

  misCursos(profesorId?: number): Promise<Curso[]> {
    const args: any = {};
    if (profesorId != null) args.profesorId = profesorId;
    return this.post(this.url + 'cursos/misCursos', args);
  }
}
