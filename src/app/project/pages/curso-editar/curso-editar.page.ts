import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonButton, IonIcon, IonInput, IonTextarea, IonText, IonSpinner, IonNote,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  saveOutline, createOutline, checkmarkCircle, alertCircleOutline,
} from 'ionicons/icons';

import { CursoService } from '../../services/curso.service';

@Component({
  selector: 'app-curso-editar',
  templateUrl: './curso-editar.page.html',
  styleUrls: ['./curso-editar.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonHeader, IonToolbar, IonTitle,
    IonButtons, IonBackButton, IonButton, IonIcon, IonInput,
    IonTextarea, IonText, IonSpinner, IonNote,
  ],
})
export class CursoEditarPage implements OnInit {
  cursoId = 0;
  codigo = '';
  nombre = '';
  descripcion = '';

  cargandoInicial = true;
  guardando = false;
  errorCarga = '';
  errorMsg = '';
  okMsg = '';

  constructor(
    private cursoSvc: CursoService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    addIcons({ saveOutline, createOutline, checkmarkCircle, alertCircleOutline });
  }

  async ngOnInit(): Promise<void> {
    this.cursoId = Number(this.route.snapshot.paramMap.get('cursoId'));
    if (!Number.isInteger(this.cursoId) || this.cursoId <= 0) {
      this.errorCarga = 'ID de curso inválido.';
      this.cargandoInicial = false;
      return;
    }
    try {
      const c = await this.cursoSvc.obtenerConAplicaciones(this.cursoId);
      this.codigo = c.codigo;
      this.nombre = c.nombre;
      this.descripcion = c.descripcion || '';
    } catch (err: any) {
      this.errorCarga = (err && err.message) || 'No se pudo cargar el curso.';
    } finally {
      this.cargandoInicial = false;
    }
  }

  get formularioCompleto(): boolean {
    return !!this.codigo.trim() && !!this.nombre.trim();
  }

  async guardar(): Promise<void> {
    this.errorMsg = '';
    this.okMsg = '';
    if (!this.formularioCompleto) {
      this.errorMsg = 'Código y nombre son obligatorios.';
      return;
    }
    this.guardando = true;
    try {
      await this.cursoSvc.editar(this.cursoId, {
        codigo: this.codigo.trim().toUpperCase(),
        nombre: this.nombre.trim(),
        descripcion: this.descripcion.trim() || null,
      });
      this.okMsg = 'Curso actualizado.';
      setTimeout(
        () => this.router.navigateByUrl(`/curso/${this.cursoId}`, { replaceUrl: true }),
        1000
      );
    } catch (e: any) {
      this.errorMsg = (e && e.message) || 'No se pudo guardar.';
    } finally {
      this.guardando = false;
    }
  }
}
