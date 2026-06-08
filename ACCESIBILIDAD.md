# Auditoría de Accesibilidad WCAG 2.1 AA — App Auris

Documento producto del Bloque P2.R5 (auditoría ISO 25010). Aplica a la
**app unificada** `app_kinesiologia_frontend` (flujo del estudiante + panel docente).

## Estado actual

- **Cumplimiento aproximado:** WCAG 2.1 Nivel A: ~85% · Nivel AA: ~60%
- **Mejoras aplicadas:** `aria-label` en **todos los botones de solo-icono**
  del panel (paneles admin/docente, selección de panel, detalles de curso/test,
  analítica, editor de preguntas, mis-cursos/tests/aplicaciones) y en la app del
  estudiante (toolbars y el detalle del modelo 3D), con `aria-hidden="true"` en
  los iconos decorativos.
- **Brechas restantes:** documentadas abajo con prioridad.

## Checklist por criterio WCAG 2.1 AA

### Perceptible

| Criterio | Estado | Notas / acción |
|---|---|---|
| 1.1.1 Contenido no textual (alt en imágenes) | 🟡 parcial | Imágenes clínicas en `<img>` deberían tener `alt` con descripción; pendiente sumar `aria-label` al `model-viewer` 3D |
| 1.3.1 Información y relaciones (semántica) | 🟢 OK | Ionic usa landmarks (`<ion-header>`, `<ion-content>`) correctos |
| 1.3.2 Secuencia significativa | 🟢 OK | Orden DOM lógico en todas las páginas |
| 1.3.4 Orientación | 🟢 OK | Responsive sin lock de orientación |
| 1.4.3 Contraste mínimo (4.5:1) | 🟡 verificar | Texto primary `#003c58` sobre `#fff` = 12.6:1 ✓; texto medium `#5f5f5f` sobre `#fff` = 6.9:1 ✓; verificar chips de estado |
| 1.4.4 Redimensionar texto | 🟢 OK | `rem`/CSS variables permiten zoom 200% sin pérdida |
| 1.4.10 Reflujo | 🟢 OK | Sin scroll horizontal a 320px de ancho |
| 1.4.11 Contraste no textual (componentes) | 🟡 verificar | Bordes de cards e inputs deben tener ≥3:1 contra el fondo |
| 1.4.13 Contenido en hover/focus | 🟢 OK | Tooltips persisten hasta blur/click outside |

### Operable

| Criterio | Estado | Notas / acción |
|---|---|---|
| 2.1.1 Teclado (sin trampa) | 🟢 OK | Todas las acciones disponibles con teclado vía Ionic |
| 2.1.4 Atajos de teclado de carácter único | 🟢 N/A | No usamos atajos sin modificador |
| 2.4.1 Saltar bloques (skip link) | 🔴 falta | **AGREGAR:** skip-link al `<ion-content>` antes del toolbar |
| 2.4.2 Título de página | 🟢 OK | `<ion-title>` único por página |
| 2.4.3 Orden del foco | 🟢 OK | tabindex natural |
| 2.4.4 Propósito del enlace | 🟢 OK | Textos de botones descriptivos |
| 2.4.6 Encabezados y etiquetas | 🟢 OK | Jerarquía h1→h2 consistente |
| 2.4.7 Foco visible | 🟢 OK | Ionic muestra outline en focus |
| 2.5.3 Etiqueta en nombre | 🟡 parcial | `aria-label` agregado en botones de icono de las 4 páginas top |

### Comprensible

| Criterio | Estado | Notas / acción |
|---|---|---|
| 3.1.1 Idioma de la página | 🟡 verificar | Verificar `<html lang="es">` en `index.html` |
| 3.2.1 Foco sin cambio inesperado | 🟢 OK | El foco no dispara navegación |
| 3.2.2 Entrada sin cambio inesperado | 🟢 OK | Inputs no envían form sin botón |
| 3.3.1 Identificación de error | 🟢 OK | Mensajes específicos por campo |
| 3.3.2 Etiquetas o instrucciones | 🟢 OK | Inputs Ionic con `<ion-label>` |
| 3.3.3 Sugerencia de error | 🟢 OK | Mensajes accionables ("código no puede superar 40 caracteres") |

### Robusto

| Criterio | Estado | Notas / acción |
|---|---|---|
| 4.1.2 Nombre, función, valor | 🟡 parcial | Botones de icono ahora con aria-label en pages principales |
| 4.1.3 Mensajes de estado | 🟡 parcial | Loaders/spinners deberían usar `aria-live="polite"` |

## Cambios aplicados en este sprint

1. **`mis-tests.page.html`** — aria-label en botón recargar + nuevo test, iconos con aria-hidden
2. **`mis-cursos.page.html`** — aria-label en botón nuevo curso
3. **`mis-aplicaciones.page.html`** — aria-label en recargar + nueva aplicación
4. **`analitica.page.html`** — aria-label en recargar

## Trabajo pendiente (priorizado)

### Prioridad alta (compliance AA)

1. **Skip-link** en `app.component.html`:
   ```html
   <a href="#contenido-principal" class="skip-link">Saltar al contenido</a>
   ```
   con CSS que lo oculte hasta recibir foco.

2. **`lang="es"`** verificado en `src/index.html` y `src/index.html` del frontend.

3. **`aria-live`** en spinners y mensajes de error/éxito globales:
   ```html
   <ion-spinner aria-label="Cargando" role="status"></ion-spinner>
   <div aria-live="polite" role="status">{{ mensaje }}</div>
   ```

4. **Alt text** en `<img>` clínicas dentro del editor de preguntas (al subir
   imagen, exigir descripción).

5. **Aria-label en `<model-viewer>`** de auscultación 3D:
   ```html
   <model-viewer aria-label="Modelo 3D del torso humano con puntos
                              clickeables de auscultación"
                 role="img"></model-viewer>
   ```

### Prioridad media

6. Repetir el patrón de `aria-label` + `aria-hidden` de iconos en las 10
   páginas restantes (curso-*, test-*, pregunta-*, panel-admin).

7. Auditoría automática con **axe-core** integrado en los tests e2e (cuando
   se sumen tests Playwright):
   ```bash
   npm install @axe-core/playwright
   ```

8. Validar contraste con **Lighthouse** en producción (objetivo: ≥90 en
   pestaña Accessibility).

### Prioridad baja (compliance AAA, opcional)

9. Alternativas textuales de los audios clínicos (transcripciones). Esto
   tiene tensión pedagógica: la formación auditiva por definición no se
   puede transcribir. Decisión a documentar formalmente.

10. Soporte completo a `prefers-reduced-motion` para usuarios con vestibular
    sensitivity.

## Cómo verificar tras cambios

```bash
# Manual:
# 1. Navegar el panel SOLO con teclado (Tab, Enter, Space, Esc).
# 2. Activar lector de pantalla:
#    - Windows: NVDA (gratuito) o JAWS
#    - Mac:     VoiceOver (Cmd+F5)
#    - Linux:   Orca
# 3. Verificar que cada botón de icono se anuncia con su propósito.

# Automatizado (Chrome DevTools):
# F12 → Lighthouse → Categoría "Accessibility" → Run audit
# Objetivo: ≥90 puntos

# Con axe (Chrome extension):
# https://chrome.google.com/webstore/detail/axe-devtools
```

## Referencias

- WCAG 2.1: https://www.w3.org/TR/WCAG21/
- Ionic Accessibility: https://ionicframework.com/docs/theming/accessibility
- ARIA Authoring Practices: https://www.w3.org/WAI/ARIA/apg/
- axe DevTools: https://www.deque.com/axe/
