import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Platform } from '@ionic/angular';
import { NativeStorage } from '@ionic-native/native-storage/ngx';

import { BaseService } from '../../base/service/base.service';
import { AnalyticsService } from './analytics.service';

export interface SolicitarResetResp {
  mensaje: string;
  devLink: string | null; // solo presente en modo dev (mailer dev) y si el correo existe
}

@Injectable({ providedIn: 'root' })
export class PasswordService extends BaseService {
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

  /** RF-59: solicitar enlace de recuperación por correo. */
  solicitar(correo: string): Promise<SolicitarResetResp> {
    return this.post(this.url + 'solicitarReset', { correo });
  }

  /** RF-59: fijar nueva contraseña con el token del enlace. */
  resetear(token: string, password: string): Promise<{ ok: boolean }> {
    return this.post(this.url + 'resetearPassword', { token, password });
  }

  /**
   * Cambia la contraseña del usuario AUTENTICADO (estando logueado).
   * `post()` adjunta el token automáticamente; el backend identifica al usuario
   * por el JWT, no por estos datos.
   */
  cambiar(passwordActual: string, passwordNueva: string): Promise<{ ok: boolean }> {
    return this.post(this.url + 'cambiarPassword', { passwordActual, passwordNueva });
  }
}
