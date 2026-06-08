import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Platform } from '@ionic/angular';
import { Router } from '@angular/router';
import { NativeStorage } from '@ionic-native/native-storage/ngx';

import { BaseService } from '../../base/service/base.service';
import { AnalyticsService } from './analytics.service';
import { environment } from '../../../../environments/environment';

export interface UsuarioSesion {
  usuario_id: number;
  nombre: string;
  correo: string;
  roles: string[];
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: string;
  usuario: UsuarioSesion;
}

const KEY_TOKEN = environment.DATA_KEY_TOKEN;
const KEY_REFRESH = 'refreshToken';
const KEY_USUARIO = 'usuario';
const KEY_PANEL = 'panel_actual';   // 'ADMIN' | 'DOCENTE' (RF-56)

export const ROL_SUPERADMIN = 'SUPERADMIN';
export const ROL_PROFESOR = 'PROFESOR';
export type PanelActual = 'ADMIN' | 'DOCENTE';

@Injectable({ providedIn: 'root' })
export class AuthService extends BaseService {
  private url: string;

  constructor(
    protected override httpClient: HttpClient,
    protected override storage: NativeStorage,
    protected override platform: Platform,
    protected override analyticsService: AnalyticsService,
    private router: Router
  ) {
    super(httpClient, platform, storage, analyticsService);
    this.url = this.BASE_URL;
  }

  /**
   * Login: llama POST /controlador_base/login.
   * El BaseService.post serializa como arg=urlencoded(JSON).
   */
  async login(correo: string, password: string): Promise<UsuarioSesion> {
    const data: LoginResponse = await this.post(this.url + 'login', {
      correo,
      password,
    });

    // Persistir token y datos del usuario
    await this.setStoreData(KEY_TOKEN, data.token);
    await this.setStoreData(KEY_REFRESH, data.refreshToken);
    await this.setStoreData(KEY_USUARIO, data.usuario);
    return data.usuario;
  }

  /**
   * Logout: borra storage local y redirige a /login (RF-58).
   */
  async logout(): Promise<void> {
    await this.removeStoreData(KEY_TOKEN);
    await this.removeStoreData(KEY_REFRESH);
    await this.removeStoreData(KEY_USUARIO);
    await this.removeStoreData(KEY_PANEL);
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  /** ¿Hay un token guardado? (No valida vigencia, solo presencia.) */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getStoreData(KEY_TOKEN);
    return !!token;
  }

  /** Datos del usuario logueado, o null. */
  async getUsuario(): Promise<UsuarioSesion | null> {
    return (await this.getStoreData(KEY_USUARIO)) || null;
  }

  /** Roles del usuario logueado, o []. */
  async getRoles(): Promise<string[]> {
    const u = await this.getUsuario();
    return u ? u.roles : [];
  }

  /** True si el usuario tiene el rol indicado. */
  async hasRol(rol: string): Promise<boolean> {
    return (await this.getRoles()).includes(rol);
  }

  /**
   * Decide la URL destino tras el login según los roles (RF-54..RF-56).
   *   profesor solo            → /panel-docente
   *   superadmin solo          → /panel-admin
   *   superadmin + profesor    → /seleccion-panel
   */
  rutaDestinoSegunRoles(roles: string[]): string {
    const esAdmin = roles.includes(ROL_SUPERADMIN);
    const esProf = roles.includes(ROL_PROFESOR);
    if (esAdmin && esProf) return '/seleccion-panel';
    if (esAdmin) return '/panel-admin';
    if (esProf) return '/panel-docente';
    return '/login'; // sin roles válidos
  }

  /** Persiste cuál panel está usando un usuario con doble rol (RF-56). */
  async setPanelActual(panel: PanelActual): Promise<void> {
    await this.setStoreData(KEY_PANEL, panel);
  }

  async getPanelActual(): Promise<PanelActual | null> {
    return (await this.getStoreData(KEY_PANEL)) || null;
  }
}
