/**
 * Punto de arranque (bootstrap) de la APP UNIFICADA de Auris.
 *
 * App standalone de Angular 20 (sin NgModule): se monta AppComponent y se
 * registran los providers globales:
 *   - IonicRouteStrategy / provideIonicAngular → integración con Ionic.
 *   - provideRouter(routes) → enrutado lazy (ver app/app.routes.ts).
 *   - provideHttpClient + authInterceptor → cliente HTTP; el interceptor del
 *     panel centraliza el manejo de 401/403 (logout + redirect a /login) y
 *     adjunta el JWT cuando hay sesión. En el flujo del estudiante (público,
 *     sin token) no adjunta nada y no interfiere.
 *   - NativeStorage → almacenamiento del token en móvil (fallback localStorage en web).
 */
import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { NativeStorage } from '@ionic-native/native-storage/ngx';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { authInterceptor } from './app/profesor/base/interceptors/auth.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    NativeStorage
  ],
});
