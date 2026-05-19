import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonButton, IonIcon, IonSpinner, IonNote, IonChip, IonLabel, IonText,
  IonSearchbar, IonFab, IonFabButton, AlertController, ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline, refreshOutline, musicalNotesOutline, imageOutline,
  helpCircleOutline, calendarOutline, sparklesOutline, searchOutline,
  createOutline, trashOutline, listOutline, ellipsisHorizontal,
} from 'ionicons/icons';

import { PreguntaService, PreguntaResumen } from '../../services/pregunta.service';

@Component({
  selector: 'app-mis-preguntas',
  templateUrl: './mis-preguntas.page.html',
  styleUrls: ['./mis-preguntas.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonHeader, IonToolbar, IonTitle,
    IonButtons, IonBackButton, IonButton, IonIcon, IonSpinner, IonNote, IonChip,
    IonLabel, IonText, IonSearchbar, IonFab, IonFabButton,
  ],
})
export class MisPreguntasPage implements OnInit {
  preguntas: PreguntaResumen[] = [];
  filtro = '';
  cargando = false;
  error = '';

  constructor(
    private preguntaSvc: PreguntaService,
    private router: Router,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {
    addIcons({
      addOutline, refreshOutline, musicalNotesOutline, imageOutline,
      helpCircleOutline, calendarOutline, sparklesOutline, searchOutline,
      createOutline, trashOutline, listOutline, ellipsisHorizontal,
    });
  }

  ngOnInit(): void {
    this.recargar();
  }

  async recargar(): Promise<void> {
    this.error = '';
    this.cargando = true;
    try {
      this.preguntas = await this.preguntaSvc.listar();
    } catch (err: any) {
      this.error = (err && err.message) || 'No se pudo cargar la lista.';
      this.preguntas = [];
    } finally {
      this.cargando = false;
    }
  }

  get preguntasFiltradas(): PreguntaResumen[] {
    const q = this.filtro.trim().toLowerCase();
    if (!q) return this.preguntas;
    return this.preguntas.filter((p) =>
      p.enunciado.toLowerCase().includes(q)
    );
  }

  irACrear(): void {
    this.router.navigateByUrl('/pregunta-nueva');
  }

  irAEditar(p: PreguntaResumen): void {
    this.router.navigateByUrl(`/pregunta-editar/${p.pregunta_id}`);
  }

  async confirmarEliminar(p: PreguntaResumen): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: '¿Eliminar pregunta?',
      message: `
        <p>Esta acción marcará la pregunta como inactiva. Las evaluaciones
        ya respondidas conservan su historial.</p>
        <p><strong>Enunciado:</strong><br>
        <em>${this.escapar(p.enunciado).substring(0, 200)}${p.enunciado.length > 200 ? '...' : ''}</em></p>
      `,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          cssClass: 'danger',
          handler: () => this.ejecutarEliminar(p),
        },
      ],
    });
    await alert.present();
  }

  private async ejecutarEliminar(p: PreguntaResumen): Promise<void> {
    try {
      await this.preguntaSvc.eliminar(p.pregunta_id);
      this.preguntas = this.preguntas.filter((x) => x.pregunta_id !== p.pregunta_id);
      const toast = await this.toastCtrl.create({
        message: `Pregunta #${p.pregunta_id} eliminada.`,
        duration: 2000,
        color: 'success',
        position: 'bottom',
      });
      await toast.present();
    } catch (err: any) {
      const toast = await this.toastCtrl.create({
        message: (err && err.message) || 'No se pudo eliminar.',
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

  formatoFecha(f: string): string {
    try {
      return new Date(f).toLocaleDateString('es-CL', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      });
    } catch {
      return f;
    }
  }
}
