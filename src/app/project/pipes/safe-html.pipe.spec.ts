import { TestBed } from '@angular/core/testing';
import { BrowserModule } from '@angular/platform-browser';
import { SafeHtmlPipe } from './safe-html.pipe';

describe('SafeHtmlPipe', () => {
  let pipe: SafeHtmlPipe;

  beforeEach(() => {
    // Importamos BrowserModule para tener un DomSanitizer real (el del
    // navegador headless), que es justo lo que queremos ejercitar: que el
    // pipe realmente sanee el HTML.
    TestBed.configureTestingModule({
      imports: [BrowserModule],
      providers: [SafeHtmlPipe],
    });
    pipe = TestBed.inject(SafeHtmlPipe);
  });

  it('se crea', () => {
    expect(pipe).toBeTruthy();
  });

  it('devuelve un string (ya NO un SafeHtml/objeto)', () => {
    const out = pipe.transform('<p>Hola</p>');
    expect(typeof out).toBe('string');
  });

  it('conserva el formato seguro (<p>, <strong>, <em>, <ul>, <li>)', () => {
    const out = pipe.transform('<p>Texto <strong>fuerte</strong> y <em>énfasis</em></p>');
    expect(out).toContain('<strong>');
    expect(out).toContain('fuerte');
    expect(out).toContain('<em>');
    expect(out.toLowerCase()).toContain('<p>');
  });

  it('elimina <script>', () => {
    const out = pipe.transform('<p>ok</p><script>alert(1)</script>');
    expect(out.toLowerCase()).not.toContain('<script');
    expect(out.toLowerCase()).not.toContain('alert(1)');
    expect(out).toContain('ok');
  });

  it('elimina atributos on* como onerror=', () => {
    const out = pipe.transform('<img src="x" onerror="alert(1)">');
    expect(out.toLowerCase()).not.toContain('onerror');
    expect(out.toLowerCase()).not.toContain('alert(1)');
  });

  it('neutraliza URLs javascript:', () => {
    const out = pipe.transform('<a href="javascript:alert(1)">click</a>').toLowerCase();
    // El sanitizer de Angular reescribe el esquema peligroso a "unsafe:..."
    // (no como un href javascript: ejecutable). Verificamos que NO quede un
    // esquema javascript: vivo en el href.
    expect(out).not.toContain('href="javascript:');
    expect(out).not.toContain("href='javascript:");
    if (out.includes('javascript:')) {
      expect(out).toContain('unsafe:javascript:');
    }
  });

  it('maneja null/undefined/empty devolviendo string vacío', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform('')).toBe('');
  });
});
