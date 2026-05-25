import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonText,
  IonSpinner,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { mailOutline, lockClosedOutline, logInOutline, schoolOutline } from 'ionicons/icons';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonText,
    IonSpinner,
    IonIcon,
  ],
})
export class LoginPage {
  correo = '';
  password = '';
  cargando = false;
  errorMsg = '';

  constructor(private auth: AuthService, private router: Router) {
    addIcons({ mailOutline, lockClosedOutline, logInOutline, schoolOutline });
  }

  /** Acceso público del estudiante (RF-01: sin login). */
  accederComoEstudiante(): void {
    this.router.navigateByUrl('/estudiante/cursos');
  }

  async onSubmit(): Promise<void> {
    this.errorMsg = '';

    if (!this.correo.trim() || !this.password) {
      this.errorMsg = 'Ingresa correo y contraseña.';
      return;
    }

    // Validación simple de formato (RF-09 / RF-57: mensaje genérico)
    const reCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!reCorreo.test(this.correo.trim())) {
      this.errorMsg = 'El correo no tiene un formato válido.';
      return;
    }

    this.cargando = true;
    try {
      const usuario = await this.auth.login(this.correo.trim(), this.password);
      // Redirige según rol (RF-54, RF-55, RF-56)
      const destino = this.auth.rutaDestinoSegunRoles(usuario.roles);
      this.router.navigateByUrl(destino, { replaceUrl: true });
    } catch (err: any) {
      // Mensaje genérico RF-57 si lógica devolvió "Credenciales inválidas"
      this.errorMsg = (err && err.message) || 'Credenciales inválidas';
    } finally {
      this.cargando = false;
    }
  }

  /** RF-59: recuperación de contraseña por correo. */
  olvidasteContrasena(): void {
    this.router.navigateByUrl('/recuperar-password');
  }
}
