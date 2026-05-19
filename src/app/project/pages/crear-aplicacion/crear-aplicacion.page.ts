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
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonList,
  IonText,
  IonSpinner,
  IonNote,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { saveOutline } from 'ionicons/icons';

import { AplicacionService } from '../../services/aplicacion.service';
import { TestService, TestResumen } from '../../services/test.service';
import { CursoService, CursoResumen } from '../../services/curso.service';
import { createLogger } from '../../services/logger';

const log = createLogger('crear-aplicacion');

@Component({
  selector: 'app-crear-aplicacion',
  templateUrl: './crear-aplicacion.page.html',
  styleUrls: ['./crear-aplicacion.page.scss'],
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
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonList,
    IonText,
    IonSpinner,
    IonNote,
  ],
})
export class CrearAplicacionPage implements OnInit {
  testId: number | null = null;
  cursoId: number | null = null;

  /** Cuando viene preseleccionado por queryParam (desde curso-detalle). */
  cursoPreseleccionado = false;
  cursoSeleccionado: CursoResumen | null = null;

  tests: TestResumen[] = [];
  cursos: CursoResumen[] = [];

  cargando = true;
  guardando = false;

  constructor(
    private aplicacionService: AplicacionService,
    private testService: TestService,
    private cursoService: CursoService,
    private router: Router,
    private route: ActivatedRoute,
    private toastCtrl: ToastController
  ) {
    addIcons({ saveOutline });
  }

  async ngOnInit(): Promise<void> {
    this.cargando = true;
    try {
      // Cursos del profesor (RF-71) + tests del banco
      const [tests, cursos] = await Promise.all([
        this.testService.listar(),
        this.cursoService.listarMisCursos(),
      ]);
      this.tests = tests;
      this.cursos = cursos;

      const cursoParam = Number(this.route.snapshot.queryParamMap.get('cursoId'));
      if (Number.isInteger(cursoParam) && cursoParam > 0) {
        const c = this.cursos.find((x) => x.curso_id === cursoParam);
        if (c) {
          this.cursoId = c.curso_id;
          this.cursoSeleccionado = c;
          this.cursoPreseleccionado = true;
        }
      }
    } catch (e: any) {
      log.error('ngOnInit', e);
      await this.mostrarToast(
        e?.message || 'Error al cargar tests/cursos',
        'danger'
      );
    } finally {
      this.cargando = false;
    }
  }

  async guardar(): Promise<void> {
    if (!this.testId) {
      await this.mostrarToast('Selecciona un test', 'warning');
      return;
    }
    if (!this.cursoId) {
      await this.mostrarToast('Selecciona un curso', 'warning');
      return;
    }

    this.guardando = true;
    try {
      const resp = await this.aplicacionService.crear({
        testId: this.testId,
        cursoId: this.cursoId,
      });
      await this.mostrarToast(
        `Aplicación #${resp.aplicacion_id} creada`,
        'success'
      );
      // Si vino desde un curso, volvemos a ese curso
      if (this.cursoPreseleccionado) {
        this.router.navigateByUrl(`/curso/${this.cursoId}`);
      } else {
        this.router.navigateByUrl('/aplicaciones');
      }
    } catch (e: any) {
      log.error('guardar', e);
      await this.mostrarToast(
        e?.message || 'Error al crear la aplicación',
        'danger'
      );
    } finally {
      this.guardando = false;
    }
  }

  private async mostrarToast(
    message: string,
    color: 'success' | 'danger' | 'warning'
  ): Promise<void> {
    const t = await this.toastCtrl.create({ message, duration: 3500, color });
    await t.present();
  }
}
