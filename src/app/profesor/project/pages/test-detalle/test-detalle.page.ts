import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonButton, IonIcon, IonSpinner, IonNote, IonChip, IonLabel, IonText,
  IonFab, IonFabButton, AlertController, ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline, refreshOutline, createOutline, trashOutline,
  documentTextOutline, helpCircleOutline, musicalNotesOutline, imageOutline,
  listOutline, shuffleOutline, sparklesOutline, calendarOutline,
  alertCircleOutline,
} from 'ionicons/icons';

import { TestService, TestDetalle } from '../../services/test.service';
import { PreguntaService } from '../../services/pregunta.service';

@Component({
  selector: 'app-test-detalle',
  templateUrl: './test-detalle.page.html',
  styleUrls: ['./test-detalle.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonHeader, IonToolbar, IonTitle,
    IonButtons, IonBackButton, IonButton, IonIcon, IonSpinner, IonNote, IonChip,
    IonLabel, IonText, IonFab, IonFabButton,
  ],
})
export class TestDetallePage implements OnInit {
  testId = 0;
  test: TestDetalle | null = null;

  cargando = false;
  errorCarga = '';

  constructor(
    private testSvc: TestService,
    private preguntaSvc: PreguntaService,
    private route: ActivatedRoute,
    private router: Router,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {
    addIcons({
      addOutline, refreshOutline, createOutline, trashOutline,
      documentTextOutline, helpCircleOutline, musicalNotesOutline, imageOutline,
      listOutline, shuffleOutline, sparklesOutline, calendarOutline,
      alertCircleOutline,
    });
  }

  async ngOnInit(): Promise<void> {
    this.testId = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(this.testId) || this.testId <= 0) {
      this.errorCarga = 'ID de test inválido.';
      return;
    }
    await this.recargar();
  }

  async recargar(): Promise<void> {
    this.errorCarga = '';
    this.cargando = true;
    try {
      this.test = await this.testSvc.obtener(this.testId);
    } catch (err: any) {
      this.errorCarga = (err && err.message) || 'No se pudo cargar el test.';
      this.test = null;
    } finally {
      this.cargando = false;
    }
  }

  // -------- Acciones sobre el test --------

  irAEditarTest(): void {
    this.router.navigateByUrl(`/test-editar/${this.testId}`);
  }

  async confirmarEliminarTest(): Promise<void> {
    if (!this.test) return;
    const alert = await this.alertCtrl.create({
      header: '¿Eliminar este test?',
      message: `El test "${this.test.nombre}" se marcará como inactivo. Las aplicaciones y evaluaciones de estudiantes se conservan para histórico.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => this.ejecutarEliminarTest(),
        },
      ],
    });
    await alert.present();
  }

  private async ejecutarEliminarTest(): Promise<void> {
    try {
      await this.testSvc.eliminar(this.testId);
      const t = await this.toastCtrl.create({
        message: 'Test eliminado.',
        duration: 2000,
        color: 'success',
        position: 'bottom',
      });
      await t.present();
      this.router.navigateByUrl('/mis-tests', { replaceUrl: true });
    } catch (err: any) {
      const t = await this.toastCtrl.create({
        message: (err && err.message) || 'No se pudo eliminar el test.',
        duration: 3000,
        color: 'danger',
        position: 'bottom',
      });
      await t.present();
    }
  }

  // Navegación a crear pregunta dentro del test
  agregarPregunta(): void {
    this.router.navigate(['/pregunta-nueva'], {
      queryParams: { testId: this.testId },
    });
  }

  editarPregunta(preguntaId: number): void {
    this.router.navigate(['/pregunta-editar', preguntaId], {
      queryParams: { testId: this.testId },
    });
  }

  async confirmarQuitar(pregunta: any): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: '¿Quitar pregunta del test?',
      message: `Se quitará la pregunta de este test. Si la pregunta no está en otros tests y nunca fue respondida, se eliminará del banco automáticamente.\n\nEnunciado: ${(pregunta.enunciado || '').replace(/<[^>]+>/g, '').substring(0, 200)}${(pregunta.enunciado || '').length > 200 ? '...' : ''}`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Quitar',
          role: 'destructive',
          handler: () => this.ejecutarQuitar(pregunta),
        },
      ],
    });
    await alert.present();
  }

  private async ejecutarQuitar(pregunta: any): Promise<void> {
    try {
      const res = await this.preguntaSvc.quitarDeTest(this.testId, pregunta.pregunta_id);
      if (this.test) {
        this.test.preguntas = this.test.preguntas.filter(
          (p) => p.pregunta_id !== pregunta.pregunta_id
        );
      }
      const msg = res.huerfanaEliminada
        ? `Pregunta quitada del test y eliminada del banco.`
        : `Pregunta quitada del test.`;
      const toast = await this.toastCtrl.create({
        message: msg,
        duration: 2500,
        color: 'success',
        position: 'bottom',
      });
      await toast.present();
    } catch (err: any) {
      const toast = await this.toastCtrl.create({
        message: (err && err.message) || 'No se pudo quitar la pregunta.',
        duration: 3000,
        color: 'danger',
        position: 'bottom',
      });
      await toast.present();
    }
  }

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
