import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonList,
  IonCheckbox,
  IonToggle,
  IonText,
  IonSpinner,
  IonNote,
  IonReorder,
  IonReorderGroup,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { saveOutline, shuffleOutline, reorderThreeOutline } from 'ionicons/icons';

import { TestService } from '../../services/test.service';
import { PreguntaService, PreguntaResumen } from '../../services/pregunta.service';
import { CursoService, CursoResumen } from '../../services/curso.service';

@Component({
  selector: 'app-crear-test',
  templateUrl: './crear-test.page.html',
  styleUrls: ['./crear-test.page.scss'],
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
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonList,
    IonCheckbox,
    IonToggle,
    IonText,
    IonSpinner,
    IonNote,
    IonReorder,
    IonReorderGroup,
  ],
})
export class CrearTestPage implements OnInit {
  nombre = '';
  descripcion = '';
  ordenAleatorio = false;
  cursoOrigenId: number | null = null;

  cursos: CursoResumen[] = [];
  preguntasDisponibles: PreguntaResumen[] = [];
  preguntasSeleccionadas: PreguntaResumen[] = [];

  cargando = true;
  guardando = false;

  constructor(
    private testService: TestService,
    private preguntaService: PreguntaService,
    private cursoService: CursoService,
    private router: Router,
    private toastCtrl: ToastController
  ) {
    addIcons({ saveOutline, shuffleOutline, reorderThreeOutline });
  }

  async ngOnInit(): Promise<void> {
    this.cargando = true;
    try {
      const [cursos, preguntas] = await Promise.all([
        this.cursoService.listar(),
        this.preguntaService.listar(),
      ]);
      this.cursos = cursos;
      this.preguntasDisponibles = preguntas;
    } catch (e: any) {
      await this.mostrarToast(
        e?.message || 'Error al cargar datos iniciales',
        'danger'
      );
    } finally {
      this.cargando = false;
    }
  }

  estaSeleccionada(p: PreguntaResumen): boolean {
    return this.preguntasSeleccionadas.some(
      (x) => x.pregunta_id === p.pregunta_id
    );
  }

  togglePregunta(p: PreguntaResumen): void {
    const idx = this.preguntasSeleccionadas.findIndex(
      (x) => x.pregunta_id === p.pregunta_id
    );
    if (idx >= 0) {
      this.preguntasSeleccionadas.splice(idx, 1);
    } else {
      this.preguntasSeleccionadas.push(p);
    }
  }

  reordenar(ev: CustomEvent<any>): void {
    this.preguntasSeleccionadas = ev.detail.complete(
      this.preguntasSeleccionadas
    );
  }

  private validar(): string | null {
    if (!this.nombre.trim()) return 'Nombre del test requerido';
    if (this.preguntasSeleccionadas.length === 0)
      return 'Selecciona al menos 1 pregunta';
    return null;
  }

  async guardar(): Promise<void> {
    const err = this.validar();
    if (err) {
      await this.mostrarToast(err, 'warning');
      return;
    }

    this.guardando = true;
    try {
      const resp = await this.testService.crear({
        nombre: this.nombre.trim(),
        descripcion: this.descripcion.trim() || null,
        ordenAleatorio: this.ordenAleatorio,
        cursoOrigenId: this.cursoOrigenId || null,
        preguntas: this.preguntasSeleccionadas.map((p, i) => ({
          preguntaId: p.pregunta_id,
          orden: i + 1,
        })),
      });
      await this.mostrarToast(`Test #${resp.test_id} creado`, 'success');
      this.router.navigateByUrl('/tests');
    } catch (e: any) {
      await this.mostrarToast(
        e?.message || 'Error al crear el test',
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
    const t = await this.toastCtrl.create({ message, duration: 3000, color });
    await t.present();
  }
}
