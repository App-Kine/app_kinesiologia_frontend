import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonList,
  IonRadioGroup,
  IonRadio,
  IonText,
  IonSpinner,
  IonNote,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  trashOutline,
  saveOutline,
  arrowBackOutline,
} from 'ionicons/icons';

import { PreguntaService, AlternativaInput } from '../../services/pregunta.service';
import { createLogger } from '../../services/logger';

interface AltUI extends AlternativaInput {}

const log = createLogger('crear-pregunta');

@Component({
  selector: 'app-crear-pregunta',
  templateUrl: './crear-pregunta.page.html',
  styleUrls: ['./crear-pregunta.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonList,
    IonRadioGroup,
    IonRadio,
    IonText,
    IonSpinner,
    IonNote,
  ],
})
export class CrearPreguntaPage {
  enunciado = '';
  explicacionClinica = '';
  audioGridId = '';
  imagenGridId = '';

  // Banco de preguntas: NO se asocia a curso al crear.
  // La asociación se hace al crear un test y aplicarlo a un curso.

  ordenCorrecto: number | null = null;

  alternativas: AltUI[] = [
    { texto: '', esCorrecta: false, orden: 1 },
    { texto: '', esCorrecta: false, orden: 2 },
  ];

  guardando = false;

  constructor(
    private preguntaService: PreguntaService,
    private router: Router,
    private toastCtrl: ToastController
  ) {
    addIcons({ addOutline, trashOutline, saveOutline, arrowBackOutline });
  }

  agregarAlternativa(): void {
    if (this.alternativas.length >= 5) return;
    this.alternativas.push({
      texto: '',
      esCorrecta: false,
      orden: this.alternativas.length + 1,
    });
  }

  quitarAlternativa(idx: number): void {
    if (this.alternativas.length <= 2) return;
    const eliminada = this.alternativas[idx];
    this.alternativas.splice(idx, 1);
    this.alternativas.forEach((a, i) => (a.orden = i + 1));
    if (this.ordenCorrecto === eliminada.orden) {
      this.ordenCorrecto = null;
    } else if (
      this.ordenCorrecto !== null &&
      this.ordenCorrecto > eliminada.orden
    ) {
      this.ordenCorrecto -= 1;
    }
  }

  private validar(): string | null {
    if (!this.enunciado.trim()) return 'Enunciado requerido';
    if (!this.explicacionClinica.trim())
      return 'Explicación clínica requerida (RF-63)';
    if (this.alternativas.length < 2 || this.alternativas.length > 5)
      return 'Una pregunta debe tener entre 2 y 5 alternativas (RF-65)';
    for (const a of this.alternativas) {
      if (!a.texto.trim()) return `Falta texto en alternativa #${a.orden}`;
    }
    if (this.ordenCorrecto === null)
      return 'Marca una alternativa como correcta (RF-66)';
    const gridRe = /^[a-fA-F0-9]{24}$/;
    if (this.audioGridId && !gridRe.test(this.audioGridId.trim()))
      return 'audioGridId inválido (debe ser ObjectId hex de 24)';
    if (this.imagenGridId && !gridRe.test(this.imagenGridId.trim()))
      return 'imagenGridId inválido (debe ser ObjectId hex de 24)';
    return null;
  }

  async guardar(): Promise<void> {
    const err = this.validar();
    if (err) {
      log.warn('guardar: validación falló', err);
      await this.mostrarToast(err, 'warning');
      return;
    }

    this.alternativas.forEach((a) => {
      a.esCorrecta = a.orden === this.ordenCorrecto;
    });

    this.guardando = true;
    try {
      const resp = await this.preguntaService.crear({
        enunciado: this.enunciado.trim(),
        explicacionClinica: this.explicacionClinica.trim(),
        audioGridId: this.audioGridId.trim() || null,
        imagenGridId: this.imagenGridId.trim() || null,
        cursoOrigenId: null, // banco de preguntas: sin curso
        alternativas: this.alternativas.map((a) => ({
          texto: a.texto.trim(),
          esCorrecta: a.esCorrecta,
          orden: a.orden,
        })),
      });
      await this.mostrarToast(
        `Pregunta #${resp.pregunta_id} creada`,
        'success'
      );
      this.router.navigateByUrl('/preguntas');
    } catch (e: any) {
      log.error('guardar', e);
      await this.mostrarToast(
        e?.message || 'Error al crear la pregunta',
        'danger'
      );
    } finally {
      this.guardando = false;
    }
  }

  private async mostrarToast(
    message: string,
    color: 'success' | 'danger' | 'warning'
  ): Promise<void> {
    const t = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
    });
    await t.present();
  }
}
