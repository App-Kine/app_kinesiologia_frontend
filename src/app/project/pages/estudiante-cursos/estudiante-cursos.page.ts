import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonBackButton, IonIcon, IonList, IonItem, IonLabel, IonNote, IonText, IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { schoolOutline, chevronForwardOutline, refreshOutline } from 'ionicons/icons';

import { EvaluacionService, CursoPublico } from '../../services/evaluacion.service';

@Component({
  selector: 'app-estudiante-cursos',
  templateUrl: './estudiante-cursos.page.html',
  styleUrls: ['./estudiante-cursos.page.scss'],
  standalone: true,
  imports: [
    CommonModule, IonContent, IonHeader, IonToolbar, IonTitle, IonButtons,
    IonButton, IonBackButton, IonIcon, IonList, IonItem, IonLabel, IonNote, IonText, IonSpinner,
  ],
})
export class EstudianteCursosPage {
  cursos: CursoPublico[] = [];
  cargando = true;
  error: string | null = null;

  constructor(private evalSvc: EvaluacionService, private router: Router) {
    addIcons({ schoolOutline, chevronForwardOutline, refreshOutline });
  }

  /**
   * Refresca cada vez que se ENTRA a la página (incluye back-button).
   * Asegura que el estudiante vea los cursos actualizados si el docente
   * habilitó/deshabilitó alguno mientras navegaba.
   */
  ionViewWillEnter(): void { void this.cargar(); }

  async cargar(): Promise<void> {
    this.cargando = true;
    this.error = null;
    try {
      this.cursos = await this.evalSvc.listarCursos();
    } catch (e: any) {
      this.error = e?.message || 'No se pudieron cargar los cursos';
    } finally {
      this.cargando = false;
    }
  }

  abrir(c: CursoPublico): void {
    this.router.navigateByUrl(`/estudiante/curso/${c.curso_id}/tests`);
  }
}
