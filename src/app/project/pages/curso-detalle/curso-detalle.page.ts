import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonNote,
  IonBadge,
  IonText,
  IonSpinner,
  IonFab,
  IonFabButton,
  IonToggle,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, documentTextOutline, schoolOutline } from 'ionicons/icons';

import {
  AplicacionService,
  AplicacionResumen,
} from '../../services/aplicacion.service';
import { CursoService, CursoResumen } from '../../services/curso.service';
import { createLogger } from '../../services/logger';

const log = createLogger('curso-detalle');

@Component({
  selector: 'app-curso-detalle',
  templateUrl: './curso-detalle.page.html',
  styleUrls: ['./curso-detalle.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonNote,
    IonBadge,
    IonText,
    IonSpinner,
    IonFab,
    IonFabButton,
    IonToggle,
  ],
})
export class CursoDetallePage implements OnInit {
  cursoId: number | null = null;
  curso: CursoResumen | null = null;
  aplicaciones: AplicacionResumen[] = [];
  cargando = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cursoService: CursoService,
    private aplicacionService: AplicacionService,
    private toastCtrl: ToastController
  ) {
    addIcons({ add, documentTextOutline, schoolOutline });
  }

  async ngOnInit(): Promise<void> {
    const id = Number(this.route.snapshot.paramMap.get('cursoId'));
    if (!Number.isInteger(id) || id <= 0) {
      this.error = 'cursoId inválido en la ruta';
      this.cargando = false;
      return;
    }
    this.cursoId = id;
    await this.cargar();
  }

  ionViewWillEnter(): void {
    if (this.cursoId) this.cargar();
  }

  async cargar(): Promise<void> {
    if (!this.cursoId) return;
    this.cargando = true;
    this.error = null;
    try {
      // Cursos del profe + aplicaciones de este curso, en paralelo
      const [misCursos, apps] = await Promise.all([
        this.cursoService.listarMisCursos(),
        this.aplicacionService.listar(undefined, this.cursoId),
      ]);
      this.curso = misCursos.find((c) => c.curso_id === this.cursoId) || null;
      if (!this.curso) {
        this.error = 'No tienes acceso a este curso';
        this.aplicaciones = [];
        return;
      }
      this.aplicaciones = apps;
    } catch (e: any) {
      log.error('cargar', e);
      this.error = e?.message || 'Error al cargar el curso';
      await this.mostrarToast(this.error || 'Error', 'danger');
    } finally {
      this.cargando = false;
    }
  }

  async cambiarActivo(a: AplicacionResumen, nuevo: boolean): Promise<void> {
    const anterior = a.activo;
    a.activo = nuevo;
    try {
      await this.aplicacionService.setActivo(a.aplicacion_id, nuevo);
      await this.mostrarToast(
        nuevo ? 'Test activado en este curso' : 'Test desactivado',
        'success'
      );
    } catch (e: any) {
      a.activo = anterior;
      log.error('cambiarActivo', e);
      await this.mostrarToast(
        e?.message || 'No se pudo actualizar',
        'danger'
      );
    }
  }

  aplicarNuevoTest(): void {
    if (!this.cursoId) return;
    this.router.navigate(['/crear-aplicacion'], {
      queryParams: { cursoId: this.cursoId },
    });
  }

  private async mostrarToast(
    message: string,
    color: 'success' | 'danger' | 'warning'
  ): Promise<void> {
    const t = await this.toastCtrl.create({ message, duration: 2500, color });
    await t.present();
  }
}
