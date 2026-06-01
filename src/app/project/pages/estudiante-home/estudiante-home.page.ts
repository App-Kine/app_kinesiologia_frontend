import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonIcon, IonText,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  bodyOutline, schoolOutline, chevronForwardOutline, medicalOutline,
} from 'ionicons/icons';

/**
 * Pantalla HOME del estudiante (pedido cliente 2026-05-27).
 *
 * Dos accesos:
 *   1) Puntos de auscultación → modelo 3D con hotspots (modo exploración libre).
 *   2) Tests → flujo existente para rendir un test del curso.
 *
 * Es la nueva home — reemplaza el redirect raíz que antes iba directo a
 * /estudiante/cursos.
 *
 * Nota de naming: no confundir con `estudiante-inicio` (que es el splash de
 * "elegir modalidad anónima/identificada" dentro del flujo de un test).
 */
@Component({
  selector: 'app-estudiante-home',
  templateUrl: './estudiante-home.page.html',
  styleUrls: ['./estudiante-home.page.scss'],
  standalone: true,
  imports: [
    CommonModule, IonContent, IonHeader, IonToolbar, IonTitle, IonIcon, IonText,
  ],
})
export class EstudianteHomePage {
  constructor(private router: Router) {
    addIcons({ bodyOutline, schoolOutline, chevronForwardOutline, medicalOutline });
  }

  irAAuscultacion(): void {
    this.router.navigateByUrl('/estudiante/auscultacion');
  }

  irATests(): void {
    this.router.navigateByUrl('/estudiante/cursos');
  }
}
