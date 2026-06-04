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
 * vectores de XSS almacenado. Devolvemos SOLO el string ya saneado: NO usamos
 * bypassSecurityTrustHtml (innecesario y peligroso como patrón). El binding
 * [innerHTML] vuelve a sanear el string en Angular, sin cambiar el resultado
 * visual y sin dejar deuda de seguridad.
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
