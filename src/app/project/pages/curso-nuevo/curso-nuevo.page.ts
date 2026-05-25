import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonButton, IonIcon, IonItem, IonLabel, IonInput, IonTextarea,
  IonText, IonSpinner, IonNote,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  saveOutline, schoolOutline, checkmarkCircle, alertCircleOutline,
} from 'ionicons/icons';

import { CursoService } from '../../services/curso.service';

@Component({
  selector: 'app-curso-nuevo',
  templateUrl: './curso-nuevo.page.html',
  styleUrls: ['./curso-nuevo.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonHeader, IonToolbar, IonTitle,
    IonButtons, IonBackButton, IonButton, IonIcon, IonItem, IonLabel, IonInput,
    IonTextarea, IonText, IonSpinner, IonNote,
  ],
})
export class CursoNuevoPage {
  codigo = '';
  nombre = '';
  descripcion = '';

  guardando = false;
  errorMsg = '';
  okMsg = '';

  constructor(private cursoSvc: CursoService, private router: Router) {
    addIcons({ saveOutline, schoolOutline, checkmarkCircle, alertCircleOutline });
  }

  get formularioCompleto(): boolean {
    return !!this.codigo.trim() && !!this.nombre.trim();
  }

  async guardar(): Promise<void> {
    this.errorMsg = '';
    this.okMsg = '';
    if (!this.codigo.trim()) {
      this.errorMsg = 'Ingresa un código de curso.';
      return;
    }
    if (!this.nombre.trim()) {
      this.errorMsg = 'Ingresa un nombre.';
      return;
    }
    this.guardando = true;
    try {
      const resp = await this.cursoSvc.crear({
        codigo: this.codigo.trim().toUpperCase(),
        nombre: this.nombre.trim(),
        descripcion: this.descripcion.trim() || null,
      });
      this.okMsg = `Curso creado. Ahora puedes agregar tests...`;
      setTimeout(
        () => this.router.navigateByUrl(`/curso/${resp.curso_id}`, { replaceUrl: true }),
        1000
      );
    } catch (e: any) {
      this.errorMsg = (e && e.message) || 'No se pudo crear el curso.';
    } finally {
      this.guardando = false;
    }
  }
}
