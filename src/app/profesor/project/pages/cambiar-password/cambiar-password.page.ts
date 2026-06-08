import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonButton, IonIcon, IonItem, IonLabel, IonInput, IonText, IonSpinner, IonNote,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  lockClosedOutline, keyOutline, saveOutline, checkmarkCircleOutline,
} from 'ionicons/icons';

import { PasswordService } from '../../services/password.service';

/**
 * Cambio de contraseña del usuario AUTENTICADO (docente/admin).
 * El backend identifica al usuario por el JWT (no por el formulario), verifica
 * la contraseña actual y valida la nueva contra la política RNF-13.
 */
@Component({
  selector: 'app-cambiar-password',
  templateUrl: './cambiar-password.page.html',
  styleUrls: ['./cambiar-password.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonHeader, IonToolbar, IonTitle,
    IonButtons, IonBackButton, IonButton, IonIcon, IonItem, IonLabel, IonInput,
    IonText, IonSpinner, IonNote,
  ],
})
export class CambiarPasswordPage {
  actual = '';
  nueva = '';
  confirmar = '';
  guardando = false;
  ok = false;
  error: string | null = null;

  constructor(private router: Router, private pwSvc: PasswordService) {
    addIcons({ lockClosedOutline, keyOutline, saveOutline, checkmarkCircleOutline });
  }

  /** Validación de política RNF-13 (espejo del backend, feedback rápido). */
  private validar(): string | null {
    if (!this.actual) return 'Ingresa tu contraseña actual.';
    const p = this.nueva;
    const faltan: string[] = [];
    if (!p || p.length < 10) faltan.push('mínimo 10 caracteres');
    if (!/[A-Z]/.test(p)) faltan.push('una mayúscula');
    if (!/[a-z]/.test(p)) faltan.push('una minúscula');
    if (!/[0-9]/.test(p)) faltan.push('un número');
    if (!/[^A-Za-z0-9]/.test(p)) faltan.push('un símbolo');
    if (faltan.length) return 'La nueva contraseña debe incluir: ' + faltan.join(', ');
    if (this.nueva !== this.confirmar) return 'Las contraseñas no coinciden.';
    if (this.nueva === this.actual) return 'La nueva contraseña debe ser distinta de la actual.';
    return null;
  }

  async guardar(): Promise<void> {
    this.error = null;
    const err = this.validar();
    if (err) { this.error = err; return; }

    this.guardando = true;
    try {
      await this.pwSvc.cambiar(this.actual, this.nueva);
      this.ok = true;
    } catch (e: any) {
      this.error = e?.message || 'No se pudo cambiar la contraseña';
    } finally {
      this.guardando = false;
    }
  }

  volver(): void {
    this.router.navigateByUrl('/seleccion-panel', { replaceUrl: true });
  }
}
