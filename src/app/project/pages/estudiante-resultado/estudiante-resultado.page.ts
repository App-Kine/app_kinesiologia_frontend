import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonIcon, IonText, IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  ribbonOutline, checkmarkCircle, refreshCircle, closeCircle, homeOutline,
  mailOutline, checkmarkDoneOutline, downloadOutline,
} from 'ionicons/icons';

import {
  ResultadoFinal, EvaluacionService, InformeCompleto,
} from '../../services/evaluacion.service';

@Component({
  selector: 'app-estudiante-resultado',
  templateUrl: './estudiante-resultado.page.html',
  styleUrls: ['./estudiante-resultado.page.scss'],
  standalone: true,
  imports: [
    CommonModule, IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonIcon, IonText, IonSpinner,
  ],
})
export class EstudianteResultadoPage implements OnInit {
  resultado: ResultadoFinal | null = null;
  testNombre = '';

  // Estado del envío de informe por correo (RF-41/42)
  enviandoInforme = false;
  informeEnviado = false;
  correoEnviado = '';
  errorInforme = '';

  // Estado de la descarga PDF (pedido cliente 2026-05-26)
  generandoPdf = false;
  errorPdf = '';

  constructor(private router: Router, private evalSvc: EvaluacionService) {
    addIcons({
      ribbonOutline, checkmarkCircle, refreshCircle, closeCircle, homeOutline,
      mailOutline, checkmarkDoneOutline, downloadOutline,
    });
  }

  ngOnInit(): void {
    const st = history.state as any;
    if (st && st.resultado) {
      this.resultado = st.resultado as ResultadoFinal;
      this.testNombre = st.testNombre || '';
    }
  }

  get correctas(): number {
    if (!this.resultado) return 0;
    return this.resultado.aciertos_primer + this.resultado.aciertos_segundo;
  }

  get colorPct(): string {
    const p = this.resultado ? this.resultado.porcentaje_global : 0;
    if (p >= 70) return 'success';
    if (p >= 50) return 'warning';
    return 'danger';
  }

  /** RF-41/42: envía el informe al correo registrado (modalidad IDENTIFICADA). */
  async enviarInforme(): Promise<void> {
    if (!this.resultado || this.enviandoInforme) return;
    this.errorInforme = '';
    this.enviandoInforme = true;
    try {
      const r = await this.evalSvc.enviarInforme(this.resultado.evaluacion_id);
      this.informeEnviado = true;
      this.correoEnviado = r && r.correo ? r.correo : '';
    } catch (err: any) {
      this.errorInforme =
        (err && err.message) || 'No se pudo enviar el informe. Intenta de nuevo.';
    } finally {
      this.enviandoInforme = false;
    }
  }

  volver(): void {
    this.router.navigateByUrl('/estudiante/cursos', { replaceUrl: true });
  }

  /**
   * Descarga PDF del informe completo (pedido cliente 2026-05-26).
   * Disponible para anónimos e identificados.
   *
   * Estrategia zero-deps: abre una ventana nueva con HTML imprimible y
   * dispara window.print(). El usuario elige "Guardar como PDF" en el
   * diálogo de impresión. Funciona en Chrome/Edge/Safari/Firefox sin
   * librerías externas.
   */
  async descargarInforme(): Promise<void> {
    if (!this.resultado || this.generandoPdf) return;
    this.errorPdf = '';
    this.generandoPdf = true;
    try {
      const informe = await this.evalSvc.informeCompleto(this.resultado.evaluacion_id);
      const html = this._construirHtmlInforme(informe);

      const win = window.open('', '_blank', 'width=900,height=700');
      if (!win) {
        this.errorPdf = 'El navegador bloqueó la ventana. Permite ventanas emergentes y vuelve a intentar.';
        return;
      }
      win.document.open();
      win.document.write(html);
      win.document.close();
      // Damos tiempo a que se renderice antes de imprimir
      setTimeout(() => {
        try { win.focus(); win.print(); } catch { /* ignore */ }
      }, 300);
    } catch (e: any) {
      this.errorPdf = (e && e.message) || 'No se pudo generar el informe.';
    } finally {
      this.generandoPdf = false;
    }
  }

  /** Construye el HTML imprimible (con CSS embebido) del informe completo. */
  private _construirHtmlInforme(inf: InformeCompleto): string {
    const c = inf.cabecera;
    const fecha = this._fmtFecha(c.finalizada_en);
    const identidad = c.modalidad === 'IDENTIFICADA' && c.correo_estudiante
      ? `<p><strong>Estudiante:</strong> ${this._esc(c.correo_estudiante)}</p>`
      : `<p><strong>Modalidad:</strong> Anónima</p>`;

    const filasPreg = inf.preguntas.map((q) => {
      const altsHtml = q.alternativas.map((a) => {
        const esCorrecta = a.es_correcta;
        const elegida1 = q.alternativa_intento1_id === a.alternativa_id;
        const elegida2 = q.alternativa_intento2_id === a.alternativa_id;
        const marcas: string[] = [];
        if (esCorrecta) marcas.push('<span style="color:#2e7d32;font-weight:600">✓ Correcta</span>');
        if (elegida1) marcas.push('<span style="color:#1565c0">Tu intento 1</span>');
        if (elegida2) marcas.push('<span style="color:#ef6c00">Tu intento 2</span>');
        return `<li style="margin:4px 0;${esCorrecta ? 'font-weight:600;' : ''}">
          ${this._esc(a.texto)}
          ${marcas.length ? ` <small>(${marcas.join(' · ')})</small>` : ''}
        </li>`;
      }).join('');

      const tiempoTxt = q.tiempo_segundos != null
        ? `${q.tiempo_segundos} s`
        : '—';
      const resultadoLabel = this._labelResultado(q.resultado);

      return `
        <div class="preg">
          <h3>Pregunta ${q.orden_presentacion}
            <span class="badge ${this._claseResultado(q.resultado)}">${resultadoLabel}</span>
            <span class="tiempo">⏱ ${tiempoTxt}</span>
          </h3>
          <div class="enunciado">${q.enunciado || ''}</div>
          <ul class="alts">${altsHtml}</ul>
          ${q.explicacion_clinica ? `
            <div class="explicacion">
              <strong>💡 Explicación clínica:</strong>
              <div>${q.explicacion_clinica}</div>
            </div>` : ''}
        </div>
      `;
    }).join('');

    const correctas = (c.aciertos_primer || 0) + (c.aciertos_segundo || 0);

    return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Auris — Informe ${this._esc(c.test_nombre)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
         color: #222; max-width: 800px; margin: 24px auto; padding: 0 16px; line-height: 1.5; }
  h1 { color: #1565c0; margin: 0 0 4px; }
  h2 { color: #333; border-bottom: 2px solid #eaeaea; padding-bottom: 6px; margin-top: 28px; }
  h3 { color: #333; margin: 22px 0 8px; }
  .meta { color: #555; margin-bottom: 12px; }
  .pct-box { background: #f5f7fb; border-radius: 10px; padding: 16px; text-align: center; margin: 12px 0 20px; }
  .pct-num { font-size: 40px; font-weight: 700; color: #1565c0; display: block; }
  .pct-label { color: #666; font-size: 13px; }
  table.totales { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
  table.totales td { padding: 5px 8px; border-bottom: 1px solid #eee; }
  .preg { border: 1px solid #e3e3e5; border-radius: 10px; padding: 12px 16px; margin: 14px 0;
          page-break-inside: avoid; }
  .preg .enunciado { margin: 6px 0 10px; }
  .preg .enunciado p { margin: 4px 0; }
  .preg .enunciado ul, .preg .enunciado ol { margin: 4px 0 4px 22px; }
  .preg .alts { list-style: disc; padding-left: 22px; margin: 8px 0 12px; }
  .preg .explicacion { background: #fff8e1; border-left: 3px solid #ffb300;
                       padding: 8px 10px; border-radius: 4px; margin-top: 8px; font-size: 14px; }
  .badge { font-size: 11px; padding: 3px 8px; border-radius: 999px; margin-left: 8px; font-weight: 600;
           text-transform: uppercase; letter-spacing: .3px; }
  .badge.ok { background: #e8f5e9; color: #2e7d32; }
  .badge.warn { background: #fff3e0; color: #ef6c00; }
  .badge.bad { background: #ffebee; color: #c62828; }
  .badge.none { background: #eee; color: #555; }
  .tiempo { font-size: 12px; color: #777; font-weight: normal; margin-left: 8px; }
  small { color: #666; }
  footer { margin-top: 30px; color: #999; font-size: 11px; text-align: center; }
  @media print {
    body { margin: 0; padding: 0 8mm; }
    .preg { break-inside: avoid; }
  }
</style>
</head>
<body>
  <h1>Auris — Informe de resultados</h1>
  <div class="meta">
    <p><strong>${this._esc(c.curso_nombre)}</strong>
       (${this._esc(c.curso_codigo)}) · <strong>${this._esc(c.test_nombre)}</strong></p>
    ${identidad}
    <p><strong>Finalizada:</strong> ${fecha}</p>
  </div>

  <div class="pct-box">
    <span class="pct-num">${c.porcentaje_global}%</span>
    <span class="pct-label">de aciertos (${correctas} de ${c.total_preguntas})</span>
  </div>

  <h2>Resumen</h2>
  <table class="totales">
    <tr><td>✅ Correctas (1er intento)</td><td style="text-align:right"><strong>${c.aciertos_primer}</strong></td></tr>
    <tr><td>🔁 Correctas (2do intento)</td><td style="text-align:right"><strong>${c.aciertos_segundo}</strong></td></tr>
    <tr><td>❌ Incorrectas</td><td style="text-align:right"><strong>${c.incorrectas}</strong></td></tr>
    <tr><td><strong>Total de preguntas</strong></td><td style="text-align:right"><strong>${c.total_preguntas}</strong></td></tr>
  </table>

  <h2>Detalle por pregunta</h2>
  ${filasPreg || '<p><em>No hay respuestas registradas.</em></p>'}

  <footer>
    Generado por Auris — ${this._fmtFecha(new Date().toISOString())}
  </footer>
</body>
</html>`;
  }

  private _labelResultado(r: string | null): string {
    if (r === 'CORRECTA_INT1') return 'Correcta (1er intento)';
    if (r === 'CORRECTA_INT2') return 'Correcta (2do intento)';
    if (r === 'INCORRECTA') return 'Incorrecta';
    return 'Sin responder';
  }

  private _claseResultado(r: string | null): string {
    if (r === 'CORRECTA_INT1') return 'ok';
    if (r === 'CORRECTA_INT2') return 'warn';
    if (r === 'INCORRECTA') return 'bad';
    return 'none';
  }

  private _esc(s: string | null | undefined): string {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private _fmtFecha(iso: string): string {
    try {
      return new Date(iso).toLocaleString('es-CL', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return iso; }
  }
}
