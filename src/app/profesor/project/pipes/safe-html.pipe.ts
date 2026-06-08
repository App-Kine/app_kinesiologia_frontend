import { Pipe, PipeTransform, SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

/**
 * Pipe para renderizar HTML enriquecido (proveniente del rich text editor)
 * en plantillas Angular vía [innerHTML].
 *
 * El contenido se almacena en el backend como HTML crudo, así que NO podemos
 * confiar en él ciegamente: lo pasamos por DomSanitizer.sanitize() con
 * SecurityContext.HTML, que conserva el formato seguro (<p>, <strong>, <em>,
 * <u>, <ul>, <ol>, <li>, <br>) y elimina <script>, atributos on*= y demás
 * vectores de XSS almacenado.
 *
 * Devolvemos el STRING ya saneado (sin bypassSecurityTrustHtml): así Angular
 * vuelve a sanitizarlo al pintarlo en [innerHTML] (defensa en profundidad) y
 * nunca marcamos contenido como "confiable" saltándonos la protección.
 *
 * Uso:
 *   <div [innerHTML]="pregunta.enunciado | safeHtml"></div>
 */
@Pipe({ name: 'safeHtml', standalone: true })
export class SafeHtmlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}
  transform(value: string | null | undefined): string {
    return this.sanitizer.sanitize(SecurityContext.HTML, value || '') || '';
  }
}
