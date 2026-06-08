import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders, HttpResponse, HttpErrorResponse } from "@angular/common/http";
import { NativeStorage } from "@ionic-native/native-storage/ngx";

import { Platform } from "@ionic/angular";
import { AnalyticsService } from "../../project/services/analytics.service";
import { environment } from "../../../environments/environment";

/**
 * BaseService — capa HTTP común de la app del estudiante.
 *
 * CÓMO SE LLAMA AL BACKEND:
 *   - Único método público de red: post(url, args). Envía a `url` (normalmente
 *     environment.BASE_API_URL = Controlador/gateway) el cuerpo
 *     `arg=<JSON url-encoded>` con Content-Type application/x-www-form-urlencoded.
 *
 * DÓNDE SE GUARDA EL TOKEN (sesión efímera):
 *   - getAngularHeaders() lee el token de storage (clave environment.DATA_KEY_TOKEN)
 *     y, si existe, lo agrega como cabecera Authorization.
 *   - Storage: en móvil (hybrid) usa NativeStorage; en web usa localStorage.
 *     No se guardan credenciales, solo el token devuelto por el backend.
 *
 * MANEJO DE ERRORES / SESIÓN EXPIRADA:
 *   - proccessResponse() interpreta la respuesta lógica del backend
 *     ({status:'OK'|'ERROR'}). Si el error es 'tokenError' → limpia la sesión
 *     (clearStoredData) y rechaza con ERROR_EXPIRED_TOKEN (no deja el spinner colgado).
 *   - handleError() normaliza fallas de transporte (HttpErrorResponse) a mensajes
 *     de usuario (sin conexión / 5xx / 401) y NO expone el texto crudo del error.
 */
@Injectable({
    providedIn: "root",
})
export class BaseService {
    httpClientHeaders!: HttpHeaders;
    BASE_URL: string;

    constructor(
        protected httpClient: HttpClient,
        protected platform: Platform,
        protected storage: NativeStorage,
        protected analyticsService: AnalyticsService
    ) {
        this.BASE_URL = environment.BASE_API_URL;
    }

    private async getAngularHeaders() {
        // FLUJO DEL ESTUDIANTE = 100% PÚBLICO (sin login). NO adjuntamos ninguna
        // cabecera Authorization a propósito:
        //   1) Los endpoints del estudiante (evaluacion/*) son públicos en el
        //      gateway; el token no aporta nada.
        //   2) En la app UNIFICADA puede quedar un token de una sesión de PROFESOR
        //      en storage. Si lo mandáramos aquí, la petición dejaría de ser
        //      "simple" y el navegador dispararía un preflight OPTIONS. El WebView
        //      de iOS (WKWebView, esquema capacitor:// + http en claro de dev)
        //      falla ese preflight → los cursos/tests no cargaban en el iPhone.
        // Sin Authorization la petición es simple y se comporta igual que la app
        // original del estudiante (que funcionaba en iOS). El panel del profesor
        // usa su PROPIO BaseService (src/app/profesor/base) que sí envía el token.
        this.httpClientHeaders = new HttpHeaders().append(
            "Content-Type",
            "application/x-www-form-urlencoded"
        );
    }
    private proccessResponse(data: any): any {
        let p = new Promise((onSuccess, onError) => {
            switch (data.status) {
                case "ERROR":
                   if (data.error.message.includes("tokenError")) {
                      // Token expirado: limpiamos sesión y SIEMPRE rechazamos la
                      // promesa con el mensaje de sesión expirada para no dejar
                      // el spinner colgado (antes solo hacía break -> promesa sin settle).
                      if (!environment.production) console.log('ERROR', data.error)
                      this.clearStoredData().catch(() => {});
                      const expiredError: any = new Error(environment.ERROR_EXPIRED_TOKEN);
                      onError(this.handleError(expiredError));
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
        // Errores de transporte HTTP (HttpErrorResponse): normalizamos por status
        // para no mostrar al usuario el texto crudo tipo
        // "Http failure response ... 0 Unknown Error".
        if (error instanceof HttpErrorResponse) {
            this.analyticsService.ErrorHandler(error);
            let msg: string;
            if (error.status === 0) {
                msg = "Sin conexión. Verifica tu internet e inténtalo de nuevo.";
            } else if (error.status >= 500) {
                msg = "Error del servidor. Intenta más tarde.";
            } else if (error.status === 401) {
                msg = environment.ERROR_EXPIRED_TOKEN;
            } else {
                msg = error.message;
            }
            // Devolvemos un Error con mensaje normalizado para las páginas.
            return new Error(msg);
        }
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
            // Las fallas de transporte (sin conexión, 5xx, 401) rechazan toPromise()
            // con un HttpErrorResponse crudo que no pasó por proccessResponse.
            // Lo normalizamos aquí para que las páginas no muestren el texto crudo
            // "Http failure response ... 0 Unknown Error".
            if (error instanceof HttpErrorResponse) {
                throw this.handleError(error);
            }
            throw error;
        }
    }

    public isMobilePlatform(): boolean {
        return this.platform.is("hybrid");
    }
    public async setStoreData(key: string, data: any) {
        if (this.isMobilePlatform()) {
            // await + catch: si falla el guardado nativo no rompemos el flujo
            // (antes era una promesa sin await -> unhandled rejection).
            try {
                await this.storage.setItem(key, data);
            } catch (error: any) {
                if (!environment.production) {
                    console.error(
                        new Error("No se pudo guardar dato nativo. key: " + key)
                    );
                }
            }
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
                if (!environment.production) {
                    if (error.code == 2) {
                        console.error(new Error("Data Not Found. key: " + key));
                    } else {
                        console.error(
                            new Error("Data Not Found. error: " + error.message)
                        );
                    }
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
          if (!environment.production) {
            if (error.code == 2) {
              console.error(new Error("Data Not Found. key: " + key));
            } else {
              console.error(
                new Error("Data Not Found. error: " + error.message)
              );
            }
          }
        }
      } else {
        // Web: borrar la key de localStorage. Sin esta rama, en navegador el
        // cierre de sesión no eliminaba el token (quedaba persistido).
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
