/**
 * Puntos de auscultación — datos de los hotspots 3D.
 *
 * ESQUEMA: RECSOP — 13 puntos estandarizados de auscultación PULMONAR
 * (CORSA / ERS) con su equivalencia ICBHI 2017. Fuente: presentación del
 * docente "RECSOP — 13 puntos de auscultación" (2026-06-02).
 *
 *   Posteriores (espalda): 6 → apical, medio, basal × (der/izq)   ICBHI Pr/Pl   nº 1–6
 *   Laterales (axilar medio): 2 → der/izq                         ICBHI Lr/Ll   nº 7–8
 *   Anteriores (pecho): 4 → apical, basal × (der/izq)             ICBHI Ar/Al   nº 9–12
 *   Tráquea (referencia, línea media): 1                          ICBHI Tc      nº 13
 *
 * MODELO 3D ASOCIADO: assets/auscultacion/torso.glb
 *   "Torso sculpt w arms" de Sketchfab — licencia CC BY.
 *
 *   Bounding box WORLD:  X 0..5, Y 0..2.5, Z 0..-1.25
 *   Centro WORLD:        (2.5, 1.25, -0.6)
 *
 *   ORIENTACIÓN REAL (verificada con las coords del editor):
 *     - X horizontal: lado DERECHO del paciente en X < 2.5; IZQUIERDO en X > 2.5.
 *       (Confirmado por los focos cardíacos: aórtico = derecho a X≈2.35.)
 *     - Y vertical:   0 (cintura) .. 2.5 (hombros)
 *     - Z profundidad: 0 (PECHO / anterior, +Z) .. -1.25 (ESPALDA / posterior, -Z)
 *
 *   La `cara` (pecho/espalda) se DERIVA de la normal:
 *     normal.z > 0 → 'anterior' (pecho);  normal.z < 0 → 'posterior' (espalda).
 *
 *   El `lado` y el código ICBHI se asignan por la GEOMETRÍA real (X del punto),
 *   no a mano: así un punto en X>2.5 es siempre izquierdo (Pl/Al/Ll) y uno en
 *   X<2.5 es derecho (Pr/Ar/Lr), sin riesgo de etiquetar mal la lateralidad.
 *
 * ESPEJADO AUTOMÁTICO (un anclaje medido → ambos lados):
 *   Cada punto bilateral se define UNA vez (su anclaje medido) y `espejar()`
 *   genera el gemelo del lado opuesto: refleja X (X' = 2·centroX − X), invierte
 *   normal.x, intercambia der↔izq, el código ICBHI (r↔l) y el número par/impar.
 *
 * CÓMO AJUSTAR/AGREGAR POSICIONES (editor):
 *   1. https://modelviewer.dev/editor/  → arrastrar torso.glb
 *   2. "Hotspot Mode" → click en la piel → copiar data-position / data-normal.
 */

export type GrupoAuscultacion = 'posterior' | 'anterior' | 'lateral' | 'traquea';

export interface PuntoAuscultacion {
  id: string;
  /** Número RECSOP del punto (1–13). El 13 es la tráquea (se rotula "T"). */
  numero: number;
  nombre: string;
  /** Código ICBHI 2017: Pr/Pl, Ar/Al, Lr/Ll, Tc. */
  icbhi: string;
  /** Grupo RECSOP (determina color/leyenda, igual que la presentación). */
  grupo: GrupoAuscultacion;
  /** Categoría general. Hoy todos los puntos del mapa son pulmonares. */
  categoria: 'cardiaco' | 'pulmonar' | 'abdominal' | 'vascular';
  /** Cara del cuerpo, derivada de la normal (no se escribe a mano). */
  cara: 'anterior' | 'posterior';
  /** Costado del paciente, derivado de la geometría (X respecto al centro). */
  lado: 'derecho' | 'izquierdo';
  ubicacion: string;
  descripcion: string;
  /** Posición 3D del hotspot en WORLD coords del modelo. Formato "x y z". */
  position: string;
  /** Vector normal del hotspot. Formato "x y z". */
  normal: string;
}

/** Eje de simetría del modelo en X (centro del bounding box WORLD). */
const CENTRO_X = 2.5;

/** Anclaje medido de un punto bilateral (un solo costado). */
interface HotspotBase {
  id: string;
  numero: number;
  nombre: string;
  icbhi: string;
  grupo: GrupoAuscultacion;
  lado: 'derecho' | 'izquierdo';
  ubicacion: string;
  descripcion: string;
  position: string;
  normal: string;
}

/**
 * ANCLAJES BILATERALES (6). Cada uno se define una vez con su lado/ICBHI/número
 * REALES según su posición sobre el modelo; `espejar()` produce el gemelo.
 *
 * Reutilizan las posiciones ya medidas en el editor para los puntos que existían
 * (ápice/medio/basal posteriores, ápice/basal anteriores). El axilar medio se
 * recalculó a media altura sobre la línea axilar media.
 */
const PUNTOS_ANCLA: HotspotBase[] = [
  // ---- POSTERIORES (espalda) — medidos en X≈2.77 (> 2.5) ⇒ lado IZQUIERDO ----
  {
    id: 'post-apical-izq',
    numero: 2,
    nombre: 'Posterior apical izquierdo',
    icbhi: 'Pl',
    grupo: 'posterior',
    lado: 'izquierdo',
    ubicacion: 'Región supraescapular, por encima de la espina de la escápula.',
    descripcion:
      'Ápice posterior del pulmón. Comparar simetría con el lado contralateral; crepitantes finos al final de la inspiración sugieren fibrosis.',
    // Acercados un poco al centro (hacia la columna) por pedido (2026-06-02).
    position: '2.7909498281141367 2.212389567927284 -1.083018071424431',
    normal: '0.0898753628664103 0.5210043252844936 -0.8488091141030949',
  },
  {
    id: 'post-medio-izq',
    numero: 4,
    nombre: 'Posterior medio izquierdo',
    icbhi: 'Pl',
    grupo: 'posterior',
    lado: 'izquierdo',
    ubicacion: 'Región interescapular (~T5-T6).',
    descripcion:
      'Zona de transición entre lóbulos superior e inferior. La egofonía aquí orienta a derrame pleural.',
    position: '2.7888727102972375 1.5234460614657115 -1.1216202630678542',
    normal: '0.26677207208247106 -0.4217412346503084 -0.8665835173556318',
  },
  {
    id: 'post-basal-izq',
    numero: 6,
    nombre: 'Posterior basal izquierdo',
    icbhi: 'Pl',
    grupo: 'posterior',
    lado: 'izquierdo',
    ubicacion: 'Región infraescapular baja, base del pulmón.',
    descripcion:
      'Base del pulmón. Sitio de elección para crepitantes congestivos (insuficiencia cardíaca, típicamente bilaterales) y derrame pleural.',
    position: '2.797375871257683 1.0543073663572347 -0.965596046575867',
    normal: '-0.011654562670001995 -0.3323373833633462 -0.9430885614766915',
  },

  // ---- LATERAL (axilar medio) — en el HTML del docente van en la CARA DORSAL
  //      (espalda): la dorsal tiene 8 puntos (6 posteriores + 2 axilares) y la
  //      ventral 5 (4 anteriores + tráquea). Por eso se ubican en la pared
  //      posterolateral, con la normal hacia atrás-lateral para que se vean
  //      desde la vista de espalda. X≈2.0 (<2.5) ⇒ lado DERECHO. ----
  {
    id: 'axilar-der',
    numero: 7,
    nombre: 'Axilar medio derecho',
    icbhi: 'Lr',
    grupo: 'lateral',
    lado: 'derecho',
    ubicacion: 'Línea axilar media, ~5.º espacio intercostal.',
    descripcion:
      'Pared lateral del tórax. Ausculta los segmentos laterales de los lóbulos (lóbulo medio derecho / língula izquierda). Útil cuando los hallazgos no se aprecian bien por delante o por detrás.',
    position: '1.95 1.4 -0.62',
    normal: '-0.8 0.0 -0.6',
  },

  // ---- ANTERIORES (pecho) — medidos en X≈2.3 (< 2.5) ⇒ lado DERECHO ----
  {
    id: 'ant-apical-der',
    numero: 9,
    nombre: 'Anterior apical derecho',
    icbhi: 'Ar',
    grupo: 'anterior',
    lado: 'derecho',
    ubicacion: 'Fosa supraclavicular / región infraclavicular alta.',
    descripcion:
      'Ápice anterior del pulmón. Murmullo vesicular suave. Crepitantes finos persistentes en los vértices orientan a fibrosis o, en jóvenes, a tuberculosis.',
    position: '2.3162497904336563 2.165915227291522 -0.4336559395417483',
    normal: '-0.08155478603238682 0.8677641116676695 0.49023898598217586',
  },
  {
    id: 'ant-basal-der',
    numero: 11,
    nombre: 'Anterior basal derecho',
    icbhi: 'Ar',
    grupo: 'anterior',
    lado: 'derecho',
    ubicacion: '5.º-6.º espacio intercostal, línea media mamilar.',
    descripcion:
      'Segmentos anteriores de los lóbulos inferiores, sobre la línea media mamilar. Sibilancias espiratorias sugieren broncoespasmo (asma/EPOC); crepitantes basales, congestión.',
    // 5.º-6.º EIC (base pulmonar anterior) sobre la LÍNEA MEDIA MAMILAR
    // (pedido cliente 2026-06): antes quedaba demasiado medial (X≈2.29, casi
    // paraesternal). X=2.18 lo lleva a la línea mamilar; su espejo (punto 12,
    // izquierdo) cae en X≈2.82, justo bajo el foco mitral (misma línea). El
    // usuario verifica en el dispositivo y se afina si hace falta.
    position: '2.18 1.18 -0.1',
    normal: '-0.25 0.06 0.97',
  },
];

/**
 * TRÁQUEA (punto 13, línea media, NO se espeja). Referencia del sonido traqueal
 * central. Posición CALCULADA sobre la horquilla esternal (escotadura yugular),
 * en la línea media anterior alta — afinar en el editor si se desea más precisión.
 */
const PUNTO_TRAQUEA: PuntoAuscultacion = {
  id: 'traquea',
  numero: 13,
  nombre: 'Tráquea — referencia',
  icbhi: 'Tc',
  grupo: 'traquea',
  categoria: 'pulmonar',
  cara: 'anterior',
  lado: 'derecho', // línea media; el valor no afecta (no se espeja)
  ubicacion: 'Línea media anterior, sobre la horquilla esternal (escotadura yugular).',
  descripcion:
    'Punto de referencia traqueal. Registra el sonido de la vía aérea central, patrón con el que se comparan los ruidos pulmonares periféricos. En ICBHI corresponde a la zona Tc.',
  // PEGADA A LA PIEL: Z = superficie REAL del esternón en la línea media a esta
  // altura (raycast contra la malla, 2026-06-03). Antes estaba en Y=2.36 / Z=-0.1,
  // que quedaba ~0.4 por delante del cuerpo (la superficie real ahí es Z≈-0.5),
  // por eso se veía despegada. Y=2.20 = horquilla esternal, justo sobre 9/10.
  position: '2.5 2.2 -0.457',
  normal: '0 0.57 0.82',
};

/**
 * Cara (vista) según el GRUPO, igual que el HTML del docente:
 *   - Cara DORSAL (espalda): posteriores + laterales axilares  → 8 puntos
 *   - Cara VENTRAL (pecho):  anteriores + tráquea               → 5 puntos
 * (En el HTML, los axilares 7 y 8 están dibujados en la silueta dorsal.)
 */
function caraDeGrupo(grupo: GrupoAuscultacion): PuntoAuscultacion['cara'] {
  return grupo === 'posterior' || grupo === 'lateral' ? 'posterior' : 'anterior';
}

/** Expande un anclaje a un PuntoAuscultacion completo. */
function aPunto(b: HotspotBase): PuntoAuscultacion {
  return {
    ...b,
    categoria: 'pulmonar',
    cara: caraDeGrupo(b.grupo),
  };
}

/** Intercambia el sufijo de lado en un id ('-der' ↔ '-izq'). */
function swapSufijoLado(id: string, nuevoLado: PuntoAuscultacion['lado']): string {
  const suf = nuevoLado === 'derecho' ? '-der' : '-izq';
  return id.replace(/-(der|izq)$/, suf);
}

/** Código ICBHI del lado opuesto (Pr↔Pl, Ar↔Al, Lr↔Ll). */
function icbhiOpuesto(icbhi: string): string {
  if (icbhi.endsWith('r')) return icbhi.slice(0, -1) + 'l';
  if (icbhi.endsWith('l')) return icbhi.slice(0, -1) + 'r';
  return icbhi;
}

/**
 * Refleja un punto bilateral al costado opuesto respecto al eje sagital
 * (X = centroX). Intercambia lado, ICBHI (r↔l), número (impar↔par contiguo) y
 * el texto del nombre. La `cara` no cambia (se conserva normal.z).
 */
export function espejar(
  p: PuntoAuscultacion,
  centroX: number = CENTRO_X
): PuntoAuscultacion {
  const [px, py, pz] = p.position.split(/\s+/).map(Number);
  const [nx, ny, nz] = p.normal.split(/\s+/).map(Number);
  const ladoOpuesto: PuntoAuscultacion['lado'] =
    p.lado === 'derecho' ? 'izquierdo' : 'derecho';
  const nombre =
    p.lado === 'derecho'
      ? p.nombre.replace('derecho', 'izquierdo').replace('derecha', 'izquierda')
      : p.nombre.replace('izquierdo', 'derecho').replace('izquierda', 'derecha');
  // Pares RECSOP: (1,2)(3,4)(5,6)(7,8)(9,10)(11,12). Impar=der, par=izq.
  const numeroOpuesto = p.numero % 2 === 1 ? p.numero + 1 : p.numero - 1;
  return {
    ...p,
    id: swapSufijoLado(p.id, ladoOpuesto),
    nombre,
    icbhi: icbhiOpuesto(p.icbhi),
    numero: numeroOpuesto,
    lado: ladoOpuesto,
    position: `${2 * centroX - px} ${py} ${pz}`,
    normal: `${-nx} ${ny} ${nz}`,
  };
}

/** Los 6 anclajes medidos, ya expandidos a PuntoAuscultacion. */
export const PUNTOS_BASE: PuntoAuscultacion[] = PUNTOS_ANCLA.map(aPunto);

/** Coloca un punto sobre el eje de simetría real (reemplaza su X por centroX). */
function centrarEnX(p: PuntoAuscultacion, centroX: number): PuntoAuscultacion {
  const [, py, pz] = p.position.split(/\s+/).map(Number);
  return { ...p, position: `${centroX} ${py} ${pz}` };
}

/**
 * Construye el set completo (13): los 6 anclajes + sus 6 espejos + la tráquea,
 * ordenados por número RECSOP (1..13).
 *
 * La TRÁQUEA es un punto de línea media: su X se fija al centro REAL del modelo
 * (`centroX`), el MISMO eje sobre el que son simétricos los pares izq/der. Así
 * queda centrada aunque el bounding box no esté exactamente en X = 2.5 (el
 * modelo trae brazos y puede descentrarse).
 */
export function construirPuntos(centroX: number = CENTRO_X): PuntoAuscultacion[] {
  const bilaterales = [
    ...PUNTOS_BASE,
    ...PUNTOS_BASE.map((p) => espejar(p, centroX)),
  ];
  const traquea = centrarEnX(PUNTO_TRAQUEA, centroX);
  return [...bilaterales, traquea].sort((a, b) => a.numero - b.numero);
}

/**
 * Focos CARDÍACOS — PRESERVADOS pero FUERA del mapa actual.
 *
 * El protocolo RECSOP del docente es solo PULMONAR (13 puntos), así que el mapa
 * 3D muestra únicamente esos 13. Estos focos cardíacos se conservan aquí por si
 * en el futuro se quiere un modo "cardíaco" aparte; NO se incluyen en
 * `construirPuntos()`. Posiciones estimadas (revisar en el editor si se reactivan).
 */
export const PUNTOS_CARDIACOS: PuntoAuscultacion[] = [
  {
    id: 'foco-aortico', numero: 0, nombre: 'Foco aórtico', icbhi: '', grupo: 'anterior',
    categoria: 'cardiaco', cara: 'anterior', lado: 'derecho',
    ubicacion: '2.º espacio intercostal derecho, línea paraesternal.',
    descripcion: 'Cierre de la válvula aórtica (A2). Soplos sistólicos eyectivos sugieren estenosis aórtica; diastólicos, insuficiencia aórtica.',
    position: '2.35 1.95 -0.18', normal: '-0.15 0.1 0.98',
  },
  {
    id: 'foco-pulmonar', numero: 0, nombre: 'Foco pulmonar', icbhi: '', grupo: 'anterior',
    categoria: 'cardiaco', cara: 'anterior', lado: 'izquierdo',
    ubicacion: '2.º espacio intercostal izquierdo, línea paraesternal.',
    descripcion: 'Cierre de la válvula pulmonar (P2). El desdoblamiento fisiológico de R2 se acentúa en inspiración.',
    position: '2.68 1.95 -0.18', normal: '0.15 0.1 0.98',
  },
  {
    id: 'foco-erb', numero: 0, nombre: 'Punto de Erb (aórtico accesorio)', icbhi: '', grupo: 'anterior',
    categoria: 'cardiaco', cara: 'anterior', lado: 'izquierdo',
    ubicacion: '3.º espacio intercostal izquierdo, línea paraesternal.',
    descripcion: 'Referencia entre base y ápex; mejor sitio para la insuficiencia aórtica y, en general, todos los ruidos.',
    position: '2.6 1.78 -0.14', normal: '0.1 0.1 0.99',
  },
  {
    id: 'foco-tricuspideo', numero: 0, nombre: 'Foco tricuspídeo', icbhi: '', grupo: 'anterior',
    categoria: 'cardiaco', cara: 'anterior', lado: 'izquierdo',
    ubicacion: '4.º-5.º espacio intercostal izquierdo, borde paraesternal.',
    descripcion: 'Cierre de la válvula tricúspide. Soplos pansistólicos que aumentan en inspiración (signo de Rivero-Carvallo).',
    position: '2.58 1.58 -0.1', normal: '0.08 0.05 0.99',
  },
  {
    id: 'foco-mitral', numero: 0, nombre: 'Foco mitral (apexiano)', icbhi: '', grupo: 'anterior',
    categoria: 'cardiaco', cara: 'anterior', lado: 'izquierdo',
    ubicacion: '5.º espacio intercostal izquierdo, línea medioclavicular (ápex).',
    descripcion: 'Cierre de la válvula mitral y calidad del R1. Foco de elección para insuficiencia/estenosis mitral; el decúbito lateral izquierdo lo intensifica.',
    position: '2.82 1.48 -0.07', normal: '0.2 0.05 0.98',
  },
];

/**
 * Set por defecto del mapa: los 13 puntos RECSOP (centro nominal 2.5). El
 * componente lo reemplaza al cargar el modelo usando el centro X real.
 */
export const PUNTOS_AUSCULTACION: PuntoAuscultacion[] = construirPuntos();
