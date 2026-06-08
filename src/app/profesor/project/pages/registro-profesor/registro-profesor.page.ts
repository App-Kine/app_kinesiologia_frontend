import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
  IonNote,
  IonButtons,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  mailOutline,
  personOutline,
  lockClosedOutline,
  checkmarkCircle,
  closeCircle,
  saveOutline,
  arrowBackOutline,
} from 'ionicons/icons';

import { InvitacionService } from '../../services/invitacion.service';

@Component({
  selector: 'app-registro-profesor',
  templateUrl: './registro-profesor.page.html',
  styleUrls: ['./registro-profesor.page.scss'],
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
    IonNote,
    IonButtons,
  ],
})
export class RegistroProfesorPage implements OnInit {
  // Estados
  verificando = true;
  invitacionValida = false;
  mensajeError = '';
  cargando = false;
  ok = false;

  // Datos del form
  token = '';
  correoPrelleno = '';
  nombre = '';
  password = '';
  password2 = '';

  // Reglas de password (RNF-13)
  reglas = [
    { id: 'len', label: 'Al menos 10 caracteres', ok: false },
    { id: 'upper', label: 'Una mayúscula (A-Z)', ok: false },
    { id: 'lower', label: 'Una minúscula (a-z)', ok: false },
    { id: 'digit', label: 'Un número (0-9)', ok: false },
    { id: 'symbol', label: 'Un símbolo (! @ # …)', ok: false },
    { id: 'match', label: 'Las contraseñas coinciden', ok: false },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private invitaciones: InvitacionService
  ) {
    addIcons({
      mailOutline,
      personOutline,
      lockClosedOutline,
      checkmarkCircle,
      closeCircle,
      saveOutline,
      arrowBackOutline,
    });
  }

  /** Vuelve al login. */
  volver(): void {
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  async ngOnInit(): Promise<void> {
    this.token = this.route.snapshot.paramMap.get('token') || '';
    if (!this.token) {
      this.verificando = false;
      this.mensajeError = 'Enlace de invitación inválido.';
      return;
    }
    try {
      const resp = await this.invitaciones.verificar(this.token);
      this.correoPrelleno = resp.correo_destino;
      this.invitacionValida = true;
    } catch (err: any) {
      this.mensajeError =
        (err && err.message) || 'No fue posible validar la invitación.';
    } finally {
      this.verificando = false;
    }
  }

  evaluarPassword(): void {
    const p = this.password;
    this.reglas[0].ok = p.length >= 10;
    this.reglas[1].ok = /[A-Z]/.test(p);
    this.reglas[2].ok = /[a-z]/.test(p);
    this.reglas[3].ok = /[0-9]/.test(p);
    this.reglas[4].ok = /[^A-Za-z0-9]/.test(p);
    this.reglas[5].ok = p.length > 0 && p === this.password2;
  }

  get passwordCumple(): boolean {
    return this.reglas.every((r) => r.ok);
  }

  irALogin(): void {
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  async onSubmit(): Promise<void> {
    this.mensajeError = '';
    if (!this.nombre.trim() || this.nombre.trim().length < 2) {
      this.mensajeError = 'Ingresa tu nombre.';
      return;
    }
    if (!this.passwordCumple) {
      this.mensajeError =
        'La contraseña no cumple la política. Revisa los puntos en rojo.';
      return;
    }
    this.cargando = true;
    try {
      await this.invitaciones.completar(
        this.token,
        this.nombre.trim(),
        this.password
      );
      this.ok = true;
      setTimeout(() => {
        this.router.navigateByUrl('/login', { replaceUrl: true });
      }, 2200);
    } catch (err: any) {
      this.mensajeError =
        (err && err.message) || 'No fue posible completar el registro.';
    } finally {
      this.cargando = false;
    }
  }
}
