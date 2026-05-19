import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  IonList,
  IonItem,
  IonLabel,
  IonNote,
  IonText,
  IonSpinner,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { schoolOutline, chevronForwardOutline } from 'ionicons/icons';

import { CursoService, CursoResumen } from '../../services/curso.service';
import { createLogger } from '../../services/logger';

const log = createLogger('mis-cursos');

@Component({
  selector: 'app-mis-cursos',
  templateUrl: './mis-cursos.page.html',
  styleUrls: ['./mis-cursos.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonNote,
    IonText,
    IonSpinner,
  ],
})
export class MisCursosPage implements OnInit {
  cursos: CursoResumen[] = [];
  cargando = true;
  error: string | null = null;

  constructor(
    private cursoService: CursoService,
    private router: Router,
    private toastCtrl: ToastController
  ) {
    addIcons({ schoolOutline, chevronForwardOutline });
  }

  async ngOnInit(): Promise<void> {
    await this.cargar();
  }

  ionViewWillEnter(): void {
    this.cargar();
  }

  async cargar(): Promise<void> {
    this.cargando = true;
    this.error = null;
    try {
      this.cursos = await this.cursoService.listarMisCursos();
    } catch (e: any) {
      log.error('cargar', e);
      this.error = e?.message || 'Error al cargar cursos';
      const toast = await this.toastCtrl.create({
        message: this.error || 'Error',
        duration: 3000,
        color: 'danger',
      });
      await toast.present();
    } finally {
      this.cargando = false;
    }
  }

  abrirCurso(c: CursoResumen): void {
    this.router.navigateByUrl(`/curso/${c.curso_id}`);
  }
}
