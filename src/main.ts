/**
 * Punto de arranque (bootstrap) de la app del estudiante.
 *
 * App standalone de Angular 20 (sin NgModule): se monta AppComponent y se
 * registran los providers globales:
 *   - IonicRouteStrategy / provideIonicAngular → integración con Ionic.
 *   - provideRouter(routes) → enrutado lazy (ver app/app.routes.ts).
 *   - provideHttpClient → cliente HTTP que usa BaseService.
 *   - NativeStorage → almacenamiento del token en móvil (fallback localStorage en web).
 */
import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { provideHttpClient } from '@angular/common/http';
import { NativeStorage } from '@ionic-native/native-storage/ngx';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes),
    provideHttpClient(),
    NativeStorage
  ],
});
