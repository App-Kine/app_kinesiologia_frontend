import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonButton, IonIcon, IonItem, IonLabel, IonInput, IonText, IonSpinner, IonNote,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { lockClosedOutline, saveOutline, checkmarkCircleOutline } from 'ionicons/icons';

import { PasswordService } from '../../services/password.service';

@Component({
  selector: 'app-restablecer-password',
  templateUrl: './restablecer-password.page.html',
  styleUrls: ['./restablecer-password.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonHeader, IonToolbar, IonTitle,
    IonButtons, IonBackButton, IonButton, IonIcon, IonItem, IonLabel, IonInput,
    IonText, IonSpinner, IonNote,
  ],
})
export class RestablecerPasswordPage implements OnInit {
  token = '';
  password = '';
  confirmar = '';
  guardando = false;
  ok = false;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pwSvc: PasswordService
  ) {
    addIcons({ lockClosedOutline, saveOutline, checkmarkCircleOutline });
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') || '';
  }

  /** Validación de política RNF-13 (espejo del backend, feedback rápido). */
  private validar(): string | null {
    const p = this.password;
    const faltan: string[] = [];
    if (!p || p.length < 10) faltan.push('mínimo 10 caracteres');
    if (!/[A-Z]/.test(p)) faltan.push('una mayúscula');
    if (!/[a-z]/.test(p)) faltan.push('una minúscula');
    if (!/[0-9]/.test(p)) faltan.push('un número');
    if (!/[^A-Za-z0-9]/.test(p)) faltan.push('un símbolo');
    if (faltan.length) return 'La contraseña debe incluir: ' + faltan.join(', ');
    if (this.password !== this.confirmar) return 'Las contraseñas no coinciden.';
    return null;
  }

  async guardar(): Promise<void> {
    this.error = null;
    if (!this.token) { this.error = 'Enlace inválido.'; return; }
    const err = this.validar();
    if (err) { this.error = err; return; }

    this.guardando = true;
    try {
      await this.pwSvc.resetear(this.token, this.password);
      this.ok = true;
    } catch (e: any) {
      this.error = e?.message || 'No se pudo restablecer la contraseña';
    } finally {
      this.guardando = false;
    }
  }

  irALogin(): void {
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
