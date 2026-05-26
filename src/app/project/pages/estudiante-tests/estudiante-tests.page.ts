import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonButton, IonIcon, IonList, IonItem, IonLabel, IonBadge, IonText, IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { documentTextOutline, chevronForwardOutline, helpCircleOutline } from 'ionicons/icons';

import { EvaluacionService, AplicacionActiva } from '../../services/evaluacion.service';

@Component({
  selector: 'app-estudiante-tests',
  templateUrl: './estudiante-tests.page.html',
  styleUrls: ['./estudiante-tests.page.scss'],
  standalone: true,
  imports: [
    CommonModule, IonContent, IonHeader, IonToolbar, IonTitle, IonButtons,
    IonBackButton, IonButton, IonIcon, IonList, IonItem, IonLabel, IonBadge,
    IonText, IonSpinner,
  ],
})
export class EstudianteTestsPage implements OnInit {
  cursoId: number | null = null;
  aplicaciones: AplicacionActiva[] = [];
  cargando = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private evalSvc: EvaluacionService
  ) {
    addIcons({ documentTextOutline, chevronForwardOutline, helpCircleOutline });
  }

  async ngOnInit(): Promise<void> {
    this.cursoId = Number(this.route.snapshot.paramMap.get('cursoId'));
    await this.cargar();
  }

  async cargar(): Promise<void> {
    if (!this.cursoId) { this.error = 'Curso inválido'; this.cargando = false; return; }
    this.cargando = true;
    this.error = null;
    try {
      this.aplicaciones = await this.evalSvc.aplicacionesActivas(this.cursoId);
    } catch (e: any) {
      this.error = e?.message || 'No se pudieron cargar las evaluaciones';
    } finally {
      this.cargando = false;
    }
  }

  comenzar(a: AplicacionActiva): void {
    this.router.navigateByUrl(`/estudiante/inicio/${a.aplicacion_id}`);
  }
}
