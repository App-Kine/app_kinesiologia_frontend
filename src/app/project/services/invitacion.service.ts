import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Platform } from '@ionic/angular';
import { NativeStorage } from '@ionic-native/native-storage/ngx';

import { BaseService } from '../../base/service/base.service';
import { AnalyticsService } from './analytics.service';

export interface InvitacionResumen {
  invitacion_id: string;
  correo_destino: string;
  estado: 'PENDIENTE' | 'COMPLETADA' | 'EXPIRADA' | 'REENVIADA';
  creada_en: string;
  expira_en: string;
  completada_en: string | null;
  creada_por_correo: string | null;
  creada_por_nombre: string | null;
}

export interface VerificarResp {
  invitacion_id: string;
  correo_destino: string;
  expira_en: string;
}

export interface CrearInvitacionResp {
  invitacion_id: string;
  correo_destino: string;
  expira_en: string;
  link: string; // visible solo en modo dev
}

@Injectable({ providedIn: 'root' })
export class InvitacionService extends BaseService {
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

  /** ADMIN: enviar invitación a un nuevo profesor. */
  crear(correo: string): Promise<CrearInvitacionResp> {
    return this.post(this.url + 'crearInvitacion', { correo });
  }

  /** ADMIN: listar todas las invitaciones (RF-83). */
  listar(): Promise<InvitacionResumen[]> {
    return this.post(this.url + 'listarInvitaciones', {});
  }

  /** PÚBLICO: cuando el profesor abre el link, validamos el token. */
  verificar(token: string): Promise<VerificarResp> {
    return this.post(this.url + 'verificarInvitacion', { token });
  }

  /** PÚBLICO: el profesor completa nombre + password. */
  completar(token: string, nombre: string, password: string): Promise<any> {
    return this.post(this.url + 'completarInvitacion', {
      token,
      nombre,
      password,
    });
  }
}
