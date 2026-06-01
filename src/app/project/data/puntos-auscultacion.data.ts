/**
 * Puntos de auscultación clásicos — datos hardcoded.
 *
 * MODELO 3D ASOCIADO: assets/auscultacion/torso.glb
 *   "Torso sculpt w arms" de Sketchfab — licencia CC BY.
 *
 *   Bounding box LOCAL:  X 0..20, Y 0..5, Z 0..10
 *   Transformación del nodo raíz: scale 0.25 + rotación -90° X (Z-up → Y-up)
 *   Bounding box WORLD:  X 0..5, Y 0..2.5, Z 0..-1.25
 *   Centro WORLD:        (2.5, 1.25, -0.6)
 *
 *   En WORLD coords:
 *     - X horizontal: 0 (un extremo) .. 5 (otro extremo)
 *     - Y vertical:   0 (waist) .. 2.5 (hombros)
 *     - Z depth:      0 (BACK/espalda) .. -1.25 (FRONT/pecho)
 *
 * COMO COLOCAR PUNTOS NUEVOS (forma fácil):
 *   1. Abrir https://modelviewer.dev/editor/
 *   2. Arrastrar src/assets/auscultacion/torso.glb
 *   3. Activar "Hotspot Mode" (botón con un puntito en la barra inferior)
 *   4. Click sobre el modelo donde querés el punto
 *   5. Copiar `data-position` y `data-normal` que aparecen a la derecha
 *   6. Pegarlos acá en `position` y `normal`
 *
 * Los `position` están EXPRESADOS EN WORLD COORDS — son las coords que
 * espera <model-viewer> directamente. NO hace falta hacer ninguna conversión.
 */

export interface PuntoAuscultacion {
  id: string;
  nombre: string;
  categoria: 'cardiaco' | 'pulmonar' | 'abdominal' | 'vascular';
  /**
   * Cara del cuerpo donde se ausculta este punto.
   * - 'anterior' = al frente (pecho/abdomen) — auscultación habitual
   * - 'posterior' = detrás (espalda) — campos pulmonares posteriores
   */
  cara: 'anterior' | 'posterior';
  ubicacion: string;
  descripcion: string;
  /** Posición 3D del hotspot en WORLD coords del modelo. Formato "x y z". */
  position: string;
  /** Vector normal del hotspot. Formato "x y z". */
  normal: string;
}

export const PUNTOS_AUSCULTACION: PuntoAuscultacion[] = [
  // ============================================================
  // PUNTOS ANTERIORES (cara del frente / pecho)
  // ============================================================
  // Asumimos que la cara FRONT del modelo está en WORLD z = -1.25.
  // Los hotspots se ponen EN/JUSTO AFUERA de esa cara (z = -1.20).
  // ============================================================
  {
    id: 'foco-aortico',
    nombre: 'Foco aórtico',
    categoria: 'cardiaco',
    cara: 'anterior',
    ubicacion: '2.º espacio intercostal derecho, línea paraesternal.',
    descripcion:
      'Se ausculta el cierre de la válvula aórtica. R2 normalmente más intenso que R1. Soplos sistólicos eyectivos sugieren estenosis aórtica; diastólicos sugieren insuficiencia.',
    position: '2.25 1.88 0.05',
    normal:   '0 0 1',
  },
  {
    id: 'foco-pulmonar',
    nombre: 'Foco pulmonar',
    categoria: 'cardiaco',
    cara: 'anterior',
    ubicacion: '2.º espacio intercostal izquierdo, línea paraesternal.',
    descripcion:
      'Se ausculta el cierre de la válvula pulmonar. Desdoblamiento fisiológico de R2 normal en inspiración. Soplos sistólicos sugieren estenosis pulmonar.',
    position: '2.75 1.88 0.05',
    normal:   '0 0 1',
  },
  {
    id: 'foco-tricuspideo',
    nombre: 'Foco tricuspídeo',
    categoria: 'cardiaco',
    cara: 'anterior',
    ubicacion: '4.º-5.º espacio intercostal izquierdo, borde paraesternal.',
    descripcion:
      'Se ausculta el cierre de la válvula tricúspide. R1 más intenso. Soplos pansistólicos sugieren insuficiencia tricuspídea, que aumenta en inspiración (signo de Rivero-Carvallo).',
    position: '2.63 1.50 0.05',
    normal:   '0 0 1',
  },
  {
    id: 'foco-mitral',
    nombre: 'Foco mitral (apexiano)',
    categoria: 'cardiaco',
    cara: 'anterior',
    ubicacion: '5.º espacio intercostal izquierdo, línea medioclavicular.',
    descripcion:
      'Se ausculta el cierre de la válvula mitral y la calidad del R1. Es el foco de elección para detectar soplos de insuficiencia o estenosis mitral. Decúbito lateral izquierdo lo intensifica.',
    position: '3.00 1.38 0.05',
    normal:   '0 0 1',
  },
  {
    id: 'pulmonar-ant-sup-der',
    nombre: 'Pulmonar anterior superior — derecho',
    categoria: 'pulmonar',
    cara: 'anterior',
    ubicacion: '2.º espacio intercostal derecho, línea medioclavicular.',
    descripcion:
      'Vértice del pulmón derecho. Murmullo vesicular normal. Crepitantes sugieren neumonía o congestión apical (descartar TBC en adultos jóvenes).',
    position: '1.75 2.00 0.05',
    normal:   '0 0 1',
  },
  {
    id: 'pulmonar-ant-sup-izq',
    nombre: 'Pulmonar anterior superior — izquierdo',
    categoria: 'pulmonar',
    cara: 'anterior',
    ubicacion: '2.º espacio intercostal izquierdo, línea medioclavicular.',
    descripcion:
      'Vértice del pulmón izquierdo. Comparar simetría con el derecho. Disminución unilateral sugiere derrame o atelectasia.',
    position: '3.25 2.00 0.05',
    normal:   '0 0 1',
  },
  {
    id: 'pulmonar-ant-inf-der',
    nombre: 'Pulmonar anterior inferior — derecho',
    categoria: 'pulmonar',
    cara: 'anterior',
    ubicacion: '5.º-6.º espacio intercostal derecho, línea medioclavicular.',
    descripcion:
      'Lóbulo medio del pulmón derecho. Crepitantes basales bilaterales sugieren congestión por insuficiencia cardíaca; unilaterales sugieren neumonía.',
    position: '1.65 1.00 0.07',
    normal:   '0 0 1',
  },
  {
    id: 'pulmonar-ant-inf-izq',
    nombre: 'Pulmonar anterior inferior — izquierdo',
    categoria: 'pulmonar',
    cara: 'anterior',
    ubicacion: '5.º-6.º espacio intercostal izquierdo, línea medioclavicular.',
    descripcion:
      'Base del pulmón izquierdo (lóbulo inferior). Sibilancias espiratorias sugieren broncoespasmo (asma/EPOC).',
    position: '3.38 1.00 0.07',
    normal:   '0 0 1',
  },

  // ============================================================
  // PUNTOS POSTERIORES (cara de la espalda)
  // ============================================================
  // La cara BACK del modelo está en WORLD z = 0. Los hotspots se ponen
  // JUSTO AFUERA de esa cara (z = +0.05) — visibles cuando el estudiante
  // rota el modelo para ver la espalda.
  // ============================================================
  {
    id: 'pulmonar-post-sup-der',
    nombre: 'Pulmonar posterior superior — derecho',
    categoria: 'pulmonar',
    cara: 'posterior',
    ubicacion: 'Espacio supraescapular derecho.',
    descripcion:
      'Vértice posterior del pulmón derecho. Comparar simetría con el lado izquierdo. Crepitantes finos al final de la inspiración sugieren fibrosis pulmonar.',
    position: '1.80 2.05 -1.30',
    normal:   '0 0 -1',
  },
  {
    id: 'pulmonar-post-sup-izq',
    nombre: 'Pulmonar posterior superior — izquierdo',
    categoria: 'pulmonar',
    cara: 'posterior',
    ubicacion: 'Espacio supraescapular izquierdo.',
    descripcion:
      'Vértice posterior del pulmón izquierdo. Comparar simetría con el lado derecho.',
    position: '3.20 2.05 -1.30',
    normal:   '0 0 -1',
  },
  {
    id: 'pulmonar-post-med-der',
    nombre: 'Pulmonar posterior medio — derecho',
    categoria: 'pulmonar',
    cara: 'posterior',
    ubicacion: 'Espacio interescapular derecho, a la altura de T4-T5.',
    descripcion:
      'Lóbulo superior derecho posterior. Soplo tubárico (broncofonía aumentada) sugiere consolidación o atelectasia.',
    position: '1.95 1.55 -1.30',
    normal:   '0 0 -1',
  },
  {
    id: 'pulmonar-post-med-izq',
    nombre: 'Pulmonar posterior medio — izquierdo',
    categoria: 'pulmonar',
    cara: 'posterior',
    ubicacion: 'Espacio interescapular izquierdo, a la altura de T4-T5.',
    descripcion:
      'Lóbulo superior izquierdo posterior. La auscultación aquí es clave en derrames pleurales (egofonía).',
    position: '3.05 1.55 -1.30',
    normal:   '0 0 -1',
  },
  {
    id: 'pulmonar-post-inf-der',
    nombre: 'Pulmonar posterior inferior — derecho',
    categoria: 'pulmonar',
    cara: 'posterior',
    ubicacion: 'Base pulmonar derecha posterior, infraescapular.',
    descripcion:
      'Base del pulmón derecho. Excelente sitio para detectar crepitantes congestivos. Excursión diafragmática evaluable por percusión adyacente.',
    position: '1.85 0.85 -1.30',
    normal:   '0 0 -1',
  },
  {
    id: 'pulmonar-post-inf-izq',
    nombre: 'Pulmonar posterior inferior — izquierdo',
    categoria: 'pulmonar',
    cara: 'posterior',
    ubicacion: 'Base pulmonar izquierda posterior, infraescapular.',
    descripcion:
      'Base del pulmón izquierdo. Bilateralmente, crepitantes basales son típicos de insuficiencia cardíaca congestiva.',
    position: '3.15 0.85 -1.30',
    normal:   '0 0 -1',
  },
];
