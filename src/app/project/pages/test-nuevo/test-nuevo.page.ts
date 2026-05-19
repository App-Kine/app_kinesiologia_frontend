import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonButton, IonIcon, IonItem, IonLabel, IonInput, IonTextarea,
  IonSelect, IonSelectOption, IonCheckbox, IonText, IonSpinner, IonNote,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  saveOutline, shuffleOutline, listOutline, checkmarkCircle,
  documentTextOutline, alertCircleOutline,
} from 'ionicons/icons';

import { TestService } from '../../services/test.service';
import { CursoService, CursoResumen } from '../../services/curso.service';

@Component({
  selector: 'app-test-nuevo',
  templateUrl: './test-nuevo.page.html',
  styleUrls: ['./test-nuevo.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonHeader, IonToolbar, IonTitle,
    IonButtons, IonBackButton, IonButton, IonIcon, IonItem, IonLabel, IonInput,
    IonTextarea, IonSelect, IonSelectOption, IonCheckbox, IonText, IonSpinner, IonNote,
  ],
})
export class TestNuevoPage implements OnInit {
  // Datos del test
  nombre = '';
  descripcion = '';
  ordenAleatorio = false;
  cursoOrigenId: number | null = null;

  // Catálogos
  cursos: CursoResumen[] = [];

  // Estado
  cargando = false;
  guardando = false;
  errorMsg = '';
  okMsg = '';

  constructor(
    private testSvc: TestService,
    private cursoSvc: CursoService,
    private router: Router
  ) {
    addIcons({
      saveOutline, shuffleOutline, listOutline, checkmarkCircle,
      documentTextOutline, alertCircleOutline,
    });
  }

  async ngOnInit(): Promise<void> {
    this.cargando = true;
    try {
      this.cursos = await this.cursoSvc.listarMisCursos();
    } catch {
      this.cursos = [];
    } finally {
      this.cargando = false;
    }
  }

  async guardar(): Promise<void> {
    this.errorMsg = '';
    this.okMsg = '';
    if (!this.nombre.trim()) {
      this.errorMsg = 'Ingresa un nombre para el test.';
      return;
    }
    this.guardando = true;
    try {
      const resp = await this.testSvc.crear({
        nombre: this.nombre.trim(),
        descripcion: this.descripcion.trim() || null,
        ordenAleatorio: this.ordenAleatorio,
        cursoOrigenId: this.cursoOrigenId,
        preguntas: [], // Test vacío, las preguntas se agregan en test-detalle
      });
      this.okMsg = `Test #${resp.test_id} creado. Ahora agrega las preguntas...`;
      // Redirigir al detalle para empezar a agregar preguntas
      setTimeout(
        () => this.router.navigateByUrl(`/test-detalle/${resp.test_id}`, { replaceUrl: true }),
        1000
      );
    } catch (e: any) {
      this.errorMsg = (e && e.message) || 'No se pudo crear el test.';
    } finally {
      this.guardando = false;
    }
  }
}
