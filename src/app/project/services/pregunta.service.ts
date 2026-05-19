import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Platform } from '@ionic/angular';
import { NativeStorage } from '@ionic-native/native-storage/ngx';

import { BaseService } from '../../base/service/base.service';
import { AnalyticsService } from './analytics.service';

export interface AlternativaInput {
  texto: string;
  esCorrecta: boolean;
  orden: number; // 1..5
}

export interface PreguntaInput {
  enunciado: string;
  explicacionClinica: string;
  audioGridId?: string | null;   // ObjectId hex 24 chars
  imagenGridId?: string | null;
  cursoOrigenId?: number | null;
  alternativas: AlternativaInput[]; // 2..5, exactamente 1 esCorrecta=true
}

export interface PreguntaResumen {
  pregunta_id: number;
  enunciado: string;
  curso_origen_id: number | null;
  curso_nombre: string | null;
  audio_grid_id: string | null;
  imagen_grid_id: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
  cantidad_alternativas: number;
}

export interface PreguntaDetalle extends PreguntaResumen {
  explicacion_clinica: string;
  creado_por: number;
  clonada_de_id: number | null;
  alternativas: {
    alternativa_id: number;
    texto: string;
    es_correcta: boolean;
    orden: number;
  }[];
}

@Injectable({ providedIn: 'root' })
export class PreguntaService extends BaseService {
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

  crear(p: PreguntaInput): Promise<{ pregunta_id: number }> {
    return this.post(this.url + 'crearPregunta', p);
  }

  listar(profesorId?: number): Promise<PreguntaResumen[]> {
    const args: any = {};
    if (profesorId != null) args.profesorId = profesorId;
    return this.post(this.url + 'listarPreguntas', args);
  }

  obtener(preguntaId: number): Promise<PreguntaDetalle> {
    return this.post(this.url + 'obtenerPregunta', { preguntaId });
  }

  editar(preguntaId: number, p: PreguntaInput): Promise<{ pregunta_id: number }> {
    return this.post(this.url + 'editarPregunta', { ...p, preguntaId });
  }

  eliminar(preguntaId: number): Promise<{ pregunta_id: number }> {
    return this.post(this.url + 'eliminarPregunta', { preguntaId });
  }

  /** Crea pregunta + la vincula al test en una sola operación. */
  agregarATest(testId: number, p: PreguntaInput): Promise<{ pregunta_id: number; orden: number }> {
    return this.post(this.url + 'agregarPreguntaATest', { ...p, testId });
  }

  /** Quita la pregunta del test. Si queda huérfana se marca como inactiva. */
  quitarDeTest(testId: number, preguntaId: number): Promise<{ huerfanaEliminada: boolean }> {
    return this.post(this.url + 'quitarPreguntaDeTest', { testId, preguntaId });
  }
}
