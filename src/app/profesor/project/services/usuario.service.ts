import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Platform } from '@ionic/angular';
import { NativeStorage } from '@ionic-native/native-storage/ngx';

import { BaseService } from '../../base/service/base.service';
import { AnalyticsService } from './analytics.service';

export interface UsuarioAdmin {
  usuario_id: number;
  nombre: string;
  correo: string;
  activo: boolean;
  created_at: string;
  roles: string[];
}

/**
 * Administración de usuarios (solo SUPERADMIN). Listar y eliminar (desactivar).
 */
@Injectable({ providedIn: 'root' })
export class UsuarioService extends BaseService {
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

  /** ADMIN: lista todos los usuarios internos con sus roles. */
  listar(): Promise<UsuarioAdmin[]> {
    return this.post(this.url + 'listarUsuarios', {});
  }

  /** ADMIN: eliminar = desactivar (soft-delete). El backend valida las guardas. */
  eliminar(usuarioId: number): Promise<{ usuario_id: number; activo: boolean }> {
    return this.post(this.url + 'eliminarUsuario', { usuario_id: usuarioId });
  }

  /** ADMIN: reactivar un usuario previamente desactivado. */
  reactivar(usuarioId: number): Promise<{ usuario_id: number; activo: boolean }> {
    return this.post(this.url + 'reactivarUsuario', { usuario_id: usuarioId });
  }
}
