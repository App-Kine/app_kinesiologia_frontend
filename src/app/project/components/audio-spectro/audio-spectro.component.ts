import {
  AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Reproductor de audio + ESPECTROGRAMA en vivo.
 *
 * Muestra un <audio controls> y, debajo, un espectrograma que se dibuja en
 * tiempo real mientras el audio suena (frecuencia en el eje vertical: graves
 * abajo, agudos arriba; el tiempo avanza hacia la derecha). Usa la Web Audio
 * API (AnalyserNode) — sin librerías externas.
 *
 * El audio puede venir de otro origen (la lógica), por eso usamos
 * crossorigin="anonymous"; el backend ya envía cabeceras CORS. Si el análisis
 * no estuviera disponible, el audio igual se reproduce (solo no se ve el
 * espectrograma).
 *
 * Uso:  <app-audio-spectro [src]="urlDelAudio"></app-audio-spectro>
 */
@Component({
  selector: 'app-audio-spectro',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="spectro-wrap">
      <audio
        #audio
        class="spectro-audio"
        [src]="src"
        crossorigin="anonymous"
        controls
        preload="none"
        (play)="onPlay()"
        (pause)="onPause()"
        (ended)="onPause()"
      ></audio>
      <canvas #canvas class="spectro-canvas" width="320" height="120"></canvas>
      <p class="spectro-hint">
        Espectrograma — frecuencia (vertical) a lo largo del tiempo
      </p>
    </div>
  `,
  styles: [`
    .spectro-wrap { display: flex; flex-direction: column; gap: 8px; }
    .spectro-audio { width: 100%; }
    .spectro-canvas {
      width: 100%;
      height: 120px;
      display: block;
      border-radius: 10px;
      background: #0b1020;
    }
    .spectro-hint { margin: 0; font-size: 11px; opacity: .6; text-align: center; }
  `],
})
export class AudioSpectroComponent implements AfterViewInit, OnDestroy {
  @Input() src = '';

  @ViewChild('audio', { static: true }) audioRef!: ElementRef<HTMLAudioElement>;
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx?: AudioContext;
  private analyser?: AnalyserNode;
  private sourceNode?: MediaElementAudioSourceNode;
  private data?: Uint8Array<ArrayBuffer>;
  private raf = 0;
  private activo = false;
  private grafoListo = false;

  ngAfterViewInit(): void {
    this.limpiarCanvas();
  }

  onPlay(): void {
    this.initGrafo();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.activo = true;
    this.dibujar();
  }

  onPause(): void {
    this.activo = false;
    cancelAnimationFrame(this.raf);
  }

  /** Crea el grafo de audio una sola vez (createMediaElementSource es único). */
  private initGrafo(): void {
    if (this.grafoListo) return;
    try {
      const Ctx: typeof AudioContext =
        (window as any).AudioContext || (window as any).webkitAudioContext;
      this.ctx = new Ctx();
      this.sourceNode = this.ctx.createMediaElementSource(this.audioRef.nativeElement);
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.6;
      this.sourceNode.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
      this.data = new Uint8Array(new ArrayBuffer(this.analyser.frequencyBinCount));
      this.grafoListo = true;
    } catch (e) {
      // Si falla (CORS u otro), el audio igual suena; solo no hay espectrograma.
      // eslint-disable-next-line no-console
      console.warn('[audio-spectro] análisis no disponible', e);
    }
  }

  private dibujar = (): void => {
    if (!this.activo || !this.analyser || !this.data) return;
    this.raf = requestAnimationFrame(this.dibujar);

    const canvas = this.canvasRef.nativeElement;
    const c = canvas.getContext('2d');
    if (!c) return;

    this.analyser.getByteFrequencyData(this.data);
    const w = canvas.width;
    const h = canvas.height;

    // Desplazar el contenido 1px a la izquierda (efecto scroll del tiempo).
    const img = c.getImageData(1, 0, w - 1, h);
    c.putImageData(img, 0, 0);

    // Dibujar la columna nueva en el borde derecho.
    const bins = this.data.length;
    for (let y = 0; y < h; y++) {
      const i = Math.floor((1 - y / h) * (bins - 1)); // graves abajo, agudos arriba
      c.fillStyle = this.color(this.data[i]);
      c.fillRect(w - 1, y, 1, 1);
    }
  };

  /** Heatmap simple: 0 oscuro → alto brillante (azul → cyan → amarillo → rojo). */
  private color(v: number): string {
    const t = v / 255;
    const r = Math.round(255 * Math.min(1, Math.max(0, t * 1.6 - 0.35)));
    const g = Math.round(255 * Math.min(1, Math.max(0, t * 1.8 - 0.15)));
    const b = Math.round(255 * Math.min(1, Math.max(0, 1.2 - t * 1.6)));
    return `rgb(${r},${g},${b})`;
  }

  private limpiarCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    const c = canvas.getContext('2d');
    if (c) {
      c.fillStyle = '#0b1020';
      c.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.raf);
    try { this.sourceNode?.disconnect(); } catch (_) {}
    try { this.analyser?.disconnect(); } catch (_) {}
    try { this.ctx?.close(); } catch (_) {}
  }
}
