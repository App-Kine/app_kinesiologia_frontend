import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Configuración de Capacitor para Auris.
 *
 * ⚠️ SEGURIDAD (DTIC/Ciberseguridad) — LEER ANTES DE PRODUCCIÓN ⚠️
 * androidScheme:'http' + server.cleartext:true + android.allowMixedContent:true
 * habilitan tráfico HTTP PLANO (sin TLS). Esto es SOLO PARA DESARROLLO local,
 * donde el backend no tiene certificado. EN PRODUCCIÓN HAY QUE:
 *   - androidScheme: 'https'
 *   - quitar cleartext y allowMixedContent (o ponerlos en false)
 * Si estos flags quedan en el build de producción, la app aceptaría tráfico sin
 * cifrar → riesgo de intercepción/manipulación (man-in-the-middle). Idéntico
 * motivo aplica al NSAllowsArbitraryLoads del Info.plist en iOS.
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
