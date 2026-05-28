import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonButton, IonIcon, IonItem, IonLabel, IonInput, IonText, IonSpinner,
  IonRadioGroup, IonRadio, IonNote,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { lockClosedOutline, personOutline, playOutline } from 'ionicons/icons';

import { EvaluacionService } from '../../services/evaluacion.service';

@Component({
  selector: 'app-estudiante-inicio',
  templateUrl: './estudiante-inicio.page.html',
  styleUrls: ['./estudiante-inicio.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonHeader, IonToolbar, IonTitle,
    IonButtons, IonBackButton, IonButton, IonIcon, IonItem, IonLabel, IonInput,
    IonText, IonSpinner, IonRadioGroup, IonRadio, IonNote,
  ],
})
export class EstudianteInicioPage implements OnInit {
  aplicacionId: number | null = null;

  // 'ANONIMA' | 'IDENTIFICADA' (RF-07/RF-10/RF-11)
  modalidad: 'ANONIMA' | 'IDENTIFICADA' = 'ANONIMA';
  correo = '';

  iniciando = false;
  error: string | null = null;

  private RE_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private evalSvc: EvaluacionService
  ) {
    addIcons({ lockClosedOutline, personOutline, playOutline });
  }

  ngOnInit(): void {
    this.aplicacionId = Number(this.route.snapshot.paramMap.get('aplicacionId'));
  }

  async comenzar(): Promise<void> {
    this.error = null;
    if (!this.aplicacionId) { this.error = 'Evaluación inválida'; return; }

    let correoEnviar: string | undefined = undefined;
    if (this.modalidad === 'IDENTIFICADA') {
      const c = this.correo.trim();
      if (!c) { this.error = 'Ingresa tu correo o elige continuar anónimo.'; return; }
      if (!this.RE_CORREO.test(c)) { this.error = 'El formato del correo no es válido (RF-09).'; return; }
      correoEnviar = c;
    }

    this.iniciando = true;
    try {
      const ev = await this.evalSvc.iniciar(this.aplicacionId, this.modalidad, correoEnviar);
      // Auditoría 2026-05-28: `iniciar` ya NO crea evaluacion en BD.
      // Navegamos con el aplicacion_id en la URL. Las preguntas viajan por
      // router state. El persistir queda para cuando el estudiante envíe el
      // test completo desde la página de evaluación.
      this.router.navigateByUrl(`/estudiante/evaluacion/${ev.aplicacion_id}`, {
        state: { evaluacion: ev },
      });
    } catch (e: any) {
      this.error = e?.message || 'No se pudo iniciar la evaluación';
    } finally {
      this.iniciando = false;
    }
  }
}
