import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonButton, IonIcon, IonList, IonItem, IonLabel, IonText, IonSpinner,
  IonFab, IonFabButton, AlertController, ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  schoolOutline, chevronForwardOutline, addOutline, sparklesOutline,
  createOutline, trashOutline, ellipsisVertical,
} from 'ionicons/icons';

import { CursoService, CursoResumen } from '../../services/curso.service';
import { createLogger } from '../../services/logger';

const log = createLogger('mis-cursos');

@Component({
  selector: 'app-mis-cursos',
  templateUrl: './mis-cursos.page.html',
  styleUrls: ['./mis-cursos.page.scss'],
  standalone: true,
  imports: [
    CommonModule, IonContent, IonHeader, IonToolbar, IonTitle, IonButtons,
    IonBackButton, IonButton, IonIcon, IonList, IonItem, IonLabel,
    IonText, IonSpinner, IonFab, IonFabButton,
  ],
})
export class MisCursosPage {
  cursos: CursoResumen[] = [];
  cargando = true;
  error: string | null = null;

  constructor(
    private cursoService: CursoService,
    private router: Router,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {
    addIcons({
      schoolOutline, chevronForwardOutline, addOutline, sparklesOutline,
      createOutline, trashOutline, ellipsisVertical,
    });
  }

  // La carga ocurre en ionViewWillEnter, que se dispara tanto al entrar la
  // primera vez como al volver desde crear/editar (así la lista se refresca).
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
      await this.toast(this.error || 'Error', 'danger');
    } finally {
      this.cargando = false;
    }
  }

  abrirCurso(c: CursoResumen): void {
    this.router.navigateByUrl(`/curso/${c.curso_id}`);
  }

  irACrearCurso(): void {
    this.router.navigateByUrl('/curso-nuevo');
  }

  editarCurso(c: CursoResumen, ev: Event): void {
    ev.stopPropagation();
    this.router.navigateByUrl(`/curso-editar/${c.curso_id}`);
  }

  async confirmarEliminar(c: CursoResumen, ev: Event): Promise<void> {
    ev.stopPropagation();
    const alert = await this.alertCtrl.create({
      header: '¿Eliminar este curso?',
      message: `El curso "${c.nombre}" se marcará como inactivo. Las evaluaciones ya realizadas se conservan para histórico.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => this.ejecutarEliminar(c),
        },
      ],
    });
    await alert.present();
  }

  private async ejecutarEliminar(c: CursoResumen): Promise<void> {
    try {
      await this.cursoService.eliminar(c.curso_id);
      this.cursos = this.cursos.filter((x) => x.curso_id !== c.curso_id);
      await this.toast(`Curso "${c.nombre}" eliminado.`, 'success');
    } catch (e: any) {
      await this.toast(e?.message || 'No se pudo eliminar.', 'danger');
    }
  }

  private escapar(s: string): string {
    const map: any = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return s.replace(/[&<>"']/g, (c) => map[c]);
  }

  private async toast(message: string, color: 'success' | 'danger' | 'warning'): Promise<void> {
    const t = await this.toastCtrl.create({ message, duration: 2500, color, position: 'bottom' });
    await t.present();
  }
}
