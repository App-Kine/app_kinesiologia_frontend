import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { EstudianteResultadoPage } from './estudiante-resultado.page';
import { EvaluacionService } from '../../services/evaluacion.service';

describe('EstudianteResultadoPage (métodos puros)', () => {
  let page: EstudianteResultadoPage;

  beforeEach(() => {
    // TestBed mínima: mockeamos Router y EvaluacionService para construir la
    // instancia SIN renderizar la plantilla (solo ejercitamos _stripHtml y
    // _nombreArchivo, que son funciones puras).
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: jasmine.createSpyObj('Router', ['navigateByUrl']) },
        {
          provide: EvaluacionService,
          useValue: jasmine.createSpyObj('EvaluacionService', [
            'informeCompleto', 'enviarInforme',
          ]),
        },
      ],
    });

    page = new EstudianteResultadoPage(
      TestBed.inject(Router),
      TestBed.inject(EvaluacionService),
    );
  });

  // Métodos privados -> cast a any.
  const stripHtml = (s: any): string => (page as any)._stripHtml(s);
  const nombreArchivo = (inf: any): string => (page as any)._nombreArchivo(inf);

  describe('_stripHtml', () => {
    it('null/undefined/empty -> string vacío', () => {
      expect(stripHtml(null)).toBe('');
      expect(stripHtml(undefined)).toBe('');
      expect(stripHtml('')).toBe('');
    });

    it('quita etiquetas HTML simples', () => {
      expect(stripHtml('<strong>Hola</strong> mundo')).toBe('Hola mundo');
    });

    it('convierte <br> en salto de línea', () => {
      expect(stripHtml('linea1<br>linea2')).toBe('linea1\nlinea2');
      expect(stripHtml('linea1<br/>linea2')).toBe('linea1\nlinea2');
    });

    it('convierte <li> en viñetas y cierra bloques con salto', () => {
      const out = stripHtml('<ul><li>uno</li><li>dos</li></ul>');
      expect(out).toContain('• uno');
      expect(out).toContain('• dos');
    });

    it('desescapa entidades HTML (&amp; &lt; &gt; &quot; &#39; &nbsp;)', () => {
      expect(stripHtml('a &amp; b')).toBe('a & b');
      expect(stripHtml('&lt;tag&gt;')).toBe('<tag>');
      expect(stripHtml('di&quot;ce')).toBe('di"ce');
      expect(stripHtml('it&#39;s')).toBe("it's");
      expect(stripHtml('a&nbsp;b')).toBe('a b');
    });

    it('colapsa espacios múltiples y hace trim', () => {
      expect(stripHtml('  hola    mundo  ')).toBe('hola mundo');
    });

    it('colapsa 3+ saltos de línea a 2', () => {
      const out = stripHtml('<p>a</p><p></p><p></p><p>b</p>');
      expect(out).not.toMatch(/\n{3,}/);
    });

    it('texto plano sin HTML se devuelve intacto (trim)', () => {
      expect(stripHtml('texto simple')).toBe('texto simple');
    });
  });

  describe('_nombreArchivo', () => {
    it('sanea el nombre del test y agrega .pdf', () => {
      const out = nombreArchivo({ cabecera: { test_nombre: 'Test Cardíaco #1' } });
      expect(out.endsWith('.pdf')).toBeTrue();
      // Caracteres no [a-zA-Z0-9-_] se reemplazan por '_'.
      expect(out).not.toMatch(/[áí#\s]/);
      expect(out.startsWith('Auris-informe-')).toBeTrue();
    });

    it('usa "resultado" como fallback si no hay test_nombre', () => {
      const out = nombreArchivo({ cabecera: { test_nombre: '' } });
      expect(out).toBe('Auris-informe-resultado.pdf');
    });

    it('limita la base a 60 chars antes de la extensión', () => {
      const largo = 'X'.repeat(200);
      const out = nombreArchivo({ cabecera: { test_nombre: largo } });
      // base (<=60) + ".pdf"
      expect(out.length).toBeLessThanOrEqual(64);
      expect(out.endsWith('.pdf')).toBeTrue();
    });

    it('no deja caracteres peligrosos de ruta (/, .., espacios)', () => {
      const out = nombreArchivo({ cabecera: { test_nombre: '../../etc/passwd evil' } });
      expect(out).not.toContain('/');
      expect(out).not.toContain('..');
      expect(out).not.toContain(' ');
      expect(out.endsWith('.pdf')).toBeTrue();
    });
  });
});
