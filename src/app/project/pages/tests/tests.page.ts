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
  IonBadge,
  IonText,
  IonSpinner,
  IonFab,
  IonFabButton,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  add,
  documentTextOutline,
  shuffleOutline,
  arrowForwardOutline,
} from 'ionicons/icons';

import { TestService, TestResumen } from '../../services/test.service';

@Component({
  selector: 'app-tests',
  templateUrl: './tests.page.html',
  styleUrls: ['./tests.page.scss'],
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
    IonBadge,
    IonText,
    IonSpinner,
    IonFab,
    IonFabButton,
  ],
})
export class TestsPage implements OnInit {
  tests: TestResumen[] = [];
  cargando = true;
  error: string | null = null;

  constructor(
    private testService: TestService,
    private router: Router,
    private toastCtrl: ToastController
  ) {
    addIcons({ add, documentTextOutline, shuffleOutline, arrowForwardOutline });
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
      this.tests = await this.testService.listar();
    } catch (e: any) {
      this.error = e?.message || 'Error al cargar tests';
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
    this.router.navigateByUrl('/crear-test');
  }
}
