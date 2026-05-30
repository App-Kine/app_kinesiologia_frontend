export const environment = {
  production: true,

  // ⚠️ PRODUCCIÓN: reemplazar por el dominio HTTPS real antes de compilar.
  // NO debe quedar http:// ni localhost en producción (lo define DTIC/infra).
  //   Ej: 'https://auris.uv.cl/api/controlador_base/'
  BASE_API_URL: 'https://CAMBIAR-DOMINIO-PRODUCCION/controlador_base/',

  // Multimedia: se sube/sirve DIRECTO desde la lógica (multipart/streaming).
  //   Ej: 'https://auris.uv.cl/media/base_logica/'
  LOGICA_API_URL: 'https://CAMBIAR-DOMINIO-PRODUCCION/base_logica/',


  DATA_KEY_TOKEN: 'token',
  ERROR_EXPIRED_TOKEN: 'Su sesión ha expirado',

  
  PAGES: {
    home: { url: 'home' },
    novedades: { url: 'novedades' },
  },
};
