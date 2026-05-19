import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Platform } from '@ionic/angular';
import { NativeStorage } from '@ionic-native/native-storage/ngx';

import { BaseService } from '../../base/service/base.service';
import { AnalyticsService } from './analytics.service';

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
  }
}
