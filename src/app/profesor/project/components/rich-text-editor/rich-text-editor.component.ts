import {
  AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, EventEmitter,
  Input, OnChanges, Output, SecurityContext, SimpleChanges, ViewChild,
  forwardRef, inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  ellipsisHorizontalOutline, listOutline, returnDownBackOutline,
} from 'ionicons/icons';

/**
 * Editor de texto enriquecido (WYSIWYG) ligero y sin dependencias externas.
 *
 * Pensado para el enunciado y la explicación clínica de las preguntas (pedido
 * cliente 2026-05-26). Soporta:
 *   - **negrita**, *cursiva*, subrayado
 *   - listas con viñetas y numeradas
 *   - "puntos" (bullets) que pidió el cliente — botón "Lista"
 *
 * Implementación:
 *   - Usa un `contenteditable` div + `document.execCommand`. execCommand está
 *     marcado como deprecated en la spec, pero sigue funcionando en todos los
 *     navegadores y es la forma sin dependencias de implementar un editor
 *     WYSIWYG simple. Para necesidades más avanzadas migrar a Quill/TipTap.
 *   - Es ControlValueAccessor → funciona con [(ngModel)] y formularios.
 *   - El valor que emite/recibe es HTML simple (`<p>`, `<strong>`, `<em>`,
 *     `<u>`, `<ul>`, `<ol>`, `<li>`, `<br>`).
 *
 * SEGURIDAD: el backend almacena el HTML tal cual. Al renderizarlo en cualquier
 * vista pública usamos el pipe `safeHtml` (con DomSanitizer) que sanitiza
 * scripts/iframes/eventos. Ver `safe-html.pipe.ts`.
 */
@Component({
  selector: 'app-rich-text-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, IonButton, IonIcon],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RichTextEditorComponent),
      multi: true,
    },
  ],
  template: `
    <div class="rte-wrap" [class.disabled]="disabled" [class.focused]="focused">
      <div class="rte-toolbar" role="toolbar" aria-label="Formato de texto" (mousedown)="$event.preventDefault()">
        <button type="button" class="rte-btn" (click)="cmd('bold')"
          [class.active]="state.bold" [attr.aria-pressed]="state.bold"
          aria-label="Negrita" title="Negrita (Ctrl+B)">
          <strong aria-hidden="true">B</strong>
        </button>
        <button type="button" class="rte-btn" (click)="cmd('italic')"
          [class.active]="state.italic" [attr.aria-pressed]="state.italic"
          aria-label="Cursiva" title="Cursiva (Ctrl+I)">
          <em aria-hidden="true">I</em>
        </button>
        <button type="button" class="rte-btn" (click)="cmd('underline')"
          [class.active]="state.underline" [attr.aria-pressed]="state.underline"
          aria-label="Subrayado" title="Subrayado (Ctrl+U)">
          <u aria-hidden="true">U</u>
        </button>
        <span class="rte-sep" aria-hidden="true"></span>
        <button type="button" class="rte-btn" (click)="cmd('insertUnorderedList')"
          [class.active]="state.ul" [attr.aria-pressed]="state.ul"
          aria-label="Lista con viñetas" title="Lista con viñetas">
          <ion-icon name="list-outline" aria-hidden="true"></ion-icon>
        </button>
        <button type="button" class="rte-btn" (click)="cmd('insertOrderedList')"
          [class.active]="state.ol" [attr.aria-pressed]="state.ol"
          aria-label="Lista numerada" title="Lista numerada">
          <span aria-hidden="true">1.</span>
        </button>
        <span class="rte-sep" aria-hidden="true"></span>
        <button type="button" class="rte-btn" (click)="cmd('removeFormat')"
          aria-label="Quitar formato" title="Quitar formato">
          <ion-icon name="return-down-back-outline" aria-hidden="true"></ion-icon>
        </button>
      </div>

      <div #editor
        class="rte-editor"
        role="textbox"
        aria-multiline="true"
        aria-label="Editor de enunciado"
        [attr.contenteditable]="disabled ? false : true"
        [attr.aria-disabled]="disabled ? true : null"
        [attr.placeholder]="placeholder"
        (input)="onInput($event)"
        (focus)="focused = true; refreshState()"
        (blur)="focused = false; onTouched()"
        (keyup)="refreshState()"
        (mouseup)="refreshState()">
      </div>
    </div>
  `,
  styles: [`
    /*
     * Variables propias del componente. Las defino con !default-ish y luego las
     * sobrescribo con @media (prefers-color-scheme: dark). Esto deja el editor
     * con un look consistente independientemente de si la app entera tiene
     * dark mode o no.
     *
     * También seteamos color-scheme: light/dark para que el navegador NO
     * aplique su "auto-dark" sobre el contenteditable (Firefox/Safari lo
     * hacen y rompe los colores que definimos).
     */
    :host {
      display: block;
      --rte-bg: #ffffff;
      --rte-text: #1a1a1a;
      --rte-placeholder: #80868b;
      --rte-border: #c7c9d0;
      --rte-toolbar-bg: #f7f8fa;
      --rte-toolbar-border: #e3e3e5;
      --rte-btn-text: #2a2a2a;
      --rte-btn-hover-bg: #eaecef;
      --rte-sep: #dfe1e5;
      --rte-disabled-bg: #f3f4f6;
      --rte-accent: var(--ion-color-secondary, #06717e);
      color-scheme: light;
    }
    @media (prefers-color-scheme: dark) {
      :host {
        --rte-bg: #1f2024;
        --rte-text: #f1f1f2;
        --rte-placeholder: #9aa0a6;
        --rte-border: #3c3f44;
        --rte-toolbar-bg: #2a2c31;
        --rte-toolbar-border: #3c3f44;
        --rte-btn-text: #f1f1f2;
        --rte-btn-hover-bg: #3a3d42;
        --rte-sep: #4a4d52;
        --rte-disabled-bg: #2a2c31;
        color-scheme: dark;
      }
    }

    .rte-wrap {
      border: 1px solid var(--rte-border);
      border-radius: 8px;
      background: var(--rte-bg);
      color: var(--rte-text);
      transition: border-color .12s ease, box-shadow .12s ease;
      overflow: hidden;
    }
    .rte-wrap.focused {
      border-color: var(--rte-accent);
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--rte-accent) 22%, transparent);
    }
    .rte-wrap.disabled {
      opacity: 0.6;
      background: var(--rte-disabled-bg);
    }

    .rte-toolbar {
      display: flex; align-items: center; gap: 2px;
      padding: 6px 8px;
      border-bottom: 1px solid var(--rte-toolbar-border);
      background: var(--rte-toolbar-bg);
      flex-wrap: wrap;
    }
    .rte-btn {
      min-width: 30px; height: 30px;
      padding: 0 8px;
      border: 1px solid transparent;
      border-radius: 6px;
      background: transparent;
      cursor: pointer;
      font-size: 14px;
      color: var(--rte-btn-text);
      display: inline-flex; align-items: center; justify-content: center;
    }
    .rte-btn:hover { background: var(--rte-btn-hover-bg); }
    .rte-btn.active {
      background: color-mix(in srgb, var(--rte-accent) 18%, transparent);
      border-color: color-mix(in srgb, var(--rte-accent) 36%, transparent);
      color: var(--rte-accent);
    }
    .rte-sep {
      width: 1px; height: 18px; margin: 0 4px;
      background: var(--rte-sep);
    }

    .rte-editor {
      min-height: 110px;
      padding: 12px 14px;
      outline: none;
      font-size: 15px;
      line-height: 1.5;
      color: var(--rte-text);
      background: var(--rte-bg);
      caret-color: var(--rte-text);
    }
    .rte-editor[contenteditable="true"]:empty::before {
      content: attr(placeholder);
      color: var(--rte-placeholder);
      pointer-events: none;
    }
    .rte-editor ul, .rte-editor ol { margin: 4px 0 4px 22px; padding: 0; }
    .rte-editor li { margin: 2px 0; }
    .rte-editor p { margin: 4px 0; }
    .rte-editor strong { font-weight: 700; }
  `],
})
export class RichTextEditorComponent implements ControlValueAccessor, AfterViewInit, OnChanges {
  @ViewChild('editor', { static: true }) editor!: ElementRef<HTMLDivElement>;

  @Input() placeholder = '';
  @Input() disabled = false;
  /** Valor inicial / sincronización externa (HTML). */
  @Input() value = '';
  @Output() valueChange = new EventEmitter<string>();

  focused = false;

  // Estado de los botones (negrita activa, etc.)
  state = { bold: false, italic: false, underline: false, ul: false, ol: false };

  private onChange: (v: string) => void = () => {};
  onTouched: () => void = () => {};

  // DomSanitizer para limpiar el HTML ANTES de emitirlo/guardarlo (defensa en
  // profundidad contra XSS almacenado: el backend almacena el HTML tal cual y
  // la app del estudiante lo renderiza).
  private sanitizer = inject(DomSanitizer);

  constructor() {
    addIcons({ ellipsisHorizontalOutline, listOutline, returnDownBackOutline });
  }

  ngAfterViewInit(): void {
    if (this.value) this.editor.nativeElement.innerHTML = this.value;
  }

  ngOnChanges(ch: SimpleChanges): void {
    if (ch['value'] && !ch['value'].firstChange) {
      const incoming = ch['value'].currentValue || '';
      // IMPORTANTE: NO reescribir el innerHTML mientras el usuario está escribiendo
      // (el editor tiene el foco). Hacerlo reposiciona el cursor al inicio — era el
      // bug de "al apretar espacio el cursor vuelve al principio": el valor emitido
      // va trimmeado, vuelve por [value] distinto al DOM, y se reescribía el editor.
      // Solo aplicamos cambios EXTERNOS (cargar datos, reset) cuando NO está enfocado.
      if (
        this.editor &&
        document.activeElement !== this.editor.nativeElement &&
        incoming !== this.editor.nativeElement.innerHTML
      ) {
        this.editor.nativeElement.innerHTML = incoming;
      }
    }
  }

  // ControlValueAccessor
  writeValue(v: any): void {
    this.value = v || '';
    if (this.editor) this.editor.nativeElement.innerHTML = this.value;
  }
  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }
  setDisabledState(d: boolean): void { this.disabled = d; }

  cmd(command: string): void {
    if (this.disabled) return;
    // execCommand requiere foco previo en el editor
    this.editor.nativeElement.focus();
    try { document.execCommand(command, false); } catch { /* ignore */ }
    this.emit();
    this.refreshState();
  }

  onInput(_ev: Event): void {
    this.emit();
    this.refreshState();
  }

  refreshState(): void {
    try {
      this.state = {
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        ul: document.queryCommandState('insertUnorderedList'),
        ol: document.queryCommandState('insertOrderedList'),
      };
    } catch { /* algunos navegadores throw aleatoriamente */ }
  }

  private emit(): void {
    const crudo = this.editor.nativeElement.innerHTML.trim();
    // SEGURIDAD: sanitizar el HTML ANTES de emitirlo/guardarlo. Así nunca se
    // persiste HTML peligroso (<script>, on*=, iframes, etc.) en el backend.
    const html = (this.sanitizer.sanitize(SecurityContext.HTML, crudo) || '').trim();
    // Normalizar contenido vacío para que validaciones tipo `if (!enunciado.trim())` funcionen
    const limpio = html === '<br>' || html === '<p><br></p>' || html === '<div><br></div>'
      ? ''
      : html;
    this.value = limpio;
    this.valueChange.emit(limpio);
    this.onChange(limpio);
  }
}
