import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonButton, IonIcon, IonList, IonItem, IonLabel, IonBadge, IonText, IonSpinner,
  IonRefresher, IonRefresherContent,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { documentTextOutline, chevronForwardOutline, helpCircleOutline } from 'ionicons/icons';

import { EvaluacionService, AplicacionActiva } from '../../services/evaluacion.service';
import { ordenarAplicaciones } from '../../../shared/orden-tests.util';

@Component({
  selector: 'app-estudiante-tests',
  templateUrl: './estudiante-tests.page.html',
  styleUrls: ['./estudiante-tests.page.scss'],
  standalone: true,
  imports: [
    CommonModule, IonContent, IonHeader, IonToolbar, IonTitle, IonButtons,
    IonBackButton, IonButton, IonIcon, IonList, IonItem, IonLabel, IonBadge,
    IonText, IonSpinner, IonRefresher, IonRefresherContent,
  ],
})
export class EstudianteTestsPage implements OnInit {
  cursoId: number | null = null;
  aplicaciones: AplicacionActiva[] = [];
  cargando = true;
  error: string | null = null;

  // Frescura de datos (pedido cliente 2026-06-01): que un test recién publicado
  // por el profesor aparezca solo, sin que el alumno tenga que salir y volver.
  //  - sondeo suave mientras la página está visible
  //  - refresco al volver la app a primer plano (visibilitychange)
  //  - pull-to-refresh manual (ver doRefresh)
  private pollId: any = null;
  private inFlight = false;
  private readonly POLL_MS = 25000;
  private onVisible = (): void => {
    if (document.visibilityState === 'visible') { void this.cargar(true); }
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private evalSvc: EvaluacionService
  ) {
    addIcons({ documentTextOutline, chevronForwardOutline, helpCircleOutline });
  }

  /**
   * ngOnInit captura el cursoId de la URL una sola vez.
   * La carga de datos va en ionViewWillEnter para refrescar al volver.
   */
  ngOnInit(): void {
    this.cursoId = Number(this.route.snapshot.paramMap.get('cursoId'));
  }

  /** Entrar a la página: carga + activa refresco automático. */
  ionViewWillEnter(): void {
    if (this.cursoId) { void this.cargar(); }
    document.addEventListener('visibilitychange', this.onVisible);
    this.pollId = setInterval(() => { void this.cargar(true); }, this.POLL_MS);
  }

  /** Salir de la página: detiene el sondeo y los listeners (no gasta batería/red). */
  ionViewWillLeave(): void {
    document.removeEventListener('visibilitychange', this.onVisible);
    if (this.pollId) { clearInterval(this.pollId); this.pollId = null; }
  }

  /**
   * @param silencioso true = refresco en segundo plano: no muestra el spinner de
   *   pantalla completa ni borra la lista actual (evita parpadeo en cada sondeo).
   */
  async cargar(silencioso = false): Promise<void> {
    if (!this.cursoId) { this.error = 'Curso inválido'; this.cargando = false; return; }
    if (this.inFlight) return; // evita fetches solapados (sondeo + manual)
    this.inFlight = true;
    if (!silencioso) { this.cargando = true; this.error = null; }
    try {
      const apls = await this.evalSvc.aplicacionesActivas(this.cursoId);
      // Orden híbrido: orden manual del profesor y, si no, nombre natural
      // ("Nivel 1, 2, … 10"). Mismo criterio que ve el profesor.
      this.aplicaciones = ordenarAplicaciones(apls);
      this.error = null;
    } catch (e: any) {
      // En refresco silencioso ignoramos errores transitorios (mantenemos la
      // lista que ya se ve); solo mostramos error en cargas explícitas.
      if (!silencioso) { this.error = e?.message || 'No se pudieron cargar las evaluaciones'; }
    } finally {
      this.inFlight = false;
      this.cargando = false;
    }
  }

  /** Pull-to-refresh: refresca y cierra el spinner del refresher. */
  async doRefresh(ev: any): Promise<void> {
    await this.cargar(true);
    ev.target.complete();
  }

  comenzar(a: AplicacionActiva): void {
    this.router.navigateByUrl(`/estudiante/inicio/${a.aplicacion_id}`);
  }
}
