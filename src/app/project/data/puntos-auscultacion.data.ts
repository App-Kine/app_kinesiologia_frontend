/**
 * Puntos de auscultación — datos de los hotspots 3D.
 *
 * MODELO 3D ASOCIADO: assets/auscultacion/torso.glb
 *   "Torso sculpt w arms" de Sketchfab — licencia CC BY.
 *
 *   Bounding box WORLD:  X 0..5, Y 0..2.5, Z 0..-1.25
 *   Centro WORLD:        (2.5, 1.25, -0.6)
 *
 *   ORIENTACIÓN REAL (verificada con las coords del editor):
 *     - X horizontal: 0 (un costado) .. 5 (el otro). Eje de simetría en X = 2.5.
 *     - Y vertical:   0 (cintura) .. 2.5 (hombros)
 *     - Z profundidad: 0 (PECHO / anterior, lado +Z) .. -1.25 (ESPALDA / posterior, lado -Z)
 *
 *   Cómo se distingue la cara por la NORMAL del hotspot:
 *     - normal.z > 0  → la superficie mira hacia +Z → cara ANTERIOR (pecho)
 *     - normal.z < 0  → la superficie mira hacia -Z → cara POSTERIOR (espalda)
 *   `cara` se deriva automáticamente con esa regla (no se escribe a mano).
 *
 * COMO COLOCAR PUNTOS NUEVOS (forma fácil):
 *   1. Abrir https://modelviewer.dev/editor/
 *   2. Arrastrar src/assets/auscultacion/torso.glb
 *   3. Activar "Hotspot Mode" y hacer click donde quieras el punto.
 *   4. Copiar `data-position` y `data-normal` (quitando el sufijo "m").
 *   5. Pegarlos como un objeto en PUNTOS_UN_LADO de abajo.
 *
 * ESPEJADO AUTOMÁTICO (un solo lado → ambos lados):
 *   Solo hace falta definir UN costado en PUNTOS_UN_LADO. El helper
 *   `espejar()` genera el gemelo del lado opuesto reflejando X respecto al
 *   eje de simetría (X' = 5 - X) e invirtiendo la componente X de la normal.
 *
 *   ⚠️ Los focos CARDÍACOS no son bilateralmente simétricos (el corazón está
 *   a la izquierda). El espejado tiene sentido clínico para campos PULMONARES;
 *   para puntos cardíacos, revisar manualmente cuáles conviene espejar.
 *
 *   ⚠️ Contenido clínico provisional ("pendiente de validación docente"):
 *   falta el mapeo número→foco clínico.
 */

export interface PuntoAuscultacion {
  id: string;
  nombre: string;
  categoria: 'cardiaco' | 'pulmonar' | 'abdominal' | 'vascular';
  /**
   * Cara del cuerpo. Se DERIVA de la normal (no se escribe a mano):
   * normal.z > 0 → 'anterior' (pecho); normal.z < 0 → 'posterior' (espalda).
   */
  cara: 'anterior' | 'posterior';
  /** Costado del cuerpo. El gemelo espejado vive en el costado opuesto. */
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

/** Datos de cada hotspot medido en el editor (un solo costado). */
interface HotspotBase {
  id: string;
  nombre: string;
  categoria: PuntoAuscultacion['categoria'];
  ubicacion: string;
  descripcion: string;
  position: string;
  normal: string;
}

/**
 * UN SOLO COSTADO (el medido en el editor). El otro se genera por espejo.
 * `cara` se deriva de la normal, así que no puede quedar mal etiquetada.
 *
 * Grupo ANTERIOR (pecho): los 4 puntos con normal.z > 0 (Z ≈ 0).
 * Grupo POSTERIOR (espalda): los 6 puntos con normal.z < 0 (Z ≈ -1.0),
 *   que en el editor venían numerados 1..6.
 */
// IDENTIFICACIÓN (inferida de la posición sobre el modelo, 2026-05-29):
// los 4 puntos del PECHO y los 6 de la ESPALDA forman columnas verticales
// ápice→base → son CAMPOS DE AUSCULTACIÓN PULMONAR (bilaterales, por eso el
// espejado es clínicamente válido). NO son focos cardíacos (esos van dispersos
// por el precordio y se agregarán aparte). ⚠ Revisar nombres/niveles con el docente.
const PUNTOS_UN_LADO: HotspotBase[] = [
  // ---- CAMPOS PULMONARES ANTERIORES (pecho) — normal.z > 0, de ápice a base ----
  {
    id: 'ant-1-der',
    nombre: 'Vértice pulmonar anterior (derecho)',
    categoria: 'pulmonar',
    ubicacion: 'Fosa supraclavicular / región infraclavicular alta.',
    descripcion:
      'Ápice del pulmón. Murmullo vesicular suave. Crepitantes finos persistentes en los vértices orientan a fibrosis o, en adultos jóvenes, a tuberculosis. Comparar siempre con el lado contralateral.',
    position: '2.3162497904336563 2.165915227291522 -0.4336559395417483',
    normal: '-0.08155478603238682 0.8677641116676695 0.49023898598217586',
  },
  {
    id: 'ant-2-der',
    nombre: 'Campo anterior superior (derecho)',
    categoria: 'pulmonar',
    ubicacion: '2.º espacio intercostal, línea medioclavicular.',
    descripcion:
      'Segmentos anteriores del lóbulo superior. Murmullo vesicular normal; su disminución unilateral sugiere derrame o atelectasia.',
    position: '2.2837474244439906 1.9673307152664141 -0.21598360435885336',
    normal: '-0.07144425395030499 0.6739868690180207 0.73528050359626',
  },
  {
    id: 'ant-3-der',
    nombre: 'Campo anterior medio (derecho)',
    categoria: 'pulmonar',
    ubicacion: '3.º-4.º espacio intercostal, línea medioclavicular.',
    descripcion:
      'Lóbulo medio (pulmón derecho) o língula (pulmón izquierdo). Buen sitio para crepitantes de condensación neumónica.',
    position: '2.2901347084191475 1.719207055595298 -0.06391426996184929',
    normal: '-0.09038504308679554 0.3599264701604575 0.9285922033185673',
  },
  {
    id: 'ant-4-der',
    nombre: 'Base pulmonar anterior (derecha)',
    categoria: 'pulmonar',
    ubicacion: '5.º-6.º espacio intercostal, línea medioclavicular.',
    descripcion:
      'Segmentos anteriores de los lóbulos inferiores. Sibilancias espiratorias sugieren broncoespasmo (asma/EPOC); crepitantes basales, congestión.',
    position: '2.2942971789492916 1.4719880802392193 -0.0652732136176483',
    normal: '-0.3510241330454077 0.08128904589940167 0.9328312543201396',
  },

  // ---- CAMPOS PULMONARES POSTERIORES (espalda) — normal.z < 0, de ápice a base ----
  {
    id: 'post-6-der',
    nombre: 'Vértice pulmonar posterior (derecho)',
    categoria: 'pulmonar',
    ubicacion: 'Región supraescapular, por encima de la espina de la escápula.',
    descripcion:
      'Ápice posterior del pulmón. Comparar simetría con el lado contralateral; crepitantes finos al final de la inspiración sugieren fibrosis.',
    position: '2.7709498281141367 2.212389567927284 -1.083018071424431',
    normal: '0.0898753628664103 0.5210043252844936 -0.8488091141030949',
  },
  {
    id: 'post-5-der',
    nombre: 'Interescapular superior (derecho)',
    categoria: 'pulmonar',
    ubicacion: 'Entre la columna y el borde interno de la escápula, parte alta (~T3-T4).',
    descripcion:
      'Segmentos posteriores del lóbulo superior. Soplo tubárico (broncofonía aumentada) sugiere condensación o atelectasia.',
    position: '2.7676479281244664 1.8679379525687028 -1.1918399358592942',
    normal: '0.09772098596361509 -0.03973455141121597 -0.9944203207529745',
  },
  {
    id: 'post-4-der',
    nombre: 'Interescapular medio (derecho)',
    categoria: 'pulmonar',
    ubicacion: 'Región interescapular (~T5-T6).',
    descripcion:
      'Zona de transición entre lóbulos superior e inferior. La egofonía aquí orienta a derrame pleural.',
    position: '2.7688727102972375 1.5234460614657115 -1.1216202630678542',
    normal: '0.26677207208247106 -0.4217412346503084 -0.8665835173556318',
  },
  {
    id: 'post-2-der',
    nombre: 'Campo posterolateral (derecho)',
    categoria: 'pulmonar',
    ubicacion: 'Hacia la línea axilar posterior.',
    descripcion:
      'Cara lateral del pulmón. Útil para evaluar los segmentos laterales del lóbulo inferior. (Punto más lateral que el resto de la columna posterior — verificar ubicación.)',
    position: '3.0901274171762063 1.3518615838853323 -0.9715186256015581',
    normal: '0.6260997766512568 -0.5360356728812903 -0.5662727497204407',
  },
  {
    id: 'post-3-der',
    nombre: 'Infraescapular (derecho)',
    categoria: 'pulmonar',
    ubicacion: 'Por debajo del ángulo inferior de la escápula (~T8).',
    descripcion:
      'Porción superior de la base pulmonar posterior. Crepitantes aquí pueden indicar inicio de congestión o neumonía basal.',
    position: '2.7718996376262592 1.3006248678059957 -1.0407945203130906',
    normal: '0.05323837337441607 -0.21697729714879901 -0.9747238214604422',
  },
  {
    id: 'post-1-der',
    nombre: 'Base pulmonar posterior (derecha)',
    categoria: 'pulmonar',
    ubicacion: 'Región infraescapular baja, base del pulmón.',
    descripcion:
      'Base del pulmón. Sitio de elección para crepitantes congestivos (insuficiencia cardíaca, típicamente bilaterales) y derrame pleural. Evaluar excursión diafragmática por percusión adyacente.',
    position: '2.777375871257683 1.0543073663572347 -0.965596046575867',
    normal: '-0.011654562670001995 -0.3323373833633462 -0.9430885614766915',
  },

  // ---- CAMPO LATERAL (región infraaxilar) — pared lateral del tórax, bajo la
  //      axila. Bilateral (se espeja al otro lado). ⚠ Posición ESTIMADA. ----
  {
    id: 'infraaxilar-1-der',
    nombre: 'Campo infraaxilar (derecho)',
    categoria: 'pulmonar',
    ubicacion: 'Línea axilar media, por debajo de la axila (~6.º espacio intercostal).',
    descripcion:
      'Pared lateral del tórax, bajo la axila. Ausculta los segmentos laterales de los lóbulos inferiores (lóbulo medio derecho / língula izquierda). Útil cuando los hallazgos no se aprecian bien por delante o por detrás.',
    position: '2.05 1.4 -0.35',
    normal: '-0.9 0.05 0.43',
  },
];

/** Deriva la cara (pecho/espalda) a partir del signo de la normal en Z. */
function caraDeNormal(normal: string): PuntoAuscultacion['cara'] {
  const nz = Number(normal.split(/\s+/)[2]);
  return nz >= 0 ? 'anterior' : 'posterior';
}

/** Expande un hotspot base a un PuntoAuscultacion completo del lado derecho. */
function aPunto(b: HotspotBase): PuntoAuscultacion {
  return {
    ...b,
    cara: caraDeNormal(b.normal),
    lado: 'derecho',
  };
}

/**
 * Refleja un punto al costado opuesto del cuerpo respecto al eje de simetría
 * sagital del modelo (X = centroX):
 *   - X → 2·centroX - X
 *   - normal.X → -normal.X (la cara sigue mirando el mismo frente/espalda)
 *   - Y, Z y normal.Y/Z se mantienen → la `cara` no cambia.
 *
 * `centroX` por defecto es el centro del bounding box (CENTRO_X). El
 * componente lo recalcula en runtime con el centro REAL que reporta
 * model-viewer, para que el espejo quede simétrico aunque el modelo no esté
 * perfectamente centrado en X.
 */
export function espejar(
  p: PuntoAuscultacion,
  centroX: number = CENTRO_X
): PuntoAuscultacion {
  const [px, py, pz] = p.position.split(/\s+/).map(Number);
  const [nx, ny, nz] = p.normal.split(/\s+/).map(Number);
  const ladoOpuesto: PuntoAuscultacion['lado'] =
    p.lado === 'derecho' ? 'izquierdo' : 'derecho';
  const sufijoOpuesto = ladoOpuesto === 'izquierdo' ? '-izq' : '-der';
  return {
    ...p,
    id: p.id.replace(/-(der|izq)$/, sufijoOpuesto),
    nombre: p.nombre.replace('derecho', 'izquierdo').replace('derecha', 'izquierda'),
    lado: ladoOpuesto,
    position: `${2 * centroX - px} ${py} ${pz}`,
    normal: `${-nx} ${ny} ${nz}`,
  };
}

/** Genera el set completo: pulmonares (medidos + espejo) + focos cardíacos. */
export function construirPuntos(centroX: number = CENTRO_X): PuntoAuscultacion[] {
  return [
    ...PUNTOS_BASE,
    ...PUNTOS_BASE.map((p) => espejar(p, centroX)),
    ...PUNTOS_CARDIACOS,
  ];
}

/** El costado medido en el editor (lado derecho), ya expandido. */
export const PUNTOS_BASE: PuntoAuscultacion[] = PUNTOS_UN_LADO.map(aPunto);

/**
 * Focos CARDÍACOS (cara anterior). NO se espejan: el corazón está a la
 * izquierda, así que cada foco tiene una posición anatómica propia.
 *
 * ⚠️ Posiciones ESTIMADAS sobre el modelo — pueden requerir ajuste fino en el
 * editor de model-viewer (mismo flujo que los demás puntos). El contenido
 * clínico (nombres, ubicación, descripción) sí es correcto.
 *
 * Convención de este modelo: lado DERECHO del paciente en X < 2.5; IZQUIERDO
 * en X > 2.5; pecho en Z ≈ 0 (normal hacia +Z).
 */
export const PUNTOS_CARDIACOS: PuntoAuscultacion[] = [
  {
    id: 'foco-aortico',
    nombre: 'Foco aórtico',
    categoria: 'cardiaco',
    cara: 'anterior',
    lado: 'derecho',
    ubicacion: '2.º espacio intercostal derecho, línea paraesternal.',
    descripcion:
      'Cierre de la válvula aórtica (componente A2 del 2.º ruido). En la base, R2 suele ser más intenso que R1. Soplos sistólicos eyectivos sugieren estenosis aórtica; diastólicos, insuficiencia aórtica.',
    position: '2.35 1.95 -0.18',
    normal: '-0.15 0.1 0.98',
  },
  {
    id: 'foco-pulmonar',
    nombre: 'Foco pulmonar',
    categoria: 'cardiaco',
    cara: 'anterior',
    lado: 'izquierdo',
    ubicacion: '2.º espacio intercostal izquierdo, línea paraesternal.',
    descripcion:
      'Cierre de la válvula pulmonar (componente P2). El desdoblamiento fisiológico de R2 se acentúa en inspiración. Soplos sistólicos sugieren estenosis pulmonar.',
    position: '2.68 1.95 -0.18',
    normal: '0.15 0.1 0.98',
  },
  {
    id: 'foco-erb',
    nombre: 'Punto de Erb (aórtico accesorio)',
    categoria: 'cardiaco',
    cara: 'anterior',
    lado: 'izquierdo',
    ubicacion: '3.º espacio intercostal izquierdo, línea paraesternal.',
    descripcion:
      'Punto de referencia entre la base y el ápex. Es el mejor sitio para auscultar los soplos de insuficiencia aórtica y, en general, todos los ruidos cardíacos.',
    position: '2.6 1.78 -0.14',
    normal: '0.1 0.1 0.99',
  },
  {
    id: 'foco-tricuspideo',
    nombre: 'Foco tricuspídeo',
    categoria: 'cardiaco',
    cara: 'anterior',
    lado: 'izquierdo',
    ubicacion: '4.º-5.º espacio intercostal izquierdo, borde paraesternal.',
    descripcion:
      'Cierre de la válvula tricúspide. Los soplos pansistólicos sugieren insuficiencia tricuspídea, que aumenta en inspiración (signo de Rivero-Carvallo).',
    position: '2.58 1.58 -0.1',
    normal: '0.08 0.05 0.99',
  },
  {
    id: 'foco-mitral',
    nombre: 'Foco mitral (apexiano)',
    categoria: 'cardiaco',
    cara: 'anterior',
    lado: 'izquierdo',
    ubicacion: '5.º espacio intercostal izquierdo, línea medioclavicular (ápex).',
    descripcion:
      'Cierre de la válvula mitral y calidad del R1. Foco de elección para soplos de insuficiencia o estenosis mitral. El decúbito lateral izquierdo lo intensifica.',
    position: '2.82 1.48 -0.07',
    normal: '0.2 0.05 0.98',
  },
];

/**
 * Set por defecto: costado medido + espejo respecto al centro nominal (2.5).
 * El componente lo reemplaza al cargar el modelo usando el centro real.
 */
export const PUNTOS_AUSCULTACION: PuntoAuscultacion[] = construirPuntos();
