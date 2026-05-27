import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonButton, IonIcon, IonSpinner, IonNote, IonChip, IonLabel, IonText,
  IonSegment, IonSegmentButton,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  refreshOutline, statsChartOutline, alertCircleOutline, peopleOutline,
  eyeOutline, eyeOffOutline, trendingUpOutline, listOutline, helpCircleOutline,
} from 'ionicons/icons';

import { AnaliticaService, AnaliticaDetalle } from '../../services/analitica.service';

@Component({
  selector: 'app-analitica-detalle',
  templateUrl: './analitica-detalle.page.html',
  styleUrls: ['./analitica-detalle.page.scss'],
  standalone: true,
  imports: [
    CommonModule, IonContent, IonHeader, IonToolbar, IonTitle, IonButtons,
    IonBackButton, IonButton, IonIcon, IonSpinner, IonNote, IonChip, IonLabel,
    IonText, IonSegment, IonSegmentButton,
  ],
})
export class AnaliticaDetallePage implements OnInit {
  aplicacionId = 0;
  data: AnaliticaDetalle | null = null;
  cargando = false;
  error = '';
  vista: 'preguntas' | 'estudiantes' = 'preguntas';

  constructor(
    private analiticaSvc: AnaliticaService,
    private route: ActivatedRoute
  ) {
    addIcons({
      refreshOutline, statsChartOutline, alertCircleOutline, peopleOutline,
      eyeOutline, eyeOffOutline, trendingUpOutline, listOutline, helpCircleOutline,
    });
  }

  async ngOnInit(): Promise<void> {
    this.aplicacionId = Number(this.route.snapshot.paramMap.get('aplicacionId'));
    if (!Number.isInteger(this.aplicacionId) || this.aplicacionId <= 0) {
      this.error = 'ID de aplicación inválido.';
      return;
    }
    await this.recargar();
  }

  async recargar(): Promise<void> {
    this.error = '';
    this.cargando = true;
    try {
      this.data = await this.analiticaSvc.detalle(this.aplicacionId);
    } catch (err: any) {
      this.error = (err && err.message) || 'No se pudo cargar la analítica.';
      this.data = null;
    } finally {
      this.cargando = false;
    }
  }

  cambiarVista(ev: any): void {
    this.vista = ev.detail.value;
  }

  pct(v: number | null | undefined): string {
    if (v == null) return '—';
    return `${Number(v).toFixed(1)}%`;
  }

  pctTasaError(v: number): string {
    return `${(Number(v) * 100).toFixed(0)}%`;
  }

  colorPct(v: number | null | undefined): string {
    if (v == null) return 'medium';
    if (v >= 70) return 'success';
    if (v >= 50) return 'warning';
    return 'danger';
  }

  colorTasaError(v: number): string {
    const p = Number(v) * 100;
    if (p >= 50) return 'danger';
    if (p >= 25) return 'warning';
    return 'success';
  }

  formatoFecha(f: string | null): string {
    if (!f) return '—';
    try {
      return new Date(f).toLocaleString('es-CL', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return f; }
  }

  /**
   * Formatea segundos a "Xm Ys" o "Ys" (pedido cliente 2026-05-26).
   */
  fmtSeg(s: number | null | undefined): string {
    if (s == null) return '—';
    const seg = Math.round(Number(s));
    if (seg < 60) return `${seg}s`;
    const m = Math.floor(seg / 60);
    const r = seg % 60;
    return r === 0 ? `${m}m` : `${m}m ${r}s`;
  }

  /**
   * Para la vista por estudiante identificado: agrupa los tiempos individuales
   * por evaluación, devolviendo [{evaluacion_id, correo, pregs: [...]}].
   * Solo incluye estudiantes identificados (los anónimos van como promedio
   * agregado en la vista "Por pregunta").
   */
  get tiemposPorEstudiante(): Array<{
    evaluacion_id: number;
    correo: string;
    pregs: Array<{ orden: number; tiempo: number; resultado: string | null }>;
  }> {
    if (!this.data) return [];
    const map: Record<string, { evaluacion_id: number; correo: string; pregs: any[] }> = {};
    for (const t of this.data.tiempos_identificados || []) {
      const key = String(t.evaluacion_id);
      if (!map[key]) {
        map[key] = {
          evaluacion_id: t.evaluacion_id,
          correo: t.correo_estudiante || '—',
          pregs: [],
        };
      }
      map[key].pregs.push({
        orden: t.orden_presentacion,
        tiempo: t.tiempo_segundos,
        resultado: t.resultado,
      });
    }
    return Object.values(map).map((e) => ({
      ...e,
      pregs: e.pregs.sort((a, b) => a.orden - b.orden),
    }));
  }
}
