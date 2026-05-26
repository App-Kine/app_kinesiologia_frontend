import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonText,
  IonBadge,
  IonItem,
  IonLabel,
  IonInput,
  IonSpinner,
  IonNote,
  IonChip,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  logOutOutline,
  schoolOutline,
  peopleOutline,
  bookOutline,
  analyticsOutline,
  shieldCheckmarkOutline,
  swapHorizontalOutline,
  mailOutline,
  sendOutline,
  refreshOutline,
  copyOutline,
  checkmarkCircle,
  timeOutline,
  closeCircle,
} from 'ionicons/icons';

import { AuthService, UsuarioSesion } from '../../services/auth.service';
import {
  InvitacionService,
  InvitacionResumen,
  CrearInvitacionResp,
} from '../../services/invitacion.service';

@Component({
  selector: 'app-panel-admin',
  templateUrl: './panel-admin.page.html',
  styleUrls: ['./panel-admin.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonText,
    IonBadge,
    IonItem,
    IonLabel,
    IonInput,
    IonSpinner,
    IonNote,
    IonChip,
  ],
})
export class PanelAdminPage implements OnInit {
  usuario: UsuarioSesion | null = null;
  tieneRolProfesor = false;

  // Invitar
  invitarCorreo = '';
  invitando = false;
  invitarError = '';
  invitacionRecienCreada: CrearInvitacionResp | null = null;

  // Listado
  invitaciones: InvitacionResumen[] = [];
  cargandoLista = false;
  errorLista = '';

  constructor(
    private auth: AuthService,
    private router: Router,
    private invitaciones$: InvitacionService
  ) {
    addIcons({
      logOutOutline,
      schoolOutline,
      peopleOutline,
      bookOutline,
      analyticsOutline,
      shieldCheckmarkOutline,
      swapHorizontalOutline,
      mailOutline,
      sendOutline,
      refreshOutline,
      copyOutline,
      checkmarkCircle,
      timeOutline,
      closeCircle,
    });
  }

  async ngOnInit(): Promise<void> {
    this.usuario = await this.auth.getUsuario();
    this.tieneRolProfesor = await this.auth.hasRol('PROFESOR');
    await this.auth.setPanelActual('ADMIN');
    await this.recargarInvitaciones();
  }

  async cambiarPanel(): Promise<void> {
    this.router.navigateByUrl('/seleccion-panel');
  }

  async cerrarSesion(): Promise<void> {
    await this.auth.logout();
  }

  // -------------------- INVITAR --------------------

  async invitar(): Promise<void> {
    this.invitarError = '';
    this.invitacionRecienCreada = null;

    const correo = this.invitarCorreo.trim().toLowerCase();
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!correo || !re.test(correo)) {
      this.invitarError = 'Ingresa un correo válido.';
      return;
    }

    this.invitando = true;
    try {
      const resp = await this.invitaciones$.crear(correo);
      this.invitacionRecienCreada = resp;
      this.invitarCorreo = '';
      await this.recargarInvitaciones();
    } catch (err: any) {
      this.invitarError = (err && err.message) || 'No se pudo enviar la invitación.';
    } finally {
      this.invitando = false;
    }
  }

  async copiarLink(): Promise<void> {
    if (!this.invitacionRecienCreada || !this.invitacionRecienCreada.link) return;
    try {
      await navigator.clipboard.writeText(this.invitacionRecienCreada.link);
    } catch (e) {
      // si el navegador no permite clipboard, no es crítico
    }
  }

  // -------------------- LISTAR --------------------

  async recargarInvitaciones(): Promise<void> {
    this.errorLista = '';
    this.cargandoLista = true;
    try {
      this.invitaciones = await this.invitaciones$.listar();
    } catch (err: any) {
      this.errorLista = (err && err.message) || 'No se pudo cargar la lista.';
      this.invitaciones = [];
    } finally {
      this.cargandoLista = false;
    }
  }

  badgeColor(estado: string): string {
    switch (estado) {
      case 'PENDIENTE':
        return 'warning';
      case 'COMPLETADA':
        return 'success';
      case 'EXPIRADA':
        return 'danger';
      case 'REENVIADA':
        return 'medium';
      default:
        return 'medium';
    }
  }

  badgeIcon(estado: string): string {
    switch (estado) {
      case 'PENDIENTE':
        return 'time-outline';
      case 'COMPLETADA':
        return 'checkmark-circle';
      case 'EXPIRADA':
        return 'close-circle';
      case 'REENVIADA':
        return 'refresh-outline';
      default:
        return 'time-outline';
    }
  }

  formatoFecha(fecha: string | null | undefined): string {
    if (!fecha) return '—';
    try {
      const d = new Date(fecha);
      return d.toLocaleString('es-CL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return fecha;
    }
  }
}
