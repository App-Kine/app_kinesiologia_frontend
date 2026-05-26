import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonButton, IonIcon, IonItem, IonTextarea,
  IonCheckbox, IonSpinner, IonNote,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  saveOutline, shuffleOutline, listOutline, checkmarkCircle,
  documentTextOutline, alertCircleOutline,
} from 'ionicons/icons';

import { TestService } from '../../services/test.service';

@Component({
  selector: 'app-test-nuevo',
  templateUrl: './test-nuevo.page.html',
  styleUrls: ['./test-nuevo.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonHeader, IonToolbar, IonTitle,
    IonButtons, IonBackButton, IonButton, IonIcon, IonItem,
    IonTextarea, IonCheckbox, IonSpinner, IonNote,
  ],
})
export class TestNuevoPage {
  // Datos del test (un test es un banco reutilizable: NO se ata a un curso aquí.
  // Para que los estudiantes lo respondan, se aplica a un curso desde el panel
  // del curso → "agregar test", que crea una aplicación).
  nombre = '';
  descripcion = '';
  ordenAleatorio = false;

  // Estado
  guardando = false;
  errorMsg = '';
  okMsg = '';

  constructor(
    private testSvc: TestService,
    private router: Router
  ) {
    addIcons({
      saveOutline, shuffleOutline, listOutline, checkmarkCircle,
      documentTextOutline, alertCircleOutline,
    });
  }

  async guardar(): Promise<void> {
    this.errorMsg = '';
    this.okMsg = '';
    if (!this.nombre.trim()) {
      this.errorMsg = 'Ingresa un nombre para el test.';
      return;
    }
    this.guardando = true;
    try {
      const resp = await this.testSvc.crear({
        nombre: this.nombre.trim(),
        descripcion: this.descripcion.trim() || null,
        ordenAleatorio: this.ordenAleatorio,
        preguntas: [], // Test vacío, las preguntas se agregan en test-detalle
      });
      this.okMsg = `Test #${resp.test_id} creado. Ahora agrega las preguntas...`;
      // Redirigir al detalle para empezar a agregar preguntas
      setTimeout(
        () => this.router.navigateByUrl(`/test-detalle/${resp.test_id}`, { replaceUrl: true }),
        1000
      );
    } catch (e: any) {
      this.errorMsg = (e && e.message) || 'No se pudo crear el test.';
    } finally {
      this.guardando = false;
    }
  }
}
