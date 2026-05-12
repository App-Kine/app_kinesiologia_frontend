import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders, HttpResponse } from "@angular/common/http";
import { NativeStorage } from "@ionic-native/native-storage/ngx";

import { Platform } from "@ionic/angular";
import { AnalyticsService } from "../../project/services/analytics.service";
import { environment } from "../../../environments/environment";

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
        let token = undefined;
        try {
            token = await this.getStoreData(environment.DATA_KEY_TOKEN);
        } catch (error) {
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
                   if (data.error.message.includes("tokenError")) {
                      console.log('ERROR', data.error)
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
