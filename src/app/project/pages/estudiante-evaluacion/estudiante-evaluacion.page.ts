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
  arrowForwardOutline, refreshOutline, ribbonOutline, videocamOutline,
  timeOutline,
} from 'ionicons/icons';

import {
  EvaluacionService, EvaluacionIniciada, PreguntaEval, RespuestaResultado,
  RespuestaParaEnviar,
} from '../../services/evaluacion.service';
import { MultimediaService } from '../../services/multimedia.service';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';

/**
 * Estado bufferado por pregunta (NO se persiste hasta finalizar).
 * Si el estudiante abandona la página antes de enviar, este buffer se pierde
 * y la BD queda intacta — política "como si no pasara nada"
 * (auditoría 2026-05-28).
 */
interface BufferRespuesta {
  preguntaId: number;
  ordenPresentacion: number;
  alternativaIntento1Id: number;
  alternativaIntento2Id: number | null;
  tiempoSegundos: number;
}

@Component({
  selector: 'app-estudiante-evaluacion',
  templateUrl: './estudiante-evaluacion.page.html',
  styleUrls: ['./estudiante-evaluacion.page.scss'],
  standalone: true,
  imports: [
    CommonModule, IonContent, IonHeader, IonToolbar, IonTitle, IonButton,
    IonIcon, IonText, IonSpinner, IonProgressBar, IonChip, IonLabel,
    SafeHtmlPipe,
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

  /**
   * Buffer en MEMORIA de las respuestas del estudiante.
   * Se llena a medida que avanza por las preguntas y se envía como UN solo
   * payload al finalizar el test. Si abandona la página, este array se pierde
   * y nada se guarda en BD.
   */
  private bufferRespuestas: BufferRespuesta[] = [];

  // Selección del intento 1 (para componer el buffer cuando hay intento 2)
  private altIntento1: number | null = null;

  // Timer por pregunta (pedido cliente 2026-05-26).
  // Total dedicado, NO se reinicia al pasar de intento 1 a 2.
  private inicioPreguntaMs: number = Date.now();

  constructor(
    private router: Router,
    private evalSvc: EvaluacionService,
    public media: MultimediaService
  ) {
    addIcons({
      volumeHighOutline, checkmarkCircle, closeCircle, bulbOutline,
      arrowForwardOutline, refreshOutline, ribbonOutline, videocamOutline,
      timeOutline,
    });
  }

  ngOnInit(): void {
    const st = history.state as any;
    if (st && st.evaluacion && Array.isArray(st.evaluacion.preguntas)) {
      this.ev = st.evaluacion as EvaluacionIniciada;
      this.inicioPreguntaMs = Date.now();
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

  videoUrl(p: PreguntaEval): string {
    return p.video_grid_id ? this.media.urlVideo(p.video_grid_id) : '';
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

  /**
   * Confirma la respuesta del intento actual.
   *
   * Llama a /corregir que devuelve si fue correcta + (si finaliza la pregunta)
   * la alternativa correcta y la explicación. NO PERSISTE NADA en backend.
   *
   * Si la pregunta queda finalizada (acierto en 1° o intento 2 ya gastado),
   * registramos la respuesta en el buffer local. Al final del test, el
   * buffer completo se envía a /enviar para persistencia atómica.
   */
  async confirmar(): Promise<void> {
    if (!this.ev || !this.pregunta || this.seleccion == null) return;
    this.enviando = true;
    this.error = null;

    const tiempoSeg = Math.max(0, Math.round((Date.now() - this.inicioPreguntaMs) / 1000));
    const altElegida = this.seleccion;

    try {
      const res = await this.evalSvc.corregir(
        this.ev.aplicacion_id,
        this.pregunta.pregunta_id,
        altElegida,
        this.intento
      );

      this.ultimo = res;
      this.fase = 'feedback';

      // Si la pregunta queda finalizada → bufferear para el envío final
      if (res.finalizadaPregunta) {
        this.bufferRespuestas.push({
          preguntaId: this.pregunta.pregunta_id,
          ordenPresentacion: this.pregunta.orden_presentacion,
          alternativaIntento1Id: this.intento === 1 ? altElegida : (this.altIntento1 as number),
          alternativaIntento2Id: this.intento === 2 ? altElegida : null,
          tiempoSegundos: tiempoSeg,
        });
      } else if (this.intento === 1) {
        // Recordamos la elección del intento 1 para componer la respuesta cuando
        // venga el intento 2.
        this.altIntento1 = altElegida;
      }
    } catch (e: any) {
      this.error = e?.message || 'No se pudo verificar la respuesta';
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
    this.altIntento1 = null;
    this.ultimo = null;
    // Reset del timer al pasar a la próxima pregunta.
    this.inicioPreguntaMs = Date.now();
  }

  /**
   * Finaliza el test enviando TODO el buffer al backend en una única
   * transacción. Antes de esta llamada NADA se ha persistido. Si esto falla,
   * NADA queda en BD (rollback completo).
   */
  private async finalizar(): Promise<void> {
    if (!this.ev) return;
    this.finalizando = true;
    try {
      const respuestas: RespuestaParaEnviar[] = this.bufferRespuestas.map((b) => ({
        preguntaId: b.preguntaId,
        ordenPresentacion: b.ordenPresentacion,
        alternativaIntento1Id: b.alternativaIntento1Id,
        alternativaIntento2Id: b.alternativaIntento2Id,
        tiempoSegundos: b.tiempoSegundos,
      }));

      const resultado = await this.evalSvc.enviar(
        this.ev.aplicacion_id,
        this.ev.modalidad,
        respuestas,
        this.ev.correo
      );

      this.router.navigateByUrl(`/estudiante/resultado/${resultado.evaluacion_id}`, {
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
