export const environment = {
  production: false,

  // ⚠️ Para probar en iPhone FÍSICO se usa la IP de la Mac en la WiFi
  // (localhost no funciona en el teléfono). Mac y iPhone en la MISMA red.
  // Si vuelves a usar SOLO el simulador o web, puedes volver a 'localhost'.
  // (IP de la Mac detectada: 192.168.1.84)
  BASE_API_URL: 'http://192.168.1.84:3023/controlador_base/',

  // La multimedia (audios/imágenes) se sube/sirve DIRECTO desde la lógica
  // (no pasa por el controlador, porque es multipart/form-data + streaming).
  LOGICA_API_URL: 'http://192.168.1.84:2000/base_logica/',


  DATA_KEY_TOKEN: 'token',
  ERROR_EXPIRED_TOKEN: 'Su sesión ha expirado',


  PAGES: {
    home: { url: 'home' },
    novedades: { url: 'novedades' },
  },
};
