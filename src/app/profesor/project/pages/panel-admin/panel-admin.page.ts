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
  AlertController,
  ToastController,
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
  keyOutline,
  mailOutline,
  sendOutline,
  refreshOutline,
  copyOutline,
  checkmarkCircle,
  timeOutline,
  closeCircle,
  trashOutline,
  arrowUndoOutline,
} from 'ionicons/icons';

import { AuthService, UsuarioSesion } from '../../services/auth.service';
import {
  InvitacionService,
  InvitacionResumen,
  CrearInvitacionResp,
} from '../../services/invitacion.service';
import { UsuarioService, UsuarioAdmin } from '../../services/usuario.service';

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

  // Listado de invitaciones
  invitaciones: InvitacionResumen[] = [];
  cargandoLista = false;
  errorLista = '';

  // Listado de usuarios
  usuarios: UsuarioAdmin[] = [];
  cargandoUsuarios = false;
  errorUsuarios = '';

  constructor(
    private auth: AuthService,
    private router: Router,
    private invitaciones$: InvitacionService,
    private usuarios$: UsuarioService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {
    addIcons({
      logOutOutline,
      schoolOutline,
      peopleOutline,
      bookOutline,
      analyticsOutline,
      shieldCheckmarkOutline,
      swapHorizontalOutline,
      keyOutline,
      mailOutline,
      sendOutline,
      refreshOutline,
      copyOutline,
      checkmarkCircle,
      timeOutline,
      closeCircle,
      trashOutline,
      arrowUndoOutline,
    });
  }

  async ngOnInit(): Promise<void> {
    this.usuario = await this.auth.getUsuario();
    this.tieneRolProfesor = await this.auth.hasRol('PROFESOR');
    await this.auth.setPanelActual('ADMIN');
    await this.recargarInvitaciones();
    await this.cargarUsuarios();
  }

  async cambiarPanel(): Promise<void> {
    this.router.navigateByUrl('/seleccion-panel');
  }

  irACambiarPassword(): void {
    this.router.navigateByUrl('/cambiar-password');
  }

  // ==================== GESTIÓN DE USUARIOS ====================

  async cargarUsuarios(): Promise<void> {
    this.cargandoUsuarios = true;
    this.errorUsuarios = '';
    try {
      this.usuarios = await this.usuarios$.listar();
    } catch (e: any) {
      this.errorUsuarios = e?.message || 'No se pudieron cargar los usuarios.';
    } finally {
      this.cargandoUsuarios = false;
    }
  }

  /** True si la fila corresponde a la cuenta del propio admin logueado. */
  esYo(u: UsuarioAdmin): boolean {
    return !!this.usuario && u.usuario_id === this.usuario.usuario_id;
  }

  async confirmarEliminarUsuario(u: UsuarioAdmin): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: '¿Eliminar usuario?',
      message: `"${u.nombre}" (${u.correo}) quedará desactivado y no podrá iniciar sesión. Sus datos se conservan; puedes reactivarlo después.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', role: 'destructive', handler: () => this.ejecutarEliminar(u) },
      ],
    });
    await alert.present();
  }

  private async ejecutarEliminar(u: UsuarioAdmin): Promise<void> {
    try {
      await this.usuarios$.eliminar(u.usuario_id);
      await this.toast('Usuario eliminado.', 'success');
      await this.cargarUsuarios();
    } catch (e: any) {
      await this.toast(e?.message || 'No se pudo eliminar.', 'danger');
    }
  }

  async reactivarUsuario(u: UsuarioAdmin): Promise<void> {
    try {
      await this.usuarios$.reactivar(u.usuario_id);
      await this.toast('Usuario reactivado.', 'success');
      await this.cargarUsuarios();
    } catch (e: any) {
      await this.toast(e?.message || 'No se pudo reactivar.', 'danger');
    }
  }

  private async toast(message: string, color: 'success' | 'danger'): Promise<void> {
    const t = await this.toastCtrl.create({ message, duration: 2500, color });
    await t.present();
  }

  private escapar(s: string): string {
    return (s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
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
