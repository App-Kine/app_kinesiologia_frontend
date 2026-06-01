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
    androidScheme: 'https',
    cleartext: true,
  },
};

export default config;
