import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonButton, IonIcon, IonItem, IonLabel, IonSelect, IonSelectOption,
  IonText, IonSpinner, IonNote, IonChip,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  saveOutline, checkmarkCircle, clipboardOutline, schoolOutline,
  alertCircleOutline,
} from 'ionicons/icons';

import { TestService, TestResumen } from '../../services/test.service';
import { CursoService, CursoResumen } from '../../services/curso.service';
import { AplicacionService } from '../../services/aplicacion.service';

@Component({
  selector: 'app-aplicacion-nueva',
  templateUrl: './aplicacion-nueva.page.html',
  styleUrls: ['./aplicacion-nueva.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonHeader, IonToolbar, IonTitle,
    IonButtons, IonBackButton, IonButton, IonIcon, IonItem, IonLabel,
    IonSelect, IonSelectOption, IonText, IonSpinner, IonNote, IonChip,
  ],
})
export class AplicacionNuevaPage implements OnInit {
  testId: number | null = null;
  cursoId: number | null = null;

  tests: TestResumen[] = [];
  cursos: CursoResumen[] = [];

  /** Si se llegó desde /curso/:id → "Aplicar test", precargamos y al guardar volvemos. */
  cursoIdPreseleccionado: number | null = null;
  /** Datos del curso preseleccionado (para mostrar como contexto fijo). */
  cursoContexto: CursoResumen | null = null;

  cargando = false;
  guardando = false;
  errorMsg = '';
  okMsg = '';

  constructor(
    private testSvc: TestService,
    private cursoSvc: CursoService,
    private aplSvc: AplicacionService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    addIcons({
      saveOutline, checkmarkCircle, clipboardOutline, schoolOutline,
      alertCircleOutline,
    });
  }

  async ngOnInit(): Promise<void> {
    // Si veniste desde /curso/:id con ?cursoId=N, preseleccionamos
    const qpCurso = Number(this.route.snapshot.queryParamMap.get('cursoId'));
    if (Number.isInteger(qpCurso) && qpCurso > 0) {
      this.cursoIdPreseleccionado = qpCurso;
      this.cursoId = qpCurso;
    }

    this.cargando = true;
    try {
      this.tests = await this.testSvc.listar();
    } catch { this.tests = []; }
    try {
      this.cursos = await this.cursoSvc.listarMisCursos();
      // Si hay contexto, resolver el nombre/código para el chip
      if (this.cursoIdPreseleccionado != null) {
        this.cursoContexto = this.cursos.find(
          (c) => c.curso_id === this.cursoIdPreseleccionado
        ) || null;
      }
    } catch { this.cursos = []; }
    this.cargando = false;
  }

  get vieneDeCurso(): boolean {
    return this.cursoIdPreseleccionado != null;
  }

  async guardar(): Promise<void> {
    this.errorMsg = '';
    this.okMsg = '';
    if (!this.testId) {
      this.errorMsg = 'Selecciona un test.';
      return;
    }
    if (!this.cursoId) {
      this.errorMsg = 'Selecciona un curso.';
      return;
    }
    const sel = this.tests.find((t) => t.test_id === this.testId);
    if (sel && (sel.cantidad_preguntas || 0) === 0) {
      this.errorMsg = 'Ese test no tiene preguntas. Agrégale preguntas antes de aplicarlo a un curso.';
      return;
    }
    this.guardando = true;
    try {
      const resp = await this.aplSvc.crear({
        testId: this.testId,
        cursoId: this.cursoId,
      });
      this.okMsg = `Aplicación #${resp.aplicacion_id} creada.`;
      const destino = this.cursoIdPreseleccionado
        ? `/curso/${this.cursoIdPreseleccionado}`
        : '/mis-aplicaciones';
      setTimeout(
        () => this.router.navigateByUrl(destino, { replaceUrl: true }),
        1200
      );
    } catch (e: any) {
      this.errorMsg = (e && e.message) || 'No se pudo crear la aplicación.';
    } finally {
      this.guardando = false;
    }
  }
}
