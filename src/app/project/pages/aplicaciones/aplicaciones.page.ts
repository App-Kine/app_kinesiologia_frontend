import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  IonBadge,
  IonText,
  IonSpinner,
  IonFab,
  IonFabButton,
  IonToggle,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, clipboardOutline } from 'ionicons/icons';

import {
  AplicacionService,
  AplicacionResumen,
} from '../../services/aplicacion.service';

@Component({
  selector: 'app-aplicaciones',
  templateUrl: './aplicaciones.page.html',
  styleUrls: ['./aplicaciones.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
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
    IonBadge,
    IonText,
    IonSpinner,
    IonFab,
    IonFabButton,
    IonToggle,
  ],
})
export class AplicacionesPage implements OnInit {
  aplicaciones: AplicacionResumen[] = [];
  cargando = true;
  error: string | null = null;

  constructor(
    private aplicacionService: AplicacionService,
    private router: Router,
    private toastCtrl: ToastController
  ) {
    addIcons({ add, clipboardOutline });
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
      this.aplicaciones = await this.aplicacionService.listar();
    } catch (e: any) {
      this.error = e?.message || 'Error al cargar aplicaciones';
      await this.mostrarToast(this.error || 'Error', 'danger');
    } finally {
      this.cargando = false;
    }
  }

  async cambiarActivo(a: AplicacionResumen, nuevoValor: boolean): Promise<void> {
    const valorAnterior = a.activo;
    a.activo = nuevoValor;
    try {
      await this.aplicacionService.setActivo(a.aplicacion_id, nuevoValor);
      await this.mostrarToast(
        nuevoValor ? 'Aplicación activada' : 'Aplicación desactivada',
        'success'
      );
    } catch (e: any) {
      a.activo = valorAnterior;
      await this.mostrarToast(
        e?.message || 'No se pudo actualizar',
        'danger'
      );
    }
  }

  irACrear(): void {
    this.router.navigateByUrl('/crear-aplicacion');
  }

  private async mostrarToast(
    message: string,
    color: 'success' | 'danger' | 'warning'
  ): Promise<void> {
    const t = await this.toastCtrl.create({ message, duration: 2500, color });
    await t.present();
  }
}
