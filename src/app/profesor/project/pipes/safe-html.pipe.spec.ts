import { TestBed } from '@angular/core/testing';
import { SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import { SafeHtmlPipe } from './safe-html.pipe';

/**
 * Tests del pipe safeHtml.
 *
 * Garantías:
 *  - Sanea (elimina <script>, atributos on*=) y conserva formato seguro.
 *  - Devuelve siempre un STRING (no SafeHtml), es decir SIN bypass de confianza,
 *    para que Angular vuelva a sanear al pintar en [innerHTML].
 *  - Trata null/undefined como ''.
 */
describe('SafeHtmlPipe', () => {
  let pipe: SafeHtmlPipe;
  let sanitizer: DomSanitizer;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [SafeHtmlPipe] });
    pipe = TestBed.inject(SafeHtmlPipe);
    sanitizer = TestBed.inject(DomSanitizer);
  });

  it('elimina <script> y conserva el texto', () => {
    const out = pipe.transform('<p>Hola</p><script>alert(1)</script>');
    expect(typeof out).toBe('string');
    expect(out).not.toContain('<script');
    expect(out).not.toContain('alert(1)');
    expect(out).toContain('Hola');
  });

  it('elimina atributos de evento (onerror)', () => {
    const out = pipe.transform('<img src="x" onerror="alert(1)">');
    expect(out.toLowerCase()).not.toContain('onerror');
    expect(out).not.toContain('alert(1)');
  });

  it('conserva formato seguro (<strong>)', () => {
    const out = pipe.transform('<strong>negrita</strong>');
    expect(out.toLowerCase()).toContain('strong');
    expect(out).toContain('negrita');
  });

  it('devuelve un string igual a DomSanitizer.sanitize (sin bypass)', () => {
    const raw = '<p>x</p><script>alert(1)</script>';
    const esperado = sanitizer.sanitize(SecurityContext.HTML, raw) || '';
    expect(pipe.transform(raw)).toBe(esperado);
  });

  it('trata null y undefined como cadena vacía', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
  });
});
