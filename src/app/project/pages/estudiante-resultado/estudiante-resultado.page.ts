import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonIcon, IonText, IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  ribbonOutline, checkmarkCircle, refreshCircle, closeCircle, homeOutline,
  mailOutline, checkmarkDoneOutline,
} from 'ionicons/icons';

import { ResultadoFinal, EvaluacionService } from '../../services/evaluacion.service';

@Component({
  selector: 'app-estudiante-resultado',
  templateUrl: './estudiante-resultado.page.html',
  styleUrls: ['./estudiante-resultado.page.scss'],
  standalone: true,
  imports: [
    CommonModule, IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonIcon, IonText, IonSpinner,
  ],
})
export class EstudianteResultadoPage implements OnInit {
  resultado: ResultadoFinal | null = null;
  testNombre = '';

  // Estado del envío de informe por correo (RF-41/42)
  enviandoInforme = false;
  informeEnviado = false;
  correoEnviado = '';
  errorInforme = '';

  constructor(private router: Router, private evalSvc: EvaluacionService) {
    addIcons({
      ribbonOutline, checkmarkCircle, refreshCircle, closeCircle, homeOutline,
      mailOutline, checkmarkDoneOutline,
    });
  }

  ngOnInit(): void {
    const st = history.state as any;
    if (st && st.resultado) {
      this.resultado = st.resultado as ResultadoFinal;
      this.testNombre = st.testNombre || '';
    }
  }

  get correctas(): number {
    if (!this.resultado) return 0;
    return this.resultado.aciertos_primer + this.resultado.aciertos_segundo;
  }

  get colorPct(): string {
    const p = this.resultado ? this.resultado.porcentaje_global : 0;
    if (p >= 70) return 'success';
    if (p >= 50) return 'warning';
    return 'danger';
  }

  /** RF-41/42: envía el informe al correo registrado (modalidad IDENTIFICADA). */
  async enviarInforme(): Promise<void> {
    if (!this.resultado || this.enviandoInforme) return;
    this.errorInforme = '';
    this.enviandoInforme = true;
    try {
      const r = await this.evalSvc.enviarInforme(this.resultado.evaluacion_id);
      this.informeEnviado = true;
      this.correoEnviado = r && r.correo ? r.correo : '';
    } catch (err: any) {
      this.errorInforme =
        (err && err.message) || 'No se pudo enviar el informe. Intenta de nuevo.';
    } finally {
      this.enviandoInforme = false;
    }
  }

  volver(): void {
    this.router.navigateByUrl('/estudiante/cursos', { replaceUrl: true });
  }
}
