import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonNote,
  IonText,
  IonSpinner,
  IonFab,
  IonFabButton,
  IonBackButton,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  add,
  arrowBackOutline,
  helpCircleOutline,
  musicalNotesOutline,
  imageOutline,
} from 'ionicons/icons';

import { PreguntaService, PreguntaResumen } from '../../services/pregunta.service';

@Component({
  selector: 'app-preguntas',
  templateUrl: './preguntas.page.html',
  styleUrls: ['./preguntas.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonNote,
    IonText,
    IonSpinner,
    IonFab,
    IonFabButton,
    IonBackButton,
  ],
})
export class PreguntasPage implements OnInit {
  preguntas: PreguntaResumen[] = [];
  cargando = true;
  error: string | null = null;

  constructor(
    private preguntaService: PreguntaService,
    private router: Router,
    private toastCtrl: ToastController
  ) {
    addIcons({
      add,
      arrowBackOutline,
      helpCircleOutline,
      musicalNotesOutline,
      imageOutline,
    });
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
      this.preguntas = await this.preguntaService.listar();
    } catch (e: any) {
      this.error = e?.message || 'Error al cargar preguntas';
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

  irACrear(): void {
    this.router.navigateByUrl('/crear-pregunta');
  }
}
