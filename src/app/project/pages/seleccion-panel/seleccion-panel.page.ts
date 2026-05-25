import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonText,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  shieldCheckmarkOutline,
  schoolOutline,
  logOutOutline,
} from 'ionicons/icons';

import { AuthService, UsuarioSesion } from '../../services/auth.service';

/**
 * RF-56: cuando el usuario autenticado tiene rol SUPERADMIN + PROFESOR,
 * le presentamos esta pantalla para que elija con qué panel trabajar.
 */
@Component({
  selector: 'app-seleccion-panel',
  templateUrl: './seleccion-panel.page.html',
  styleUrls: ['./seleccion-panel.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonCard,
    IonCardContent,
    IonText,
  ],
})
export class SeleccionPanelPage implements OnInit {
  usuario: UsuarioSesion | null = null;

  constructor(private auth: AuthService, private router: Router) {
    addIcons({ shieldCheckmarkOutline, schoolOutline, logOutOutline });
  }

  async ngOnInit(): Promise<void> {
    this.usuario = await this.auth.getUsuario();
    // Si por alguna razón llega acá sin tener ambos roles, lo reenviamos
    if (this.usuario) {
      const roles = this.usuario.roles || [];
      const dual =
        roles.includes('SUPERADMIN') && roles.includes('PROFESOR');
      if (!dual) {
        this.router.navigateByUrl(this.auth.rutaDestinoSegunRoles(roles), {
          replaceUrl: true,
        });
      }
    }
  }

  async irAAdmin(): Promise<void> {
    await this.auth.setPanelActual('ADMIN');
    this.router.navigateByUrl('/panel-admin', { replaceUrl: true });
  }

  async irADocente(): Promise<void> {
    await this.auth.setPanelActual('DOCENTE');
    this.router.navigateByUrl('/panel-docente', { replaceUrl: true });
  }

  async cerrarSesion(): Promise<void> {
    await this.auth.logout();
  }
}
