import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * Pipe para renderizar HTML "confiable" en plantillas Angular vía [innerHTML].
 *
 * El HTML viene del rich text editor (RichTextEditorComponent) y solo contiene
 * etiquetas seguras (<p>, <strong>, <em>, <u>, <ul>, <ol>, <li>, <br>).
 * Angular además sigue sanitizando contra <script>, on*= handlers, etc.
 *
 * Uso:
 *   <div [innerHTML]="pregunta.enunciado | safeHtml"></div>
 */
@Pipe({ name: 'safeHtml', standalone: true })
export class SafeHtmlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}
  transform(value: string | null | undefined): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(value || '');
  }
}
