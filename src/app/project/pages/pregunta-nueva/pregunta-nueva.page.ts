import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonButton, IonIcon, IonItem, IonLabel, IonInput, IonTextarea, IonText,
  IonSpinner, IonNote, IonBadge, IonChip, IonRadio, IonRadioGroup,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  saveOutline, addOutline, trashOutline, helpCircleOutline,
  musicalNotesOutline, imageOutline, checkmarkCircle,
  chevronDownOutline, chevronForwardOutline, sparklesOutline,
  alertCircleOutline, checkmarkOutline, cloudUploadOutline, closeCircle,
} from 'ionicons/icons';

import { PreguntaService, AlternativaInput } from '../../services/pregunta.service';
import { MultimediaService } from '../../services/multimedia.service';

interface AltUI extends AlternativaInput {
  uid: number; // identidad estable para track-by
}

@Component({
  selector: 'app-pregunta-nueva',
  templateUrl: './pregunta-nueva.page.html',
  styleUrls: ['./pregunta-nueva.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonHeader, IonToolbar, IonTitle,
    IonButtons, IonBackButton, IonButton, IonIcon, IonItem, IonLabel, IonInput,
    IonTextarea, IonText, IonSpinner, IonNote, IonBadge, IonChip,
    IonRadio, IonRadioGroup,
  ],
})
export class PreguntaNuevaPage implements OnInit {
  // Contexto: si veniste desde /test-detalle/:id, este id está presente.
  // Cuando guardes, se vinculará la pregunta a ese test y volverá ahí.
  testIdContexto: number | null = null;

  // Datos básicos
  enunciado = '';
  explicacionClinica = '';

  // Multimedia opcional (bajo "avanzado")
  mostrarAvanzado = false;
  audioGridId = '';
  imagenGridId = '';
  // Estado de subida de archivos
  subiendoAudio = false;
  subiendoImagen = false;
  audioNombre = '';
  imagenNombre = '';
  mmError = '';

  // Alternativas
  private nextUid = 3;
  alternativas: AltUI[] = [
    { uid: 1, texto: '', esCorrecta: false, orden: 1 },
    { uid: 2, texto: '', esCorrecta: false, orden: 2 },
  ];

  // Estado
  guardando = false;
  errorMsg = '';
  okMsg = '';

  constructor(
    private preguntaSvc: PreguntaService,
    private multimediaSvc: MultimediaService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    addIcons({
      saveOutline, addOutline, trashOutline, helpCircleOutline,
      musicalNotesOutline, imageOutline, checkmarkCircle,
      chevronDownOutline, chevronForwardOutline, sparklesOutline,
      alertCircleOutline, checkmarkOutline, cloudUploadOutline, closeCircle,
    });
  }

  ngOnInit(): void {
    const t = Number(this.route.snapshot.queryParamMap.get('testId'));
    this.testIdContexto = Number.isInteger(t) && t > 0 ? t : null;
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
    // Renumera orden de 1..N
    this.alternativas.forEach((a, i) => (a.orden = i + 1));
  }

  marcarCorrecta(uid: number): void {
    this.alternativas.forEach((a) => (a.esCorrecta = a.uid === uid));
  }

  get puedeQuitar(): boolean {
    return this.alternativas.length > 2;
  }
  get puedeAgregar(): boolean {
    return this.alternativas.length < 5;
  }
  get correctaUid(): number | null {
    const c = this.alternativas.find((a) => a.esCorrecta);
    return c ? c.uid : null;
  }
  get cantCorrectas(): number {
    return this.alternativas.filter((a) => a.esCorrecta).length;
  }

  // Lista en vivo de lo que falta para enviar
  get pendientes(): string[] {
    const out: string[] = [];
    if (!this.enunciado.trim()) out.push('Escribe el enunciado');
    if (!this.explicacionClinica.trim()) out.push('Escribe la explicación clínica');
    if (this.alternativas.some((a) => !a.texto.trim()))
      out.push('Completa el texto de todas las alternativas');
    if (this.cantCorrectas !== 1)
      out.push('Marca exactamente una alternativa como correcta');
    return out;
  }
  get formularioCompleto(): boolean {
    return this.pendientes.length === 0;
  }

  // ----- multimedia (subida directa a la lógica/GridFS) -----

  get audioUrl(): string | null {
    return this.audioGridId ? this.multimediaSvc.urlAudio(this.audioGridId) : null;
  }
  get imagenUrl(): string | null {
    return this.imagenGridId ? this.multimediaSvc.urlImagen(this.imagenGridId) : null;
  }

  async onAudioSeleccionado(ev: Event): Promise<void> {
    const input = ev.target as HTMLInputElement;
    const file = input.files && input.files[0];
    input.value = ''; // permite re-seleccionar el mismo archivo
    if (!file) return;
    this.mmError = '';
    // Si ya había uno, lo borramos primero (no dejar huérfanos)
    if (this.audioGridId) await this.quitarAudio();
    this.subiendoAudio = true;
    try {
      const res = await this.multimediaSvc.subirAudio(file);
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
      const res = await this.multimediaSvc.subirImagen(file);
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

  // ----- guardar -----

  async guardar(): Promise<void> {
    this.errorMsg = '';
    this.okMsg = '';

    if (this.pendientes.length > 0) {
      this.errorMsg = this.pendientes[0];
      return;
    }
    if (this.subiendoAudio || this.subiendoImagen) {
      this.errorMsg = 'Espera a que termine de subir el archivo multimedia.';
      return;
    }

    this.guardando = true;
    try {
      const payload = {
        enunciado: this.enunciado.trim(),
        explicacionClinica: this.explicacionClinica.trim(),
        audioGridId: this.audioGridId.trim() || null,
        imagenGridId: this.imagenGridId.trim() || null,
        alternativas: this.alternativas.map((a) => ({
          texto: a.texto.trim(),
          esCorrecta: a.esCorrecta,
          orden: a.orden,
        })),
      };

      // Si veniste desde /test-detalle, creamos + vinculamos en un solo paso.
      // Si no, caemos al endpoint estándar y volvemos a /mis-tests.
      let resp: { pregunta_id: number };
      let destino: string;
      if (this.testIdContexto) {
        resp = await this.preguntaSvc.agregarATest(this.testIdContexto, payload);
        destino = `/test-detalle/${this.testIdContexto}`;
      } else {
        resp = await this.preguntaSvc.crear(payload);
        destino = '/mis-tests';
      }

      this.okMsg = `Pregunta #${resp.pregunta_id} creada con éxito.`;
      setTimeout(
        () => this.router.navigateByUrl(destino, { replaceUrl: true }),
        1200
      );
    } catch (e: any) {
      this.errorMsg = (e && e.message) || 'No se pudo crear la pregunta.';
    } finally {
      this.guardando = false;
    }
  }
}
