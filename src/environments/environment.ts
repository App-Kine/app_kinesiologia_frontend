// =====================================================================
// CONFIGURACIÓN DE ENTORNO — DESARROLLO (DEV)
// ---------------------------------------------------------------------
// Este archivo se compila DENTRO del bundle. Se usa en `npm start` y en el
// build móvil `ng build --configuration development`.
//
// QUÉ CAMBIAR PARA PRODUCCIÓN (no se edita aquí, sino en environment.prod.ts):
//   - production: true
//   - BASE_API_URL / LOGICA_API_URL → dominio HTTPS real (sin http:// ni localhost).
// No contiene secretos ni credenciales: solo URLs públicas y constantes de UI.
// =====================================================================
export const environment = {
  production: false,

  // Desarrollo local (web / simulador iOS).
  // ⚠️ Para probar en iPhone FÍSICO: reemplazar 'localhost' por la IP de la Mac
  // en la WiFi (el teléfono no resuelve localhost). Mac y iPhone en la MISMA red.
  // Ver README → "Para correr en iPhone físico".
  BASE_API_URL: 'http://localhost:3023/controlador_base/',

  // La multimedia (audios/imágenes) se sube/sirve DIRECTO desde la lógica
  // (no pasa por el controlador, porque es multipart/form-data + streaming).
  LOGICA_API_URL: 'http://localhost:2000/base_logica/',


  DATA_KEY_TOKEN: 'token',
  ERROR_EXPIRED_TOKEN: 'Su sesión ha expirado',


  PAGES: {
    home: { url: 'home' },
    novedades: { url: 'novedades' },
  },
};
