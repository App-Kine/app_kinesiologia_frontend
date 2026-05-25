import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonButton, IonIcon, IonSpinner, IonNote, IonChip, IonLabel, IonText, IonToggle,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, refreshOutline, playCircle, pauseCircle, clipboardOutline, statsChartOutline } from 'ionicons/icons';

import { AplicacionService, AplicacionResumen } from '../../services/aplicacion.service';

@Component({
  selector: 'app-mis-aplicaciones',
  templateUrl: './mis-aplicaciones.page.html',
  styleUrls: ['./mis-aplicaciones.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonHeader, IonToolbar, IonTitle,
    IonButtons, IonBackButton, IonButton, IonIcon, IonSpinner, IonNote,
    IonChip, IonLabel, IonText, IonToggle,
  ],
})
export class MisAplicacionesPage implements OnInit {
  aplicaciones: AplicacionResumen[] = [];
  cargando = false;
  error = '';

  constructor(private aplSvc: AplicacionService, private router: Router) {
    addIcons({ addOutline, refreshOutline, playCircle, pauseCircle, clipboardOutline, statsChartOutline });
  }

  ngOnInit(): void { this.recargar(); }

  async recargar(): Promise<void> {
    this.error = '';
    this.cargando = true;
    try {
      this.aplicaciones = await this.aplSvc.listar();
    } catch (err: any) {
      this.error = (err && err.message) || 'No se pudo cargar la lista.';
      this.aplicaciones = [];
    } finally {
      this.cargando = false;
    }
  }

  async toggleActivo(a: AplicacionResumen, ev: any): Promise<void> {
    const nuevoEstado = ev.detail.checked;
    try {
      await this.aplSvc.setActivo(a.aplicacion_id, nuevoEstado);
      a.activo = nuevoEstado;
    } catch (err: any) {
      // Revertir visualmente si falla
      a.activo = !nuevoEstado;
      this.error = (err && err.message) || 'No se pudo cambiar el estado.';
    }
  }

  irACrear(): void { this.router.navigateByUrl('/aplicacion-nueva'); }

  verResultados(a: AplicacionResumen): void {
    this.router.navigateByUrl(`/analitica/${a.aplicacion_id}`);
  }

  formatoFecha(f: string): string {
    try {
      return new Date(f).toLocaleString('es-CL', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return f; }
  }
}
