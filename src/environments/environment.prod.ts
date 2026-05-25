export const environment = {
  production: true,
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
