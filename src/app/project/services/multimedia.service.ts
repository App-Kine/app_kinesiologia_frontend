import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Platform } from '@ionic/angular';
import { NativeStorage } from '@ionic-native/native-storage/ngx';
import { lastValueFrom } from 'rxjs';

import { BaseService } from '../../base/service/base.service';
import { AnalyticsService } from './analytics.service';
import { environment } from '../../../environments/environment';
import { createLogger } from './logger';

const log = createLogger('multimedia');

export type TipoMedia = 'audio' | 'imagen';

export interface SubidaResult {
  grid_id: string;
  contentType: string;
}

/**
 * Multimedia (audios/imágenes de las preguntas).
 *
 * A diferencia del resto de servicios, este NO pasa por el controlador:
 * sube el archivo como multipart/form-data DIRECTO a la lógica
 * (environment.LOGICA_API_URL) y arma a mano el header Authorization con el
 * JWT guardado tras el login. El streaming de descarga se consume como una
 * URL pública (urlAudio / urlImagen) en <audio>/<img>.
 *
 * Límites (validados también en el backend):
 *   audio  → MP3/WAV ≤ 10 MB
 *   imagen → JPG/PNG ≤ 2 MB (RNF-39)
 */
@Injectable({ providedIn: 'root' })
export class MultimediaService extends BaseService {
  private logicaUrl: string;

  static readonly AUDIO_MAX = 10 * 1024 * 1024;
  static readonly IMAGEN_MAX = 2 * 1024 * 1024;
  static readonly AUDIO_MIME = ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/wave'];
  static readonly IMAGEN_MIME = ['image/jpeg', 'image/jpg', 'image/png'];

  constructor(
    protected override httpClient: HttpClient,
    protected override storage: NativeStorage,
    protected override platform: Platform,
    protected override analyticsService: AnalyticsService
  ) {
    super(httpClient, platform, storage, analyticsService);
    this.logicaUrl = environment.LOGICA_API_URL;
  }

  /** Validación cliente previa (mensaje amigable antes de subir). */
  validar(file: File, tipo: TipoMedia): string | null {
    const mimes = tipo === 'audio' ? MultimediaService.AUDIO_MIME : MultimediaService.IMAGEN_MIME;
    const max = tipo === 'audio' ? MultimediaService.AUDIO_MAX : MultimediaService.IMAGEN_MAX;
    const etiqueta = tipo === 'audio' ? 'MP3 o WAV, máx 10 MB' : 'JPG o PNG, máx 2 MB';
    if (!mimes.includes(file.type)) {
      return `Formato no permitido (${file.type || 'desconocido'}). Se acepta: ${etiqueta}.`;
    }
    if (file.size > max) {
      return `El archivo supera el límite (${etiqueta}).`;
    }
    return null;
  }

  async subirAudio(file: File, preguntaId?: number): Promise<SubidaResult> {
    return this.subir('audio', file, preguntaId);
  }

  async subirImagen(file: File, preguntaId?: number): Promise<SubidaResult> {
    return this.subir('imagen', file, preguntaId);
  }

  private async subir(tipo: TipoMedia, file: File, preguntaId?: number): Promise<SubidaResult> {
    const errLocal = this.validar(file, tipo);
    if (errLocal) {
      log.warn('validación local falló', errLocal);
      throw new Error(errLocal);
    }

    const endpoint = tipo === 'audio' ? 'multimedia/subirAudio' : 'multimedia/subirImagen';
    const form = new FormData();
    form.append('archivo', file, file.name);
    if (preguntaId != null) form.append('preguntaId', String(preguntaId));

    const headers = await this.authHeaders();
    log.info('subir', { tipo, name: file.name, size: file.size });

    try {
      const resp: any = await lastValueFrom(
        this.httpClient.post(this.logicaUrl + endpoint, form, { headers })
      );
      const data = this.desempacar(resp);
      log.info('subir OK', data);
      return data as SubidaResult;
    } catch (e) {
      log.error('subir', e);
      throw e;
    }
  }

  /** Borra un archivo (profesor). Idempotente en backend. */
  async eliminar(gridId: string, tipo: TipoMedia): Promise<void> {
    const headers = await this.authHeaders('application/x-www-form-urlencoded');
    const body = 'arg=' + encodeURIComponent(JSON.stringify({ gridId, tipo }));
    log.info('eliminar', { gridId, tipo });
    try {
      const resp: any = await lastValueFrom(
        this.httpClient.post(this.logicaUrl + 'multimedia/eliminar', body, { headers })
      );
      this.desempacar(resp);
      log.info('eliminar OK');
    } catch (e) {
      log.error('eliminar', e);
      throw e;
    }
  }

  /** URL pública para reproducir un audio en <audio [src]>. */
  urlAudio(gridId: string): string {
    return this.logicaUrl + 'multimedia/audio/' + gridId;
  }

  /** URL pública para mostrar una imagen en <img [src]>. */
  urlImagen(gridId: string): string {
    return this.logicaUrl + 'multimedia/imagen/' + gridId;
  }

  /** Header Authorization (Bearer) a partir del token guardado. */
  private async authHeaders(contentType?: string): Promise<HttpHeaders> {
    let h = new HttpHeaders();
    const token = await this.getStoreData(environment.DATA_KEY_TOKEN);
    if (token) {
      const value = String(token).startsWith('Bearer ') ? String(token) : 'Bearer ' + token;
      h = h.append('Authorization', value);
    }
    // Para FormData NO seteamos Content-Type (el navegador pone el boundary).
    if (contentType) h = h.append('Content-Type', contentType);
    return h;
  }

  /** Desempaca el envelope {status, data|error} de la lógica. */
  private desempacar(resp: any): any {
    if (resp && resp.status === 'OK') return resp.data;
    const msg = resp && resp.error ? resp.error.message : 'Respuesta inválida del servidor';
    throw new Error(msg);
  }
}
