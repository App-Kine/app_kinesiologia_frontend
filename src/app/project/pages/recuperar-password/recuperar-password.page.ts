import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonButton, IonIcon, IonItem, IonLabel, IonInput, IonText, IonSpinner, IonNote,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { mailOutline, sendOutline, checkmarkCircleOutline } from 'ionicons/icons';

import { PasswordService } from '../../services/password.service';

@Component({
  selector: 'app-recuperar-password',
  templateUrl: './recuperar-password.page.html',
  styleUrls: ['./recuperar-password.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonHeader, IonToolbar, IonTitle,
    IonButtons, IonBackButton, IonButton, IonIcon, IonItem, IonLabel, IonInput,
    IonText, IonSpinner, IonNote,
  ],
})
export class RecuperarPasswordPage {
  correo = '';
  enviando = false;
  enviado = false;
  error: string | null = null;
  devLink: string | null = null;

  private RE_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  constructor(private pwSvc: PasswordService, private router: Router) {
    addIcons({ mailOutline, sendOutline, checkmarkCircleOutline });
  }

  async enviar(): Promise<void> {
    this.error = null;
    const c = this.correo.trim().toLowerCase();
    if (!c || !this.RE_CORREO.test(c)) {
      this.error = 'Ingresa un correo válido.';
      return;
    }
    this.enviando = true;
    try {
      const r = await this.pwSvc.solicitar(c);
      this.enviado = true;
      this.devLink = r?.devLink || null;
    } catch (e: any) {
      this.error = e?.message || 'No se pudo procesar la solicitud';
    } finally {
      this.enviando = false;
    }
  }

  irALogin(): void {
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
