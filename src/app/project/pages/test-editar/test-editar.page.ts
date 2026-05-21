import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonButton, IonIcon, IonItem, IonTextarea, IonCheckbox, IonText,
  IonSpinner, IonNote,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  saveOutline, createOutline, checkmarkCircle, alertCircleOutline,
  shuffleOutline, listOutline,
} from 'ionicons/icons';

import { TestService } from '../../services/test.service';

@Component({
  selector: 'app-test-editar',
  templateUrl: './test-editar.page.html',
  styleUrls: ['./test-editar.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonHeader, IonToolbar, IonTitle,
    IonButtons, IonBackButton, IonButton, IonIcon, IonItem,
    IonTextarea, IonCheckbox, IonText, IonSpinner, IonNote,
  ],
})
export class TestEditarPage implements OnInit {
  testId = 0;
  nombre = '';
  descripcion = '';
  ordenAleatorio = false;

  cargandoInicial = true;
  guardando = false;
  errorCarga = '';
  errorMsg = '';
  okMsg = '';

  constructor(
    private testSvc: TestService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    addIcons({
      saveOutline, createOutline, checkmarkCircle, alertCircleOutline,
      shuffleOutline, listOutline,
    });
  }

  async ngOnInit(): Promise<void> {
    this.testId = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(this.testId) || this.testId <= 0) {
      this.errorCarga = 'ID de test inválido.';
      this.cargandoInicial = false;
      return;
    }
    try {
      const t = await this.testSvc.obtener(this.testId);
      this.nombre = t.nombre;
      this.descripcion = t.descripcion || '';
      this.ordenAleatorio = !!t.orden_aleatorio;
    } catch (err: any) {
      this.errorCarga = (err && err.message) || 'No se pudo cargar el test.';
    } finally {
      this.cargandoInicial = false;
    }
  }

  get formularioCompleto(): boolean {
    return !!this.nombre.trim();
  }

  async guardar(): Promise<void> {
    this.errorMsg = '';
    this.okMsg = '';
    if (!this.formularioCompleto) {
      this.errorMsg = 'El nombre es obligatorio.';
      return;
    }
    this.guardando = true;
    try {
      await this.testSvc.editar(this.testId, {
        nombre: this.nombre.trim(),
        descripcion: this.descripcion.trim() || null,
        ordenAleatorio: this.ordenAleatorio,
      });
      this.okMsg = 'Test actualizado.';
      setTimeout(
        () => this.router.navigateByUrl(`/test-detalle/${this.testId}`, { replaceUrl: true }),
        1000
      );
    } catch (e: any) {
      this.errorMsg = (e && e.message) || 'No se pudo guardar.';
    } finally {
      this.guardando = false;
    }
  }
}
