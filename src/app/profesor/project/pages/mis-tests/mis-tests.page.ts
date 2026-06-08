import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonButton, IonIcon, IonSpinner, IonNote, IonChip, IonLabel, IonText,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, refreshOutline, shuffleOutline, listOutline } from 'ionicons/icons';

import { TestService, TestResumen } from '../../services/test.service';

const TESTS_PAGE_SIZE = 20;

@Component({
  selector: 'app-mis-tests',
  templateUrl: './mis-tests.page.html',
  styleUrls: ['./mis-tests.page.scss'],
  standalone: true,
  imports: [
    CommonModule, IonContent, IonHeader, IonToolbar, IonTitle, IonButtons,
    IonBackButton, IonButton, IonIcon, IonSpinner, IonNote, IonChip, IonLabel, IonText,
  ],
})
export class MisTestsPage {
  tests: TestResumen[] = [];
  cargando = false;
  cargandoMas = false;
  error = '';

  // Paginación (escalabilidad): cargamos de a TESTS_PAGE_SIZE y vamos
  // agregando con "Cargar más" en vez de traer todo el banco de una.
  private page = 1;
  hasMore = false;

  constructor(private testSvc: TestService, private router: Router) {
    addIcons({ addOutline, refreshOutline, shuffleOutline, listOutline });
  }

  /**
   * Ionic lifecycle: corre cada vez que se ENTRA a la página, incluyendo al
   * volver con back-button. Esto es lo que queremos en una lista para que
   * refresque después de crear/editar/eliminar un test desde otra página.
   * Usamos esto en lugar de ngOnInit para evitar listas stale.
   */
  ionViewWillEnter(): void { this.recargar(); }

  /** Carga la primera página (reemplaza la lista). */
  async recargar(): Promise<void> {
    this.error = '';
    this.cargando = true;
    this.page = 1;
    try {
      const res = await this.testSvc.listarPagina(this.page, TESTS_PAGE_SIZE);
      this.tests = res.items;
      this.hasMore = res.hasMore;
    } catch (err: any) {
      this.error = (err && err.message) || 'No se pudo cargar la lista.';
      this.tests = [];
      this.hasMore = false;
    } finally {
      this.cargando = false;
    }
  }

  /** Carga la siguiente página y la agrega al final. */
  async cargarMas(): Promise<void> {
    if (this.cargandoMas || !this.hasMore) return;
    this.cargandoMas = true;
    try {
      const res = await this.testSvc.listarPagina(this.page + 1, TESTS_PAGE_SIZE);
      this.tests = [...this.tests, ...res.items];
      this.page = res.page;
      this.hasMore = res.hasMore;
    } catch (err: any) {
      this.error = (err && err.message) || 'No se pudieron cargar más tests.';
    } finally {
      this.cargandoMas = false;
    }
  }

  irACrear(): void { this.router.navigateByUrl('/test-nuevo'); }

  abrirDetalle(t: TestResumen): void {
    this.router.navigateByUrl(`/test-detalle/${t.test_id}`);
  }

  formatoFecha(f: string): string {
    try {
      return new Date(f).toLocaleString('es-CL', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return f; }
  }
}
