import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpHeaders, HttpResponse } from "@angular/common/http";
import { NativeStorage } from "@ionic-native/native-storage/ngx";
import { Router } from "@angular/router";

import { Platform } from "@ionic/angular";
import { AnalyticsService } from "../../project/services/analytics.service";
import { environment } from "../../../../environments/environment";

/**
 * Servicio base del que heredan todos los services de dominio (auth, curso,
 * test, etc.). Centraliza:
 *   - el cliente HTTP hacia el Controlador (BASE_API_URL),
 *   - la inyección del JWT en el header Authorization de cada request,
 *   - el desempaque del envelope {status, data|error} del backend,
 *   - el almacenamiento del token (NativeStorage en móvil / localStorage en web),
 *   - la limpieza de sesión y redirección a /login cuando el token expira.
 */
@Injectable({
    providedIn: "root",
})
export class BaseService {
    httpClientHeaders!: HttpHeaders;
    BASE_URL: string;

    // Router para redirigir al login cuando expira la sesión (token inválido).
    // Nombre propio (no "router") para no colisionar con subclases que ya
    // declaran su propio `private router`.
    private routerBase = inject(Router);
    private redirigiendoLogin = false;

    constructor(
        protected httpClient: HttpClient,
        protected platform: Platform,
        protected storage: NativeStorage,
        protected analyticsService: AnalyticsService
    ) {
        this.BASE_URL = environment.BASE_API_URL;
    }

    /**
     * Arma los headers de cada request al Controlador. Si hay un JWT guardado,
     * lo agrega en el header `Authorization` para que el backend autentique y
     * autorice la operación (validación real server-side).
     */
    private async getAngularHeaders() {
        let token = undefined;
        try {
            token = await this.getStoreData(environment.DATA_KEY_TOKEN);
        } catch (error) {
            // Sin token aún (ej. antes del login): la request sale sin Authorization.
            console.log("NO TOKEN YET");
        }
        this.httpClientHeaders = new HttpHeaders();
        this.httpClientHeaders = this.httpClientHeaders.append(
            "Content-Type",
            "application/x-www-form-urlencoded"
        );
        if (token) {
            this.httpClientHeaders = this.httpClientHeaders.append(
                "Authorization",
                token
            );
        }
    }
    private proccessResponse(data: any): any {
        let p = new Promise((onSuccess, onError) => {
            switch (data.status) {
                case "ERROR":
                   if (
                      data.error.message.includes("tokenError") ||
                      data.error.message.includes("expirada") ||
                      data.error.message.includes("expirado") ||
                      data.error.message.includes("Token")
                    ) {
                      // Sesión vencida/inválida: limpiamos y mandamos al login.
                      this.manejarSesionExpirada();
                      onError(
                        new Error(
                          environment.ERROR_EXPIRED_TOKEN || "Su sesión ha expirado"
                        )
                      );
                      break
                    } else {
                      onError(this.handleError(data.error));
                      break
                    }
                case "OK":
                    onSuccess(data.data);
                    break;
                default:
                    onError(
                        new Error(
                            "Invalid Response From Server: " + data.status
                        )
                    );
                    break;
            }
        });
        return p;
    }
    private handleError(error: any) {
        //console.error(error);
        // Errores que no se reportan a las estadísticas
        // if (error.message.includes("tokenError")) {
        //   return false
        // } else
        if (error.message.includes("Invalid Credentials")) {
            this.analyticsService.ErrorHandler(error);
            error.message =
                "La contraseña ingresada no es correcta. Para recuperarla presione el boton ¿Olvidaste tu contraseña?";
            return error;
        } else if (error.message.includes("ETIMEDOUT")) {
            this.analyticsService.ErrorHandler(error);
            error.message =
                "El tiempo de espera para la conexión ha terminado. Verifique su conexión a internet";
            return error;
        } else if (
            error.message.includes("Not Found") ||
            error.message.includes("Unexpected token <")
        ) {
            this.analyticsService.ErrorHandler(error);
            error.message =
                "Error de conexión con el servidor. Servicio no encontrado";
            return error;
        } else {
            this.analyticsService.ErrorHandler(error);
            return error;
        }
    }

    /**
     * POST genérico al backend. Adjunta el token (getAngularHeaders), serializa
     * el cuerpo como `arg=urlencoded(JSON)` (formato que espera el Controlador)
     * y procesa el envelope {status, data|error} de la respuesta.
     */
    public async post(_url: string, args: any): Promise<any> {
        try {
            await this.getAngularHeaders();
            let _args = "arg=" + encodeURIComponent(JSON.stringify(args));
            let data = await this.httpClient
                .post(_url, _args, { headers: this.httpClientHeaders })
                .toPromise();
            let response = await this.proccessResponse(data);
            return response;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Sesión expirada/ inválida: borra el token y redirige al login una sola
     * vez (evita loops si caen varias requests en paralelo).
     */
    private async manejarSesionExpirada(): Promise<void> {
        if (this.redirigiendoLogin) return;
        this.redirigiendoLogin = true;
        try {
            await this.removeStoreData(environment.DATA_KEY_TOKEN);
        } catch (_) {}
        try {
            await this.routerBase.navigateByUrl("/login", { replaceUrl: true });
        } finally {
            // Permitir futuros redirects tras un nuevo login.
            setTimeout(() => (this.redirigiendoLogin = false), 1500);
        }
    }

    public isMobilePlatform(): boolean {
        return this.platform.is("hybrid");
    }
    public setStoreData(key: string, data: any) {
        if (this.isMobilePlatform()) {
            this.storage.setItem(key, data);
        } else {
            localStorage.setItem(key, JSON.stringify(data));
        }
    }

    public async getStoreData(key: string): Promise<any> {
        let data: any = null;
        if (this.isMobilePlatform()) {
            try {
                data = await this.storage.getItem(key);
            } catch (error:any) {
                if (error.code == 2) {
                    console.error(new Error("Data Not Found. key: " + key));
                } else {
                    console.error(
                        new Error("Data Not Found. error: " + error.message)
                    );
                }
            }
        } else {
            data = JSON.parse(localStorage.getItem(key) || 'null');
        }
        return data;
    }
    public async removeStoreData(key: string): Promise<any> {
      if (this.isMobilePlatform()) {
        try {
          await this.storage.remove(key);
        } catch (error: any) {
          if (error.code == 2) {
            console.error(new Error("Data Not Found. key: " + key));
          } else {
            console.error(
              new Error("Data Not Found. error: " + error.message)
            );
          }
        }
      } else {
        // Web: borrar la key de localStorage. Sin esta rama, en navegador el
        // cierre de sesión no eliminaba el token (quedaba persistido tras logout).
        localStorage.removeItem(key);
      }
    }
    public async clearStoredData() {
        if (this.isMobilePlatform()) {
              await this.storage.clear();
        } else {
            localStorage.clear();
        }
    }

}
