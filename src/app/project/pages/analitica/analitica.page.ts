import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonButton, IonIcon, IonSpinner, IonNote, IonChip, IonLabel, IonText,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  refreshOutline, statsChartOutline, sparklesOutline, peopleOutline,
  eyeOutline, eyeOffOutline, arrowForwardOutline,
} from 'ionicons/icons';

import { AnaliticaService, AnaliticaResumen } from '../../services/analitica.service';

@Component({
  selector: 'app-analitica',
  templateUrl: './analitica.page.html',
  styleUrls: ['./analitica.page.scss'],
  standalone: true,
  imports: [
    CommonModule, IonContent, IonHeader, IonToolbar, IonTitle, IonButtons,
    IonBackButton, IonButton, IonIcon, IonSpinner, IonNote, IonChip, IonLabel, IonText,
  ],
})
export class AnaliticaPage implements OnInit {
  items: AnaliticaResumen[] = [];
  cargando = false;
  error = '';

  constructor(private analiticaSvc: AnaliticaService, private router: Router) {
    addIcons({
      refreshOutline, statsChartOutline, sparklesOutline, peopleOutline,
      eyeOutline, eyeOffOutline, arrowForwardOutline,
    });
  }

  ngOnInit(): void { this.recargar(); }

  async recargar(): Promise<void> {
    this.error = '';
    this.cargando = true;
    try {
      this.items = await this.analiticaSvc.resumen();
    } catch (err: any) {
      this.error = (err && err.message) || 'No se pudo cargar la analítica.';
      this.items = [];
    } finally {
      this.cargando = false;
    }
  }

  abrir(a: AnaliticaResumen): void {
    this.router.navigateByUrl(`/analitica/${a.aplicacion_id}`);
  }

  pct(v: number | null): string {
    if (v == null) return '—';
    return `${Number(v).toFixed(1)}%`;
  }

  colorPct(v: number | null): string {
    if (v == null) return 'medium';
    if (v >= 70) return 'success';
    if (v >= 50) return 'warning';
    return 'danger';
  }
}
