import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonIcon,
  IonText, IonSpinner, IonProgressBar, IonChip, IonLabel,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  volumeHighOutline, checkmarkCircle, closeCircle, bulbOutline,
  arrowForwardOutline, refreshOutline, ribbonOutline,
} from 'ionicons/icons';

import {
  EvaluacionService, EvaluacionIniciada, PreguntaEval, RespuestaResultado,
} from '../../services/evaluacion.service';
import { MultimediaService } from '../../services/multimedia.service';

@Component({
  selector: 'app-estudiante-evaluacion',
  templateUrl: './estudiante-evaluacion.page.html',
  styleUrls: ['./estudiante-evaluacion.page.scss'],
  standalone: true,
  imports: [
    CommonModule, IonContent, IonHeader, IonToolbar, IonTitle, IonButton,
    IonIcon, IonText, IonSpinner, IonProgressBar, IonChip, IonLabel,
  ],
})
export class EstudianteEvaluacionPage implements OnInit {
  ev: EvaluacionIniciada | null = null;
  idx = 0;

  // Estado de la pregunta actual
  fase: 'responder' | 'feedback' = 'responder';
  intento: 1 | 2 = 1;
  seleccion: number | null = null;
  altBloqueada: number | null = null;      // alternativa fallida en intento 1 (RF-26)
  ultimo: RespuestaResultado | null = null;

  enviando = false;
  finalizando = false;
  error: string | null = null;

  constructor(
    private router: Router,
    private evalSvc: EvaluacionService,
    public media: MultimediaService
  ) {
    addIcons({
      volumeHighOutline, checkmarkCircle, closeCircle, bulbOutline,
      arrowForwardOutline, refreshOutline, ribbonOutline,
    });
  }

  ngOnInit(): void {
    const st = history.state as any;
    if (st && st.evaluacion && Array.isArray(st.evaluacion.preguntas)) {
      this.ev = st.evaluacion as EvaluacionIniciada;
    } else {
      this.error = 'No se encontró la evaluación. Vuelve a iniciarla.';
    }
  }

  get pregunta(): PreguntaEval | null {
    return this.ev ? this.ev.preguntas[this.idx] : null;
  }

  get total(): number {
    return this.ev ? this.ev.preguntas.length : 0;
  }

  get progreso(): number {
    return this.total ? (this.idx) / this.total : 0;
  }

  get esUltima(): boolean {
    return this.idx >= this.total - 1;
  }

  audioUrl(p: PreguntaEval): string {
    return p.audio_grid_id ? this.media.urlAudio(p.audio_grid_id) : '';
  }

  imagenUrl(p: PreguntaEval): string {
    return p.imagen_grid_id ? this.media.urlImagen(p.imagen_grid_id) : '';
  }

  seleccionar(altId: number): void {
    if (this.fase !== 'responder') return;
    if (altId === this.altBloqueada) return; // no re-elegir la fallida (RF-26)
    this.seleccion = altId;
  }

  /** Clase visual de cada alternativa según el estado/feedback. */
  claseAlternativa(altId: number): string {
    if (this.fase === 'feedback' && this.ultimo) {
      if (this.ultimo.correctaAlternativaId === altId) return 'correcta';
      if (this.seleccion === altId && !this.ultimo.correcta) return 'incorrecta';
    }
    if (altId === this.altBloqueada) return 'bloqueada';
    if (this.seleccion === altId) return 'seleccionada';
    return '';
  }

  async confirmar(): Promise<void> {
    if (!this.ev || !this.pregunta || this.seleccion == null) return;
    this.enviando = true;
    this.error = null;
    try {
      const res = await this.evalSvc.responder(
        this.ev.evaluacion_id,
        this.pregunta.pregunta_id,
        this.seleccion,
        this.intento,
        this.pregunta.orden_presentacion
      );
      this.ultimo = res;
      this.fase = 'feedback';
    } catch (e: any) {
      this.error = e?.message || 'No se pudo registrar la respuesta';
    } finally {
      this.enviando = false;
    }
  }

  reintentar(): void {
    // RF-26: no se edita la respuesta anterior; se habilita una nueva selección.
    this.altBloqueada = this.seleccion;
    this.seleccion = null;
    this.intento = 2;
    this.ultimo = null;
    this.fase = 'responder';
  }

  async siguiente(): Promise<void> {
    if (!this.ev) return;
    if (this.esUltima) {
      await this.finalizar();
      return;
    }
    this.idx++;
    this.fase = 'responder';
    this.intento = 1;
    this.seleccion = null;
    this.altBloqueada = null;
    this.ultimo = null;
  }

  private async finalizar(): Promise<void> {
    if (!this.ev) return;
    this.finalizando = true;
    try {
      const resultado = await this.evalSvc.finalizar(this.ev.evaluacion_id);
      this.router.navigateByUrl(`/estudiante/resultado/${this.ev.evaluacion_id}`, {
        state: { resultado, testNombre: this.ev.test_nombre },
        replaceUrl: true,
      });
    } catch (e: any) {
      this.error = e?.message || 'No se pudo finalizar la evaluación';
      this.finalizando = false;
    }
  }

  volverACursos(): void {
    this.router.navigateByUrl('/estudiante/cursos', { replaceUrl: true });
  }
}
