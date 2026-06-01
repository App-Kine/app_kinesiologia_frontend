import { Pipe, PipeTransform, SecurityContext } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * Pipe para renderizar HTML enriquecido (proveniente del rich text editor)
 * en plantillas Angular vía [innerHTML].
 *
 * El contenido se almacena en el backend como HTML crudo, así que NO podemos
 * confiar en él ciegamente: lo pasamos primero por DomSanitizer.sanitize() con
 * SecurityContext.HTML, que conserva el formato seguro (<p>, <strong>, <em>,
 * <u>, <ul>, <ol>, <li>, <br>) y elimina <script>, atributos on*= y demás
 * vectores de XSS almacenado. Solo después marcamos el resultado YA limpio
 * como confiable.
 *
 * Uso:
 *   <div [innerHTML]="pregunta.enunciado | safeHtml"></div>
 */
@Pipe({ name: 'safeHtml', standalone: true })
export class SafeHtmlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}
  transform(value: string | null | undefined): SafeHtml {
    const limpio = this.sanitizer.sanitize(SecurityContext.HTML, value || '') || '';
    return this.sanitizer.bypassSecurityTrustHtml(limpio);
  }
}
