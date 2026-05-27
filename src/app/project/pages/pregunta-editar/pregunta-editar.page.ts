import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonButton, IonIcon, IonItem, IonLabel, IonInput, IonTextarea, IonText,
  IonSpinner, IonNote, IonBadge, IonChip, IonRadio, IonRadioGroup,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  saveOutline, addOutline, trashOutline, helpCircleOutline,
  musicalNotesOutline, imageOutline, checkmarkCircle,
  chevronDownOutline, chevronForwardOutline, createOutline,
  alertCircleOutline, checkmarkOutline, arrowBackOutline,
  cloudUploadOutline, closeCircle, videocamOutline,
} from 'ionicons/icons';

import { PreguntaService, AlternativaInput } from '../../services/pregunta.service';
import { MultimediaService } from '../../services/multimedia.service';
import { RichTextEditorComponent } from '../../components/rich-text-editor/rich-text-editor.component';

interface AltUI extends AlternativaInput {
  uid: number;
}

@Component({
  selector: 'app-pregunta-editar',
  templateUrl: './pregunta-editar.page.html',
  styleUrls: ['./pregunta-editar.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink, IonContent, IonHeader, IonToolbar, IonTitle,
    IonButtons, IonBackButton, IonButton, IonIcon, IonItem, IonLabel, IonInput,
    IonTextarea, IonText, IonSpinner, IonNote, IonBadge, IonChip,
    IonRadio, IonRadioGroup, RichTextEditorComponent,
  ],
})
export class PreguntaEditarPage implements OnInit {
  preguntaId: number = 0;
  /** Si veniste desde /test-detalle/:id, al guardar/back vuelves ahí. */
  testIdContexto: number | null = null;

  // Datos del form
  enunciado = '';
  explicacionClinica = '';
  mostrarAvanzado = false;
  audioGridId = '';
  imagenGridId = '';
  videoGridId = '';
  // Estado de subida
  subiendoAudio = false;
  subiendoImagen = false;
  subiendoVideo = false;
  audioNombre = '';
  imagenNombre = '';
  videoNombre = '';
  mmError = '';

  private nextUid = 1;
  alternativas: AltUI[] = [];

  // Estado
  cargandoInicial = true;
  guardando = false;
  errorMsg = '';
  okMsg = '';
  errorCarga = '';

  constructor(
    private preguntaSvc: PreguntaService,
    private multimediaSvc: MultimediaService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    addIcons({
      saveOutline, addOutline, trashOutline, helpCircleOutline,
      musicalNotesOutline, imageOutline, checkmarkCircle,
      chevronDownOutline, chevronForwardOutline, createOutline,
      alertCircleOutline, checkmarkOutline, arrowBackOutline,
      cloudUploadOutline, closeCircle, videocamOutline,
    });
  }

  async ngOnInit(): Promise<void> {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.preguntaId = Number(idParam);
    if (!Number.isInteger(this.preguntaId) || this.preguntaId <= 0) {
      this.errorCarga = 'ID de pregunta inválido.';
      this.cargandoInicial = false;
      return;
    }
    const t = Number(this.route.snapshot.queryParamMap.get('testId'));
    this.testIdContexto = Number.isInteger(t) && t > 0 ? t : null;
    try {
      const p = await this.preguntaSvc.obtener(this.preguntaId);
      this.enunciado = p.enunciado;
      this.explicacionClinica = p.explicacion_clinica;
      this.audioGridId = p.audio_grid_id || '';
      this.imagenGridId = p.imagen_grid_id || '';
      this.videoGridId = (p as any).video_grid_id || '';
      this.mostrarAvanzado = !!(p.audio_grid_id || p.imagen_grid_id || (p as any).video_grid_id);
      // Pasar alternativas a UI
      this.alternativas = p.alternativas.map((a) => ({
        uid: this.nextUid++,
        texto: a.texto,
        esCorrecta: a.es_correcta,
        orden: a.orden,
      }));
    } catch (err: any) {
      this.errorCarga = (err && err.message) || 'No se pudo cargar la pregunta.';
    } finally {
      this.cargandoInicial = false;
    }
  }

  /** A dónde vuelve el botón atrás: al test de origen o al banco de tests. */
  get volverHref(): string {
    return this.testIdContexto ? `/test-detalle/${this.testIdContexto}` : '/mis-tests';
  }

  // ----- alternativas -----
  agregarAlternativa(): void {
    if (this.alternativas.length >= 5) return;
    const nuevoOrden = this.alternativas.length + 1;
    this.alternativas.push({
      uid: this.nextUid++,
      texto: '',
      esCorrecta: false,
      orden: nuevoOrden,
    });
  }

  quitarAlternativa(idx: number): void {
    if (this.alternativas.length <= 2) return;
    this.alternativas.splice(idx, 1);
    this.alternativas.forEach((a, i) => (a.orden = i + 1));
  }

  marcarCorrecta(uid: number): void {
    this.alternativas.forEach((a) => (a.esCorrecta = a.uid === uid));
  }

  get puedeQuitar(): boolean { return this.alternativas.length > 2; }
  get puedeAgregar(): boolean { return this.alternativas.length < 5; }
  get correctaUid(): number | null {
    const c = this.alternativas.find((a) => a.esCorrecta);
    return c ? c.uid : null;
  }
  get cantCorrectas(): number {
    return this.alternativas.filter((a) => a.esCorrecta).length;
  }

  private _texto(html: string): string {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  }
  get pendientes(): string[] {
    const out: string[] = [];
    if (!this._texto(this.enunciado)) out.push('Escribe el enunciado');
    if (!this._texto(this.explicacionClinica)) out.push('Escribe la explicación clínica');
    if (this.alternativas.some((a) => !a.texto.trim()))
      out.push('Completa el texto de todas las alternativas');
    if (this.cantCorrectas !== 1)
      out.push('Marca exactamente una alternativa como correcta');
    return out;
  }
  get formularioCompleto(): boolean { return this.pendientes.length === 0; }

  // ----- multimedia (subida directa a la lógica/GridFS) -----

  get audioUrl(): string | null {
    return this.audioGridId ? this.multimediaSvc.urlAudio(this.audioGridId) : null;
  }
  get imagenUrl(): string | null {
    return this.imagenGridId ? this.multimediaSvc.urlImagen(this.imagenGridId) : null;
  }
  get videoUrl(): string | null {
    return this.videoGridId ? this.multimediaSvc.urlVideo(this.videoGridId) : null;
  }

  async onAudioSeleccionado(ev: Event): Promise<void> {
    const input = ev.target as HTMLInputElement;
    const file = input.files && input.files[0];
    input.value = '';
    if (!file) return;
    this.mmError = '';
    if (this.audioGridId) await this.quitarAudio();
    this.subiendoAudio = true;
    try {
      const res = await this.multimediaSvc.subirAudio(file, this.preguntaId);
      this.audioGridId = res.grid_id;
      this.audioNombre = file.name;
    } catch (e: any) {
      this.mmError = (e && e.message) || 'No se pudo subir el audio.';
    } finally {
      this.subiendoAudio = false;
    }
  }

  async onImagenSeleccionada(ev: Event): Promise<void> {
    const input = ev.target as HTMLInputElement;
    const file = input.files && input.files[0];
    input.value = '';
    if (!file) return;
    this.mmError = '';
    if (this.imagenGridId) await this.quitarImagen();
    this.subiendoImagen = true;
    try {
      const res = await this.multimediaSvc.subirImagen(file, this.preguntaId);
      this.imagenGridId = res.grid_id;
      this.imagenNombre = file.name;
    } catch (e: any) {
      this.mmError = (e && e.message) || 'No se pudo subir la imagen.';
    } finally {
      this.subiendoImagen = false;
    }
  }

  async quitarAudio(): Promise<void> {
    const id = this.audioGridId;
    this.audioGridId = '';
    this.audioNombre = '';
    if (id) {
      try { await this.multimediaSvc.eliminar(id, 'audio'); } catch { /* idempotente */ }
    }
  }

  async quitarImagen(): Promise<void> {
    const id = this.imagenGridId;
    this.imagenGridId = '';
    this.imagenNombre = '';
    if (id) {
      try { await this.multimediaSvc.eliminar(id, 'imagen'); } catch { /* idempotente */ }
    }
  }

  async onVideoSeleccionado(ev: Event): Promise<void> {
    const input = ev.target as HTMLInputElement;
    const file = input.files && input.files[0];
    input.value = '';
    if (!file) return;
    this.mmError = '';
    if (this.videoGridId) await this.quitarVideo();
    this.subiendoVideo = true;
    try {
      const res = await this.multimediaSvc.subirVideo(file, this.preguntaId);
      this.videoGridId = res.grid_id;
      this.videoNombre = file.name;
    } catch (e: any) {
      this.mmError = (e && e.message) || 'No se pudo subir el video.';
    } finally {
      this.subiendoVideo = false;
    }
  }

  async quitarVideo(): Promise<void> {
    const id = this.videoGridId;
    this.videoGridId = '';
    this.videoNombre = '';
    if (id) {
      try { await this.multimediaSvc.eliminar(id, 'video'); } catch { /* idempotente */ }
    }
  }

  async guardar(): Promise<void> {
    this.errorMsg = '';
    this.okMsg = '';
    if (this.pendientes.length > 0) {
      this.errorMsg = this.pendientes[0];
      return;
    }
    if (this.subiendoAudio || this.subiendoImagen || this.subiendoVideo) {
      this.errorMsg = 'Espera a que termine de subir el archivo multimedia.';
      return;
    }

    this.guardando = true;
    try {
      await this.preguntaSvc.editar(this.preguntaId, {
        enunciado: this.enunciado.trim(),
        explicacionClinica: this.explicacionClinica.trim(),
        audioGridId: this.audioGridId.trim() || null,
        imagenGridId: this.imagenGridId.trim() || null,
        videoGridId: this.videoGridId.trim() || null,
        alternativas: this.alternativas.map((a) => ({
          texto: a.texto.trim(),
          esCorrecta: a.esCorrecta,
          orden: a.orden,
        })),
      });
      this.okMsg = `Pregunta #${this.preguntaId} actualizada.`;
      const destino = this.testIdContexto
        ? `/test-detalle/${this.testIdContexto}`
        : '/mis-tests';
      setTimeout(() =>
        this.router.navigateByUrl(destino, { replaceUrl: true }),
        1200
      );
    } catch (e: any) {
      this.errorMsg = (e && e.message) || 'No se pudo guardar la pregunta.';
    } finally {
      this.guardando = false;
    }
  }
}
