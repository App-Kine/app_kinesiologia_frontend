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
  chevronDownOutline, chevronForwardOutline, createOutline,
  alertCircleOutline, checkmarkOutline, arrowBackOutline,
} from 'ionicons/icons';

import { PreguntaService, AlternativaInput } from '../../services/pregunta.service';

interface AltUI extends AlternativaInput {
  uid: number;
}

@Component({
  selector: 'app-pregunta-editar',
  templateUrl: './pregunta-editar.page.html',
  styleUrls: ['./pregunta-editar.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonHeader, IonToolbar, IonTitle,
    IonButtons, IonBackButton, IonButton, IonIcon, IonItem, IonLabel, IonInput,
    IonTextarea, IonText, IonSpinner, IonNote, IonBadge, IonChip,
    IonRadio, IonRadioGroup,
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
    private route: ActivatedRoute,
    private router: Router
  ) {
    addIcons({
      saveOutline, addOutline, trashOutline, helpCircleOutline,
      musicalNotesOutline, imageOutline, checkmarkCircle,
      chevronDownOutline, chevronForwardOutline, createOutline,
      alertCircleOutline, checkmarkOutline, arrowBackOutline,
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
      this.mostrarAvanzado = !!(p.audio_grid_id || p.imagen_grid_id);
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
  get formularioCompleto(): boolean { return this.pendientes.length === 0; }

  private validarMultimedia(): string | null {
    if (this.audioGridId && !/^[a-f0-9]{24}$/i.test(this.audioGridId.trim()))
      return 'El ID del audio debe ser ObjectId hex de 24 caracteres (o vacío).';
    if (this.imagenGridId && !/^[a-f0-9]{24}$/i.test(this.imagenGridId.trim()))
      return 'El ID de la imagen debe ser ObjectId hex de 24 caracteres (o vacío).';
    return null;
  }

  async guardar(): Promise<void> {
    this.errorMsg = '';
    this.okMsg = '';
    if (this.pendientes.length > 0) {
      this.errorMsg = this.pendientes[0];
      return;
    }
    const errMM = this.validarMultimedia();
    if (errMM) { this.errorMsg = errMM; return; }

    this.guardando = true;
    try {
      await this.preguntaSvc.editar(this.preguntaId, {
        enunciado: this.enunciado.trim(),
        explicacionClinica: this.explicacionClinica.trim(),
        audioGridId: this.audioGridId.trim() || null,
        imagenGridId: this.imagenGridId.trim() || null,
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
