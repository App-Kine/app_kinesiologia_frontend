import { Component } from '@angular/core';
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

const APL_PAGE_SIZE = 20;

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
export class MisAplicacionesPage {
  aplicaciones: AplicacionResumen[] = [];
  cargando = false;
  cargandoMas = false;
  error = '';

  // Paginación (escalabilidad): de a APL_PAGE_SIZE con "Cargar más".
  private page = 1;
  hasMore = false;

  constructor(private aplSvc: AplicacionService, private router: Router) {
    addIcons({ addOutline, refreshOutline, playCircle, pauseCircle, clipboardOutline, statsChartOutline });
  }

  /** Refresca cada vez que se ENTRA a la página (incluye back-button). */
  ionViewWillEnter(): void { this.recargar(); }

  /** Carga la primera página (reemplaza la lista). */
  async recargar(): Promise<void> {
    this.error = '';
    this.cargando = true;
    this.page = 1;
    try {
      const res = await this.aplSvc.listarPagina(this.page, APL_PAGE_SIZE);
      this.aplicaciones = res.items;
      this.hasMore = res.hasMore;
    } catch (err: any) {
      this.error = (err && err.message) || 'No se pudo cargar la lista.';
      this.aplicaciones = [];
      this.hasMore = false;
    } finally {
      this.cargando = false;
    }
  }

  /** Carga la siguiente página y la agrega al final. */
  async cargarMas(): Promise<void> {
    if (this.cargandoMas || !this.hasMore) return;
    this.cargandoMas = true;
    try {
      const res = await this.aplSvc.listarPagina(this.page + 1, APL_PAGE_SIZE);
      this.aplicaciones = [...this.aplicaciones, ...res.items];
      this.page = res.page;
      this.hasMore = res.hasMore;
    } catch (err: any) {
      this.error = (err && err.message) || 'No se pudieron cargar más aplicaciones.';
    } finally {
      this.cargandoMas = false;
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
