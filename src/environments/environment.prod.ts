// =====================================================================
// CONFIGURACIÓN DE ENTORNO — PRODUCCIÓN (PROD)
// ---------------------------------------------------------------------
// Lo usa el build por defecto (`ng build`). QUÉ CAMBIAR PARA PRODUCCIÓN:
//   1. production: true  → silencia todos los console.* (logs apagados).
//   2. BASE_API_URL  → dominio HTTPS real del Controlador (gateway).
//   3. LOGICA_API_URL → dominio HTTPS real de la Lógica (multimedia).
// REGLA DE SEGURIDAD: NO debe quedar 'http://' ni 'localhost' ni una IP fija;
// solo HTTPS institucional. No incluir secretos/credenciales en este archivo.
// =====================================================================
export const environment = {
  production: true,

  // Despliegue de prueba en la nube (Render). Cambiar por el dominio
  // institucional HTTPS cuando exista. NO debe quedar http:// ni localhost.
  BASE_API_URL: 'https://auris-controlador-ybp5.onrender.com/controlador_base/',

  // Multimedia: se sube/sirve DIRECTO desde la lógica (multipart/streaming).
  LOGICA_API_URL: 'https://auris-logica.onrender.com/base_logica/',


  DATA_KEY_TOKEN: 'token',
  ERROR_EXPIRED_TOKEN: 'Su sesión ha expirado',

  
  PAGES: {
    home: { url: 'home' },
    novedades: { url: 'novedades' },
  },
};
