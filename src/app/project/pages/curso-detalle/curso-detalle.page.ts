import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonButton, IonIcon, IonSpinner, IonNote, IonChip, IonLabel, IonText,
  IonToggle, IonFab, IonFabButton,
  AlertController, ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline, refreshOutline, schoolOutline, sparklesOutline,
  documentTextOutline, calendarOutline, playCircle, pauseCircle,
  alertCircleOutline, trashOutline, createOutline, helpCircleOutline,
  statsChartOutline,
} from 'ionicons/icons';

import {
  CursoService, CursoConAplicaciones,
} from '../../services/curso.service';
import { AplicacionService } from '../../services/aplicacion.service';
import { createLogger } from '../../services/logger';

const log = createLogger('curso-detalle');

@Component({
  selector: 'app-curso-detalle',
  templateUrl: './curso-detalle.page.html',
  styleUrls: ['./curso-detalle.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonHeader, IonToolbar, IonTitle,
    IonButtons, IonBackButton, IonButton, IonIcon, IonSpinner, IonNote,
    IonChip, IonLabel, IonText, IonToggle, IonFab, IonFabButton,
  ],
})
export class CursoDetallePage implements OnInit {
  cursoId = 0;
  curso: CursoConAplicaciones | null = null;
  cargando = false;
  errorCarga = '';

  constructor(
    private cursoSvc: CursoService,
    private aplSvc: AplicacionService,
    private route: ActivatedRoute,
    private router: Router,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {
    addIcons({
      addOutline, refreshOutline, schoolOutline, sparklesOutline,
      documentTextOutline, calendarOutline, playCircle, pauseCircle,
      alertCircleOutline, trashOutline, createOutline, helpCircleOutline,
      statsChartOutline,
    });
  }

  ngOnInit(): void {
    // Solo parsea el id; la carga la hace ionViewWillEnter (también al volver).
    this.cursoId = Number(this.route.snapshot.paramMap.get('cursoId'));
    if (!Number.isInteger(this.cursoId) || this.cursoId <= 0) {
      this.errorCarga = 'ID de curso inválido.';
    }
  }

  ionViewWillEnter(): void {
    if (this.cursoId) this.recargar();
  }

  async recargar(): Promise<void> {
    this.errorCarga = '';
    this.cargando = true;
    try {
      this.curso = await this.cursoSvc.obtenerConAplicaciones(this.cursoId);
    } catch (err: any) {
      log.error('recargar', err);
      this.errorCarga = (err && err.message) || 'No se pudo cargar el curso.';
      this.curso = null;
    } finally {
      this.cargando = false;
    }
  }

  // -------- Acciones sobre el curso --------

  irAEditar(): void {
    this.router.navigateByUrl(`/curso-editar/${this.cursoId}`);
  }

  async confirmarEliminarCurso(): Promise<void> {
    if (!this.curso) return;
    const alert = await this.alertCtrl.create({
      header: '¿Eliminar este curso?',
      message: `
        <p>El curso "<strong>${this.escapar(this.curso.nombre)}</strong>" se marcará como inactivo.</p>
        <p>Las aplicaciones y evaluaciones se conservan para histórico.</p>
      `,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => this.ejecutarEliminarCurso(),
        },
      ],
    });
    await alert.present();
  }

  private async ejecutarEliminarCurso(): Promise<void> {
    try {
      await this.cursoSvc.eliminar(this.cursoId);
      const t = await this.toastCtrl.create({
        message: 'Curso eliminado.',
        duration: 2000,
        color: 'success',
      });
      await t.present();
      this.router.navigateByUrl('/mis-cursos', { replaceUrl: true });
    } catch (err: any) {
      const t = await this.toastCtrl.create({
        message: err?.message || 'No se pudo eliminar.',
        duration: 3000,
        color: 'danger',
      });
      await t.present();
    }
  }

  // -------- Aplicaciones (tests aplicados al curso) --------

  agregarAplicacion(): void {
    this.router.navigate(['/crear-aplicacion'], {
      queryParams: { cursoId: this.cursoId },
    });
  }

  /** Abre la analítica de una aplicación concreta. */
  verResultados(a: any): void {
    this.router.navigateByUrl(`/analitica/${a.aplicacion_id}`);
  }

  async toggleActivo(a: any, ev: any): Promise<void> {
    const nuevo = ev.detail.checked;
    const anterior = a.activo;
    a.activo = nuevo;
    try {
      await this.aplSvc.setActivo(a.aplicacion_id, nuevo);
    } catch (err: any) {
      a.activo = anterior;
      const t = await this.toastCtrl.create({
        message: err?.message || 'No se pudo cambiar el estado.',
        duration: 3000,
        color: 'danger',
      });
      await t.present();
    }
  }

  async confirmarQuitarAplicacion(a: any): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: '¿Quitar este test del curso?',
      message: `
        <p>Se eliminará la aplicación de "<strong>${this.escapar(a.test_nombre)}</strong>" en este curso.</p>
        <p>Si hay evaluaciones de estudiantes registradas, no se podrá eliminar — usa desactivar en su lugar.</p>
      `,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Quitar',
          role: 'destructive',
          handler: () => this.ejecutarQuitarAplicacion(a),
        },
      ],
    });
    await alert.present();
  }

  private async ejecutarQuitarAplicacion(a: any): Promise<void> {
    try {
      await this.aplSvc.eliminar(a.aplicacion_id);
      if (this.curso) {
        this.curso.aplicaciones = this.curso.aplicaciones.filter(
          (x) => x.aplicacion_id !== a.aplicacion_id
        );
      }
      const t = await this.toastCtrl.create({
        message: 'Test quitado del curso.',
        duration: 2000,
        color: 'success',
      });
      await t.present();
    } catch (err: any) {
      const t = await this.toastCtrl.create({
        message: err?.message || 'No se pudo quitar.',
        duration: 4000,
        color: 'danger',
      });
      await t.present();
    }
  }

  // -------- Helpers --------

  private escapar(s: string): string {
    const map: any = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return s.replace(/[&<>"']/g, (c) => map[c]);
  }

  formatoFecha(f: string | undefined): string {
    if (!f) return '';
    try {
      return new Date(f).toLocaleDateString('es-CL', {
        year: 'numeric', month: 'short', day: '2-digit',
      });
    } catch { return f; }
  }
}
