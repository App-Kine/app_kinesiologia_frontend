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
  alertCircleOutline, checkmarkOutline,
} from 'ionicons/icons';

import { PreguntaService, AlternativaInput } from '../../services/pregunta.service';

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
    private router: Router,
    private route: ActivatedRoute
  ) {
    addIcons({
      saveOutline, addOutline, trashOutline, helpCircleOutline,
      musicalNotesOutline, imageOutline, checkmarkCircle,
      chevronDownOutline, chevronForwardOutline, sparklesOutline,
      alertCircleOutline, checkmarkOutline,
    });
  }

  ngOnInit(): void {
    const t = Number(this.route.snapshot.queryParamMap.get('testId'));
    this.testIdContexto = Number.isInteger(t) && t > 0 ? t : null;
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

  // ----- guardar -----

  private validarMultimedia(): string | null {
    if (this.audioGridId && !/^[a-f0-9]{24}$/i.test(this.audioGridId.trim()))
      return 'El ID del audio debe ser ObjectId hex de 24 caracteres (o déjalo vacío).';
    if (this.imagenGridId && !/^[a-f0-9]{24}$/i.test(this.imagenGridId.trim()))
      return 'El ID de la imagen debe ser ObjectId hex de 24 caracteres (o déjalo vacío).';
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
    if (errMM) {
      this.errorMsg = errMM;
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
