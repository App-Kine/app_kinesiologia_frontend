import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonButton, IonIcon, IonSpinner, IonNote, IonChip, IonLabel, IonText,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, refreshOutline, shuffleOutline, listOutline } from 'ionicons/icons';

import { TestService, TestResumen } from '../../services/test.service';

@Component({
  selector: 'app-mis-tests',
  templateUrl: './mis-tests.page.html',
  styleUrls: ['./mis-tests.page.scss'],
  standalone: true,
  imports: [
    CommonModule, IonContent, IonHeader, IonToolbar, IonTitle, IonButtons,
    IonBackButton, IonButton, IonIcon, IonSpinner, IonNote, IonChip, IonLabel, IonText,
  ],
})
export class MisTestsPage implements OnInit {
  tests: TestResumen[] = [];
  cargando = false;
  error = '';

  constructor(private testSvc: TestService, private router: Router) {
    addIcons({ addOutline, refreshOutline, shuffleOutline, listOutline });
  }

  ngOnInit(): void { this.recargar(); }

  async recargar(): Promise<void> {
    this.error = '';
    this.cargando = true;
    try {
      this.tests = await this.testSvc.listar();
    } catch (err: any) {
      this.error = (err && err.message) || 'No se pudo cargar la lista.';
      this.tests = [];
    } finally {
      this.cargando = false;
    }
  }

  irACrear(): void { this.router.navigateByUrl('/test-nuevo'); }

  abrirDetalle(t: TestResumen): void {
    this.router.navigateByUrl(`/test-detalle/${t.test_id}`);
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
