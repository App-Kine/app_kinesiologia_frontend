import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Configuración de Capacitor para Auris.
 *
 * - appId: bundle identifier en iOS. Si tu equipo de Apple Developer ya tiene
 *   uno reservado, cámbialo aquí (también hay que cambiarlo en Xcode).
 * - webDir: dónde queda el build de Angular. angular.json apunta a "www".
 * - server.cleartext: permite HTTP plano (necesario en dev local sin TLS).
 *   En iOS además hay que habilitar NSAllowsArbitraryLoads en Info.plist;
 *   el script setup-ios.sh ya lo parchea automáticamente.
 * - android.allowMixedContent: en Android la app se sirve desde https://localhost,
 *   así que pedir a un backend http:// (dev) se bloquea como "mixed content".
 *   Esto lo permite. SOLO para desarrollo: en producción el backend va por HTTPS.
 */
const config: CapacitorConfig = {
  appId: 'cl.uchile.auris',
  appName: 'Auris',
  webDir: 'www',
  server: {
    // En DEV usamos 'http' para que el origen de la app (http://localhost) y el
    // backend de dev (http://IP) compartan esquema y no se bloquee como "mixed
    // content". En PRODUCCIÓN (backend HTTPS) volver a 'https'.
    androidScheme: 'http',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
