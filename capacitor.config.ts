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
 */
const config: CapacitorConfig = {
  appId: 'cl.uchile.auris',
  appName: 'Auris',
  webDir: 'www',
  server: {
    // 'http' (no 'https') para que la app corra en http://localhost y pueda
    // llamar al backend local por HTTP sin que el WebView bloquee por
    // "mixed content". Para producción (dominio HTTPS real) volver a 'https'.
    androidScheme: 'http',
    cleartext: true,
  },
};

export default config;
