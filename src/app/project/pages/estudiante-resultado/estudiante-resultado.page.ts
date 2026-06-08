import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonIcon, IonText, IonSpinner, IonButtons,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  ribbonOutline, checkmarkCircle, refreshCircle, closeCircle, homeOutline,
  mailOutline, checkmarkDoneOutline, downloadOutline, arrowBackOutline,
} from 'ionicons/icons';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { jsPDF } from 'jspdf';

import {
  ResultadoFinal, EvaluacionService, InformeCompleto,
} from '../../services/evaluacion.service';

@Component({
  selector: 'app-estudiante-resultado',
  templateUrl: './estudiante-resultado.page.html',
  styleUrls: ['./estudiante-resultado.page.scss'],
  standalone: true,
  imports: [
    CommonModule, IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonIcon, IonText, IonSpinner, IonButtons,
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

  // Caché del PDF ya construido, por evaluacion_uuid. Evita generar el informe
  // dos veces (descargar + enviar) cuando es la misma evaluación: el primero que
  // lo construya lo deja cacheado y el otro lo reutiliza.
  private _pdfCache: { uuid: string; doc: jsPDF; nombreArchivo: string } | null = null;

  constructor(private router: Router, private evalSvc: EvaluacionService) {
    addIcons({
      ribbonOutline, checkmarkCircle, refreshCircle, closeCircle, homeOutline,
      mailOutline, checkmarkDoneOutline, downloadOutline, arrowBackOutline,
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

  /**
   * RF-41/42: envía el informe al correo registrado (modalidad IDENTIFICADA),
   * adjuntando el MISMO PDF descargable (generado con jsPDF). El PDF se genera
   * en el dispositivo y solo pasa por el servidor en memoria para adjuntarlo;
   * no se guarda en BD ni en disco. Si la generación fallara, el correo igual
   * se envía (sin adjunto) para no bloquear al usuario.
   */
  async enviarInforme(): Promise<void> {
    if (!this.resultado || this.enviandoInforme) return;
    this.errorInforme = '';
    this.enviandoInforme = true;
    try {
      let pdfBase64: string | undefined;
      try {
        const { doc } = await this._obtenerPdf(this.resultado.evaluacion_uuid);
        pdfBase64 = doc.output('datauristring').split(',')[1];
      } catch {
        pdfBase64 = undefined; // se envía el correo sin adjunto
      }
      const r = await this.evalSvc.enviarInforme(this.resultado.evaluacion_uuid, pdfBase64);
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
   * Descarga el informe completo como PDF (pedido cliente 2026-05-26).
   * Disponible para anónimos e identificados.
   *
   * - App nativa (Capacitor iOS/Android): genera el PDF en memoria, lo escribe
   *   en el almacenamiento de la app y abre el menú nativo "Compartir / Guardar
   *   en Archivos". Así queda un PDF de verdad en la app Archivos del teléfono.
   * - Web (navegador): descarga directa del PDF.
   *
   * El render se hace sobre un contenedor off-screen con el HTML del informe.
   */
  async descargarInforme(): Promise<void> {
    if (!this.resultado || this.generandoPdf) return;
    this.errorPdf = '';
    this.generandoPdf = true;
    try {
      const { doc, nombreArchivo } = await this._obtenerPdf(this.resultado.evaluacion_uuid);

      if (Capacitor.isNativePlatform()) {
        // Escribimos el PDF en almacenamiento TEMPORAL (cache) solo para poder
        // entregarlo al menú nativo "Compartir", donde el usuario elige qué hacer
        // (Guardar en Archivos, WhatsApp, Drive, etc.). No se guarda de forma
        // permanente: el SO limpia la cache.
        const base64 = doc.output('datauristring').split(',')[1];
        const written = await Filesystem.writeFile({
          path: nombreArchivo,
          data: base64,
          directory: Directory.Cache,
        });
        await Share.share({
          title: 'Informe Auris',
          text: 'Tu informe de resultados Auris (PDF).',
          url: written.uri,
        });
      } else {
        // Navegador: descarga directa.
        doc.save(nombreArchivo);
      }
    } catch (e: any) {
      // Cancelar el menú nativo "Compartir" lanza excepción ("cancel"/"Abort"):
      // es una acción normal del usuario, no un error -> no mostramos errorPdf.
      const msg = (e && e.message ? String(e.message) : '').toLowerCase();
      const cancelado = msg.includes('cancel') || msg.includes('abort');
      if (!cancelado) {
        this.errorPdf = (e && e.message) || 'No se pudo generar el informe.';
      }
    } finally {
      this.generandoPdf = false;
    }
  }

  /**
   * Devuelve el PDF del informe (documento jsPDF + nombre de archivo) para la
   * evaluación indicada, reutilizando el resultado cacheado si ya se construyó
   * antes para el mismo UUID. Así "descargar" y "enviar" generan el informe una
   * sola vez en lugar de hacer el trabajo (fetch + render del PDF) por duplicado.
   */
  private async _obtenerPdf(uuid: string): Promise<{ doc: jsPDF; nombreArchivo: string }> {
    if (this._pdfCache && this._pdfCache.uuid === uuid) {
      return { doc: this._pdfCache.doc, nombreArchivo: this._pdfCache.nombreArchivo };
    }
    const informe = await this.evalSvc.informeCompleto(uuid);
    const doc = this._construirPdf(informe);
    const nombreArchivo = this._nombreArchivo(informe);
    this._pdfCache = { uuid, doc, nombreArchivo };
    return { doc, nombreArchivo };
  }

  /**
   * Construye el PDF del informe ESCRIBIENDO el texto directamente con jsPDF
   * (no captura HTML como imagen). Es robusto y produce texto seleccionable.
   * El enunciado/alternativas/explicación vienen como HTML: se limpian a texto
   * plano con _stripHtml antes de escribirlos.
   */
  private _construirPdf(informe: InformeCompleto): jsPDF {
    const c = informe.cabecera;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const mX = 14;
    const maxW = pageW - mX * 2;
    let y = 18;

    // Escribe texto con ajuste de línea y salto de página automático.
    const write = (
      txt: string,
      o: { size?: number; bold?: boolean; color?: [number, number, number]; indent?: number; gap?: number } = {},
    ): void => {
      const size = o.size ?? 10;
      const lh = size * 0.42 + 1.5; // alto de línea en mm
      const indent = o.indent ?? 0;
      doc.setFontSize(size);
      doc.setFont('helvetica', o.bold ? 'bold' : 'normal');
      doc.setTextColor(...(o.color ?? [34, 34, 34]));
      const lines = doc.splitTextToSize(txt, maxW - indent) as string[];
      for (const ln of lines) {
        if (y + lh > pageH - 14) { doc.addPage(); y = 18; }
        doc.text(ln, mX + indent, y);
        y += lh;
      }
      if (o.gap) y += o.gap;
    };

    const correctas = (c.aciertos_primer || 0) + (c.aciertos_segundo || 0);

    // Cabecera
    write('Auris — Informe de resultados', { size: 17, bold: true, color: [21, 101, 192], gap: 1 });
    write(`${c.curso_nombre} (${c.curso_codigo}) · ${c.test_nombre}`, { size: 10, color: [60, 60, 60] });
    write(
      c.modalidad === 'IDENTIFICADA' && c.correo_estudiante
        ? `Estudiante: ${c.correo_estudiante}`
        : 'Modalidad: Anónima',
      { size: 10, color: [60, 60, 60] },
    );
    write(`Finalizada: ${this._fmtFecha(c.finalizada_en)}`, { size: 10, color: [60, 60, 60], gap: 3 });

    // Porcentaje global
    write(`${c.porcentaje_global}% de aciertos (${correctas} de ${c.total_preguntas})`, {
      size: 15, bold: true, color: [21, 101, 192], gap: 3,
    });

    // Resumen
    write('Resumen', { size: 13, bold: true, color: [51, 51, 51], gap: 1 });
    write(`Correctas (1er intento): ${c.aciertos_primer}`);
    write(`Correctas (2do intento): ${c.aciertos_segundo}`);
    write(`Incorrectas: ${c.incorrectas}`);
    write(`Total de preguntas: ${c.total_preguntas}`, { gap: 4 });

    // Detalle por pregunta
    write('Detalle por pregunta', { size: 13, bold: true, color: [51, 51, 51], gap: 2 });

    if (!informe.preguntas.length) {
      write('No hay respuestas registradas.', { size: 10, color: [120, 120, 120] });
    }

    for (const q of informe.preguntas) {
      const tiempo = q.tiempo_segundos != null ? `${q.tiempo_segundos} s` : '—';
      write(
        `Pregunta ${q.orden_presentacion} — ${this._labelResultado(q.resultado)} · ${tiempo}`,
        { size: 11, bold: true, color: [33, 33, 33], gap: 0.5 },
      );

      const enun = this._stripHtml(q.enunciado);
      if (enun) write(enun, { size: 10, gap: 1 });

      for (const a of q.alternativas) {
        const marcas: string[] = [];
        if (a.es_correcta) marcas.push('Correcta');
        if (q.alternativa_intento1_id === a.alternativa_id) marcas.push('Tu intento 1');
        if (q.alternativa_intento2_id === a.alternativa_id) marcas.push('Tu intento 2');
        const sufijo = marcas.length ? `  (${marcas.join(' · ')})` : '';
        write(`• ${this._stripHtml(a.texto)}${sufijo}`, {
          size: 10,
          indent: 4,
          color: a.es_correcta ? [46, 125, 50] : [34, 34, 34],
          bold: a.es_correcta,
        });
      }

      const expl = this._stripHtml(q.explicacion_clinica);
      if (expl) write(`Explicación clínica: ${expl}`, { size: 9, color: [120, 90, 0], indent: 2, gap: 1 });

      y += 3; // separación entre preguntas
    }

    write(`Generado por Auris — ${this._fmtFecha(new Date().toISOString())}`, {
      size: 8, color: [150, 150, 150], gap: 0,
    });

    return doc;
  }

  /** Convierte HTML simple a texto plano legible para el PDF. */
  private _stripHtml(s: string | null | undefined): string {
    if (!s) return '';
    return String(s)
      .replace(/<\s*br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|li|h[1-6])\s*>/gi, '\n')
      .replace(/<li[^>]*>/gi, '• ')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /** Nombre de archivo seguro para el PDF del informe. */
  private _nombreArchivo(inf: InformeCompleto): string {
    const base = `Auris-informe-${inf.cabecera.test_nombre || 'resultado'}`;
    const safe = base.replace(/[^a-zA-Z0-9-_]+/g, '_').slice(0, 60);
    return `${safe}.pdf`;
  }

  private _labelResultado(r: string | null): string {
    if (r === 'CORRECTA_INT1') return 'Correcta (1er intento)';
    if (r === 'CORRECTA_INT2') return 'Correcta (2do intento)';
    if (r === 'INCORRECTA') return 'Incorrecta';
    return 'Sin responder';
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
