import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import { RichTextEditorComponent } from './rich-text-editor.component';

/**
 * Tests de seguridad del editor enriquecido.
 *
 * Lo crítico: ANTES de emitir/guardar, el HTML del contenteditable pasa por
 * DomSanitizer.sanitize(SecurityContext.HTML, ...). Así nunca se persiste
 * HTML peligroso (<script>, on*=, etc.) en el backend (XSS almacenado).
 *
 * Se ejercita vía la instancia real con DomSanitizer real, inyectando HTML
 * malicioso en el contenteditable y disparando onInput().
 */
describe('RichTextEditorComponent (sanitización al emitir)', () => {
  let fixture: ComponentFixture<RichTextEditorComponent>;
  let component: RichTextEditorComponent;

  /** Setea el HTML crudo del contenteditable y dispara el flujo de emit. */
  function emitWith(rawHtml: string): string {
    component.editor.nativeElement.innerHTML = rawHtml;
    let emitido = '<UNSET>';
    const sub = component.valueChange.subscribe((v) => (emitido = v));
    component.onInput(new Event('input'));
    sub.unsubscribe();
    return emitido;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RichTextEditorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RichTextEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('elimina <script> del HTML emitido', () => {
    const out = emitWith('<p>Hola</p><script>alert(1)</script>');
    expect(out).not.toContain('<script');
    expect(out).not.toContain('alert(1)');
    expect(out).toContain('Hola');
  });

  it('elimina atributos de evento (onerror) del HTML emitido', () => {
    const out = emitWith('<img src="x" onerror="alert(1)">texto');
    expect(out.toLowerCase()).not.toContain('onerror');
    expect(out).not.toContain('alert(1)');
  });

  it('conserva el formato seguro (<strong>) y emite un string', () => {
    const out = emitWith('<p><strong>negrita</strong></p>');
    expect(typeof out).toBe('string');
    expect(out).toContain('negrita');
    expect(out.toLowerCase()).toContain('strong');
  });

  it('emite cadena vacía para contenido vacío (<br>)', () => {
    expect(emitWith('<br>')).toBe('');
    expect(emitWith('<p><br></p>')).toBe('');
  });

  it('lo emitido coincide con DomSanitizer.sanitize (no hay bypass de confianza)', () => {
    const sanitizer = TestBed.inject(DomSanitizer);
    const raw = '<p>x</p><script>alert(1)</script>';
    const esperado = (sanitizer.sanitize(SecurityContext.HTML, raw) || '').trim();

    expect(emitWith(raw)).toBe(esperado);
  });

  it('neutraliza href con javascript: (el navegador no lo ejecutará)', () => {
    const out = emitWith('<a href="javascript:alert(1)">click</a>');
    // DomSanitizer no ejecuta el esquema: lo deja inerte prefijándolo con
    // "unsafe:" (el navegador no navega a unsafe:javascript:...).
    expect(out).toContain('unsafe:javascript:');
    expect(out).not.toContain('href="javascript:');
    // El texto del enlace se conserva.
    expect(out).toContain('click');
  });

  it('elimina <iframe> del HTML emitido', () => {
    const out = emitWith('<p>antes</p><iframe src="http://evil.test"></iframe>');
    expect(out.toLowerCase()).not.toContain('<iframe');
    expect(out.toLowerCase()).not.toContain('evil.test');
    expect(out).toContain('antes');
  });

  it('elimina <style> del HTML emitido', () => {
    const out = emitWith('<style>body{display:none}</style><p>visible</p>');
    expect(out.toLowerCase()).not.toContain('<style');
    expect(out).toContain('visible');
  });

  it('descarta atributos onclick en cualquier elemento', () => {
    const out = emitWith('<p onclick="alert(1)">texto</p>');
    expect(out.toLowerCase()).not.toContain('onclick');
    expect(out).not.toContain('alert(1)');
    expect(out).toContain('texto');
  });

  it('normaliza variantes de contenido vacío a cadena vacía (<div><br></div>)', () => {
    expect(emitWith('<div><br></div>')).toBe('');
  });

  it('conserva listas (<ul><li>) seguras', () => {
    const out = emitWith('<ul><li>uno</li><li>dos</li></ul>');
    expect(out.toLowerCase()).toContain('<ul');
    expect(out).toContain('uno');
    expect(out).toContain('dos');
  });
});
