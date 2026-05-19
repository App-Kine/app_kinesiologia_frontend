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
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  logOutOutline,
  helpCircleOutline,
  documentTextOutline,
  clipboardOutline,
  statsChartOutline,
  schoolOutline,
  swapHorizontalOutline,
} from 'ionicons/icons';

import { AuthService, UsuarioSesion } from '../../services/auth.service';

@Component({
  selector: 'app-panel-docente',
  templateUrl: './panel-docente.page.html',
  styleUrls: ['./panel-docente.page.scss'],
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
  ],
})
export class PanelDocentePage implements OnInit {
  usuario: UsuarioSesion | null = null;
  tieneRolAdmin = false;

  constructor(private auth: AuthService, private router: Router) {
    addIcons({
      logOutOutline,
      helpCircleOutline,
      documentTextOutline,
      clipboardOutline,
      statsChartOutline,
      schoolOutline,
      swapHorizontalOutline,
    });
  }

  async ngOnInit(): Promise<void> {
    this.usuario = await this.auth.getUsuario();
    this.tieneRolAdmin = await this.auth.hasRol('SUPERADMIN');
    await this.auth.setPanelActual('DOCENTE');
  }

  async cambiarPanel(): Promise<void> {
    this.router.navigateByUrl('/seleccion-panel');
  }

  async cerrarSesion(): Promise<void> {
    await this.auth.logout();
  }
}
