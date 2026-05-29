import {
  Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, OnInit, ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonChip, IonLabel, IonIcon, IonModal, IonButton,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  heartOutline, fitnessOutline, bodyOutline, refreshOutline,
  closeOutline, locationOutline,
} from 'ionicons/icons';

import {
  PUNTOS_AUSCULTACION, PuntoAuscultacion, construirPuntos,
} from '../../data/puntos-auscultacion.data';

/**
 * Pantalla de auscultación 3D — modo exploración libre.
 *
 * Iteración actual (simplificada por pedido cliente 2026-05-27):
 *   - Solo capa de PIEL (sin huesos/pulmones — el modelo de Sketchfab no
 *     viene con esa separación anatómica).
 *   - Torso con color piel uniforme aplicado a sus materiales en runtime.
 *   - Hotspots clickeables sobre el modelo + lista de puntos abajo como
 *     fallback (si el visor 3D no carga o el alumno prefiere lista).
 *   - Bottom sheet con nombre + ubicación + descripción al tocar un punto.
 *
 * Si en el futuro consiguen un modelo anatómico con capas separadas, el
 * sistema de capas se puede re-agregar (ver historial git de esta página).
 */
@Component({
  selector: 'app-estudiante-auscultacion',
  templateUrl: './estudiante-auscultacion.page.html',
  styleUrls: ['./estudiante-auscultacion.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule, IonContent, IonHeader, IonToolbar, IonTitle, IonButtons,
    IonBackButton, IonChip, IonLabel, IonIcon, IonModal, IonButton,
  ],
})
export class EstudianteAuscultacionPage implements OnInit {
  @ViewChild('mv', { static: false }) modelViewerRef?: ElementRef;

  puntos = PUNTOS_AUSCULTACION;

  filtroActivo: 'todos' | PuntoAuscultacion['categoria'] = 'todos';

  /** Cara mostrada actualmente: 'anterior' (pecho) o 'posterior' (espalda). */
  caraActiva: 'anterior' | 'posterior' = 'anterior';

  modelUrl = 'assets/auscultacion/torso.glb';

  puntoSeleccionado: PuntoAuscultacion | null = null;

  /**
   * Color piel del torso aplicado al material[0] del modelo cuando carga.
   * Formato [r, g, b, a] en linear color space (0..1).
   * Para cambiarlo, pasá valores nuevos. Algunos tonos de referencia:
   *   - Pálido    [0.95, 0.82, 0.74, 1]
   *   - Medio     [0.85, 0.65, 0.55, 1]  ← actual
   *   - Bronceado [0.72, 0.52, 0.42, 1]
   */
  private static readonly SKIN_COLOR: [number, number, number, number] =
    [0.85, 0.65, 0.55, 1.0];

  constructor() {
    addIcons({
      heartOutline, fitnessOutline, bodyOutline, refreshOutline,
      closeOutline, locationOutline,
    });
  }

  async ngOnInit(): Promise<void> {
    await import('@google/model-viewer');
  }

  /**
   * Puntos visibles según el filtro de categoría Y la cara actual.
   * El estudiante solo ve a la vez los puntos de la cara que está mirando
   * (anterior o posterior), así no se cluttea la pantalla.
   */
  get puntosVisibles(): PuntoAuscultacion[] {
    let pts = this.puntos.filter((p) => p.cara === this.caraActiva);
    if (this.filtroActivo !== 'todos') {
      pts = pts.filter((p) => p.categoria === this.filtroActivo);
    }
    return pts;
  }

  cambiarFiltro(filtro: 'todos' | PuntoAuscultacion['categoria']): void {
    this.filtroActivo = filtro;
  }

  abrirPunto(p: PuntoAuscultacion): void {
    this.puntoSeleccionado = p;
  }

  cerrarPunto(): void {
    this.puntoSeleccionado = null;
  }

  /**
   * Cambia entre vista anterior (pecho) y posterior (espalda).
   * Mueve la cámara al lado correspondiente y filtra los hotspots para
   * mostrar solo los puntos de esa cara.
   */
  mostrarCara(cara: 'anterior' | 'posterior'): void {
    this.caraActiva = cara;
    const mv: any = this.modelViewerRef?.nativeElement;
    if (!mv) return;
    if (cara === 'anterior') {
      // PECHO: la cara anterior está en el lado +Z del world (Z ≈ 0). En
      // model-viewer, azimut 0° ubica la cámara en +Z mirando hacia el modelo,
      // así que vemos el pecho de frente.
      mv.cameraOrbit = '0deg 90deg 5m';
    } else {
      // ESPALDA: la cara posterior está en el lado -Z (Z ≈ -1.0) → azimut 180°.
      mv.cameraOrbit = '180deg 90deg 5m';
    }
    mv.cameraTarget = '2.5m 1.25m -0.6m';
    mv.fieldOfView = '35deg';
    if (typeof mv.jumpCameraToGoal === 'function') {
      mv.jumpCameraToGoal();
    }
  }

  /**
   * Vuelve la cámara a la vista inicial de la cara activa.
   * Útil si el alumno rota mucho el modelo y se pierde.
   */
  resetearVista(): void {
    this.mostrarCara(this.caraActiva);
  }

  /**
   * Una vez cargado el modelo: pintamos todos los materiales con color piel.
   *
   * Pasos:
   *   1) LIMPIAR la baseColorTexture si existe. Sin esto, el factor de color
   *      se multiplica contra la textura existente y el resultado puede
   *      seguir viéndose como el color original (blanco/gris).
   *   2) Setear el baseColorFactor con el tono piel.
   *   3) Reducir metalicidad y subir rugosidad para que no se vea como
   *      plástico brillante.
   */
  onModelLoaded(): void {
    const mv: any = this.modelViewerRef?.nativeElement;
    if (!mv || !mv.model) return;

    const skin = EstudianteAuscultacionPage.SKIN_COLOR;
    const materials = mv.model.materials || [];

    // Log útil para debuggear posiciones / materiales al cambiar de modelo.
    // Si cambiás el .glb, abrí la consola del browser para ver estos valores
    // y ajustá las coords de los hotspots en consecuencia.
    try {
      const center = typeof mv.getBoundingBoxCenter === 'function'
        ? mv.getBoundingBoxCenter()
        : null;
      const dims = typeof mv.getDimensions === 'function'
        ? mv.getDimensions()
        : null;
      // eslint-disable-next-line no-console
      console.log('[auscultacion] Modelo cargado.',
        '\n  materiales:', materials.length,
        '\n  hotspots:', this.puntosVisibles.length,
        '\n  bbox center (world):', center,
        '\n  bbox dims (world):', dims);

      // Re-espejar con el centro X REAL del modelo: así el lado izquierdo
      // queda simétrico al derecho aunque el bounding box no esté centrado
      // exactamente en X = 2.5 (el modelo trae brazos y puede descentrarse).
      if (center && typeof center.x === 'number' && isFinite(center.x)) {
        this.puntos = construirPuntos(center.x);
      }
    } catch (_) {
      // eslint-disable-next-line no-console
      console.log('[auscultacion] Modelo cargado (sin info de bbox)');
    }

    // Aplicar la cara inicial (anterior por defecto) para garantizar que
    // la cámara esté en la posición correcta apenas se vea el modelo.
    this.mostrarCara(this.caraActiva);

    for (const mat of materials) {
      try {
        const pbr = mat.pbrMetallicRoughness;
        if (!pbr) continue;

        // 1) limpiar la textura base que pisa el color factor
        const baseTex = pbr.baseColorTexture;
        if (baseTex && typeof baseTex.setTexture === 'function') {
          baseTex.setTexture(null);
        }

        // 2) color piel
        if (typeof pbr.setBaseColorFactor === 'function') {
          pbr.setBaseColorFactor(skin);
        }

        // 3) finalizar como material mate, no brillante
        if (typeof pbr.setMetallicFactor === 'function') {
          pbr.setMetallicFactor(0.0);
        }
        if (typeof pbr.setRoughnessFactor === 'function') {
          pbr.setRoughnessFactor(0.7);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[auscultacion] No se pudo pintar material:', e);
      }
    }
  }

  // ============================================================
  // Helpers de UI
  // ============================================================

  labelCategoria(c: PuntoAuscultacion['categoria']): string {
    switch (c) {
      case 'cardiaco':   return 'Cardíaco';
      case 'pulmonar':   return 'Pulmonar';
      case 'abdominal':  return 'Abdominal';
      case 'vascular':   return 'Vascular';
    }
  }

  colorCategoria(c: PuntoAuscultacion['categoria']): string {
    switch (c) {
      case 'cardiaco':   return 'danger';
      case 'pulmonar':   return 'primary';
      case 'abdominal':  return 'warning';
      case 'vascular':   return 'secondary';
    }
  }

  iconoCategoria(c: PuntoAuscultacion['categoria']): string {
    switch (c) {
      case 'cardiaco':   return 'heart-outline';
      case 'pulmonar':   return 'fitness-outline';
      case 'abdominal':  return 'body-outline';
      case 'vascular':   return 'location-outline';
    }
  }
}
