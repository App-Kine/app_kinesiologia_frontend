import {
  AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Reproductor de audio + VISUALIZADOR de barras (estilo ecualizador).
 *
 * Muestra un <audio controls> y, debajo, barras verticales azules con glow,
 * centradas, que reaccionan en tiempo real al sonido (más energía en una banda
 * de frecuencia → barra más alta). Usa la Web Audio API (AnalyserNode), sin
 * librerías externas.
 *
 * El audio puede venir de otro origen (la lógica), por eso usamos
 * crossorigin="anonymous"; el backend ya envía cabeceras CORS. Si el análisis
 * no estuviera disponible (CORS u otro), el audio igual se reproduce (solo se
 * queda la visualización en reposo).
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
      <canvas #canvas class="spectro-canvas"></canvas>
    </div>
  `,
  styles: [`
    .spectro-wrap { display: flex; flex-direction: column; gap: 8px; }
    .spectro-audio { width: 100%; }
    .spectro-canvas {
      width: 100%;
      height: 130px;
      display: block;
      border-radius: 12px;
      /* Transparente: el visualizador muestra el MISMO fondo de la caja que lo
         contiene (.audio-box), en vez de un rectángulo negro. Las barras se
         dibujan con clearRect cada frame, así que el fondo siempre es el del
         contenedor. */
      background: transparent;
    }
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

  // Estilo del visualizador.
  private readonly BARS = 56;          // nº de barras
  private readonly COLOR = '#14a8a8';  // teal de marca (Kinesiología)

  ngAfterViewInit(): void {
    this.ajustarTamano();
    this.dibujarReposo();
  }

  onPlay(): void {
    this.initGrafo();
    this.ajustarTamano();
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
      this.analyser.fftSize = 1024;
      this.analyser.smoothingTimeConstant = 0.75; // suaviza el movimiento
      this.sourceNode.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
      this.data = new Uint8Array(new ArrayBuffer(this.analyser.frequencyBinCount));
      this.grafoListo = true;
    } catch (e) {
      // Si falla (CORS u otro), el audio igual suena; solo no hay visualización.
      // eslint-disable-next-line no-console
      console.warn('[audio-spectro] análisis no disponible', e);
    }
  }

  /** Ajusta la resolución del canvas a su tamaño en pantalla (barras nítidas). */
  private ajustarTamano(): void {
    const canvas = this.canvasRef.nativeElement;
    const w = Math.round(canvas.clientWidth || 320);
    const h = Math.round(canvas.clientHeight || 130);
    if (w > 0 && canvas.width !== w) canvas.width = w;
    if (h > 0 && canvas.height !== h) canvas.height = h;
  }

  private dibujar = (): void => {
    if (!this.activo || !this.analyser || !this.data) return;
    this.raf = requestAnimationFrame(this.dibujar);
    this.ajustarTamano();
    this.analyser.getByteFrequencyData(this.data);
    this.pintarBarras(this.data);
  };

  /** Dibuja las barras centradas a partir de los datos de frecuencia. */
  private pintarBarras(data: Uint8Array): void {
    const canvas = this.canvasRef.nativeElement;
    const c = canvas.getContext('2d');
    if (!c) return;

    const w = canvas.width;
    const h = canvas.height;
    const mid = h / 2;

    // Fondo negro (clearRect deja transparente → se ve el background #000 del CSS).
    c.clearRect(0, 0, w, h);

    const slot = w / this.BARS;
    const barW = Math.max(2, slot * 0.5);   // grosor de cada barra (con separación)
    const minHalf = barW / 2;               // mínimo: que se vea un "punto" redondo
    // Usamos la parte baja-media del espectro (lo audible útil del sonido).
    const usable = Math.max(1, Math.floor(data.length * 0.65));

    c.lineCap = 'round';
    c.lineWidth = barW;
    c.strokeStyle = this.COLOR;
    c.shadowColor = this.COLOR;
    c.shadowBlur = 2;                        // glow muy sutil (antes 9 = muy brilloso)

    for (let b = 0; b < this.BARS; b++) {
      const start = Math.floor((b / this.BARS) * usable);
      const end = Math.floor(((b + 1) / this.BARS) * usable);
      let max = 0;
      for (let i = start; i <= end && i < data.length; i++) {
        if (data[i] > max) max = data[i];
      }
      const v = max / 255;                  // 0..1
      const half = Math.max(minHalf, v * (mid - 4));
      const x = b * slot + slot / 2;
      c.beginPath();
      c.moveTo(x, mid - half);
      c.lineTo(x, mid + half);
      c.stroke();
    }
  }

  /** Estado en reposo (sin reproducir): una fila de puntos/barras mínimas. */
  private dibujarReposo(): void {
    this.pintarBarras(new Uint8Array(this.BARS * 8)); // todo en 0 → barras mínimas
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.raf);
    try { this.sourceNode?.disconnect(); } catch (_) {}
    try { this.analyser?.disconnect(); } catch (_) {}
    try { this.ctx?.close(); } catch (_) {}
  }
}
