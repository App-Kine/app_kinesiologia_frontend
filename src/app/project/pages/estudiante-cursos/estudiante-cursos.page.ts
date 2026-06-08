import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonBackButton, IonIcon, IonList, IonItem, IonLabel, IonText, IonSpinner,
  IonRefresher, IonRefresherContent,
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
    IonButton, IonBackButton, IonIcon, IonList, IonItem, IonLabel, IonText, IonSpinner,
    IonRefresher, IonRefresherContent,
  ],
})
export class EstudianteCursosPage {
  cursos: CursoPublico[] = [];
  cargando = true;
  error: string | null = null;

  private inFlight = false;
  // Refresco al volver la app a primer plano (cubre web y WebView de Capacitor).
  private onVisible = (): void => {
    if (document.visibilityState === 'visible') { void this.cargar(true); }
  };

  constructor(private evalSvc: EvaluacionService, private router: Router) {
    addIcons({ schoolOutline, chevronForwardOutline, refreshOutline });
  }

  /**
   * Refresca cada vez que se ENTRA a la página (incluye back-button).
   * Asegura que el estudiante vea los cursos actualizados si el docente
   * habilitó/deshabilitó alguno mientras navegaba.
   */
  ionViewWillEnter(): void {
    void this.cargar();
    document.addEventListener('visibilitychange', this.onVisible);
  }

  ionViewWillLeave(): void {
    document.removeEventListener('visibilitychange', this.onVisible);
  }

  /** @param silencioso true = refresco en segundo plano (sin spinner ni borrar la lista). */
  async cargar(silencioso = false): Promise<void> {
    if (this.inFlight) return;
    this.inFlight = true;
    if (!silencioso) { this.cargando = true; this.error = null; }
    try {
      this.cursos = await this.evalSvc.listarCursos();
      this.error = null;
    } catch (e: any) {
      if (!silencioso) { this.error = e?.message || 'No se pudieron cargar los cursos'; }
    } finally {
      this.inFlight = false;
      this.cargando = false;
    }
  }

  /** Pull-to-refresh. */
  async doRefresh(ev: any): Promise<void> {
    await this.cargar(true);
    ev.target.complete();
  }

  abrir(c: CursoPublico): void {
    this.router.navigateByUrl(`/estudiante/curso/${c.curso_id}/tests`);
  }
}
