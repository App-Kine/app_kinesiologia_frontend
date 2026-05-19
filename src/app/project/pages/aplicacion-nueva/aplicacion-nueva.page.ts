import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonButton, IonIcon, IonItem, IonLabel, IonSelect, IonSelectOption,
  IonText, IonSpinner, IonNote,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { saveOutline, checkmarkCircle, clipboardOutline } from 'ionicons/icons';

import { TestService, TestResumen } from '../../services/test.service';
import { CursoService, Curso } from '../../services/curso.service';
import { AplicacionService } from '../../services/aplicacion.service';

@Component({
  selector: 'app-aplicacion-nueva',
  templateUrl: './aplicacion-nueva.page.html',
  styleUrls: ['./aplicacion-nueva.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonHeader, IonToolbar, IonTitle,
    IonButtons, IonBackButton, IonButton, IonIcon, IonItem, IonLabel,
    IonSelect, IonSelectOption, IonText, IonSpinner, IonNote,
  ],
})
export class AplicacionNuevaPage implements OnInit {
  testId: number | null = null;
  cursoId: number | null = null;

  tests: TestResumen[] = [];
  cursos: Curso[] = [];

  cargando = false;
  guardando = false;
  errorMsg = '';
  okMsg = '';

  constructor(
    private testSvc: TestService,
    private cursoSvc: CursoService,
    private aplSvc: AplicacionService,
    private router: Router
  ) {
    addIcons({ saveOutline, checkmarkCircle, clipboardOutline });
  }

  async ngOnInit(): Promise<void> {
    this.cargando = true;
    try {
      this.tests = await this.testSvc.listar();
    } catch { this.tests = []; }
    try {
      this.cursos = await this.cursoSvc.misCursos();
    } catch { this.cursos = []; }
    this.cargando = false;
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
    this.guardando = true;
    try {
      const resp = await this.aplSvc.crear({
        testId: this.testId,
        cursoId: this.cursoId,
      });
      this.okMsg = `Aplicación #${resp.aplicacion_id} creada.`;
      setTimeout(() => this.router.navigateByUrl('/mis-aplicaciones'), 1200);
    } catch (e: any) {
      this.errorMsg = (e && e.message) || 'No se pudo crear la aplicación.';
    } finally {
      this.guardando = false;
    }
  }
}
