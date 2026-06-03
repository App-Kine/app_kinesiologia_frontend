# Auris · App Móvil del Estudiante

**App Ionic + Angular 20 + Capacitor** para iOS/Android. Es la app del estudiante, con dos partes:
- **Exploración 3D de auscultación**: un modelo del torso (`<model-viewer>` + three.js) con *hotspots* numerados; al tocar uno se ve nombre, ubicación y descripción clínica del punto.
- **Tests**: el estudiante elige curso → test → responde preguntas (con audio/imagen/video y **espectrograma** en vivo bajo el audio) → ve resultado y descarga el informe.

**100 % pública** — sin login. Puede rendir como anónimo o identificarse con email para recibir el informe.

> **Setup completo del entorno (BD + 3 servicios):** ver [`../app_kinesiologia_logica/database/SETUP.md`](../app_kinesiologia_logica/database/SETUP.md)

---

## 📋 Información para la revisión técnica (DTIC / Ciberseguridad)

App del **estudiante** (Ionic + Angular 20 + Capacitor 7), web y iOS. **100 % pública, sin login.** Consume el gateway (Controlador, 3023) y sube/descarga multimedia directo a la Lógica (2000). No guarda credenciales ni datos sensibles en el dispositivo (solo un token efímero si aplica).

| Ítem solicitado | Sección |
|---|---|
| Descripción general | Encabezado + "¿Dónde encaja esto?" |
| Estructura de carpetas | "🗂 Estructura" |
| Tecnologías y versiones | "Tecnologías y versiones" (abajo) |
| Instalación y ejecución | "🚀 Setup web" / "📱 Setup iOS" |
| Variables de entorno | "Configuración de entorno" (abajo) |
| Credenciales de prueba | No aplica (app pública, sin login) |
| Conexión a la base de datos | No aplica (no toca BD — consume el Controlador) |
| Endpoints / servicios | "Configuración de entorno" (URLs de API) |

### Tecnologías y versiones

| Componente | Versión |
|---|---|
| Angular | 20 |
| Ionic | 8 |
| Capacitor | 7 (iOS) |
| 3D | `@google/model-viewer` 4 + `three` 0.169 |
| Node/CLI para build | Node ≥ 18, Angular CLI 20 |
| Build de producción | `npx ng build` (genera `www/`) |

### Configuración de entorno

No usa variables de entorno del sistema; la configuración vive en **`src/environments/environment.ts`** (dev) y **`environment.prod.ts`** (build de producción):

| Clave | Descripción | Ejemplo |
|---|---|---|
| `BASE_API_URL` | URL del Controlador (gateway) | `http://localhost:3023/controlador_base/` |
| `LOGICA_API_URL` | URL de la Lógica (multimedia directa) | `http://localhost:2000/base_logica/` |
| `production` | Flag de build | `true` en `environment.prod.ts` |

> Para probar en **iPhone físico** se reemplaza `localhost` por la IP de la máquina en la red local (el teléfono no resuelve `localhost`). En producción, apuntar ambas URLs al dominio institucional (HTTPS).

---

## 🧭 ¿Dónde encaja esto?

```
┌─────────────────────┐   ┌──────────────────────┐
│  Panel WEB          │   │  APP MÓVIL           │ ← TÚ ESTÁS ACÁ
│  (docente/admin)    │   │  (estudiante)        │
│  app_kinesiologia   │   │  Ionic + Capacitor   │
│  _panel · :4200     │   │  :4201 / iOS/Android │
└─────────┬───────────┘   └──────────┬───────────┘
          │                          │
          │  JWT                     │  Público
          └────────────┬─────────────┘
                       │
                ┌──────▼──────┐
                │ Controlador │ :3023
                └──────┬──────┘
                       │
                ┌──────▼──────┐
                │   Lógica    │ :2000
                └──────┬──────┘
                       │
              ┌────────┴────────┐
              ▼                 ▼
          SQL Server         MongoDB
```

**Comparte backend** con el panel web — ambos pegan al mismo controlador (`localhost:3023`).

---

## 📦 Stack

- **Ionic 8** + **Angular 20** standalone components (`@if`, `@for`, no NgModule)
- **Capacitor 7** (iOS/Android)
- **@google/model-viewer** + **three.js** para el torso 3D con hotspots
- **Web Audio API** (AnalyserNode + canvas) para el espectrograma en vivo
- **NativeStorage** para token persistente en mobile (legacy de Cordova, fallback a localStorage en web)
- **rxjs 7**

⚠️ **Node 20 requerido**, NO Node 22. Capacitor 7 está fijado para que funcione con Node 20 (la versión que usa el equipo).

---

## 🗂 Estructura

```
app_kinesiologia_frontend/
├── src/
│   ├── app/
│   │   ├── app.routes.ts                    # solo rutas /estudiante/*
│   │   ├── app.component.ts/html            # shell mínimo (router-outlet)
│   │   ├── base/                            # framework genérico
│   │   │   └── service/base.service.ts      # HTTP client + storage abstraction
│   │   └── project/
│   │       ├── pages/
│   │       │   ├── estudiante-home/          # home: auscultación 3D | tests
│   │       │   ├── estudiante-auscultacion/  # modelo 3D del torso + hotspots
│   │       │   ├── estudiante-cursos/        # lista de cursos
│   │       │   ├── estudiante-tests/         # tests del curso elegido
│   │       │   ├── estudiante-inicio/        # splash, elegir modalidad
│   │       │   ├── estudiante-evaluacion/    # responder preguntas (timer + audio/espectrograma)
│   │       │   └── estudiante-resultado/     # ver score + descargar PDF
│   │       ├── components/
│   │       │   └── audio-spectro/            # reproductor + espectrograma en vivo (Web Audio API)
│   │       ├── data/
│   │       │   └── puntos-auscultacion.data.ts  # hotspots del torso (con espejado L/R)
│   │       ├── pipes/safe-html.pipe.ts       # renderiza HTML rich-text seguro (sanitizado)
│   │       └── services/
│   │           ├── evaluacion.service.ts     # iniciar, responder, finalizar, descargar
│   │           ├── multimedia.service.ts     # streaming de audio/imagen/video
│   │           ├── analytics.service.ts      # base del BaseService
│   │           └── logger.ts
│   ├── environments/
│   │   ├── environment.ts                    # URLs del backend (localhost por defecto)
│   │   └── environment.prod.ts
│   ├── theme/variables.scss                  # paleta Ionic
│   ├── index.html, main.ts, styles.scss
│   └── assets/
├── capacitor.config.ts                       # appId, appName, webDir
├── setup-ios.command                         # script de setup iOS (ver abajo)
├── setup-ios.sh                              # idem (alternativo)
├── angular.json, tsconfig.*, package.json
└── README.md
```

---

## 🚀 Setup web (5 min)

Solo para correr en navegador (testing rápido del flujo).

```bash
npm install --legacy-peer-deps
npm start
# abre http://localhost:4201
# cae directo en /estudiante/cursos
```

⚠️ El `--legacy-peer-deps` es necesario por un conflicto entre `@ionic-native/native-storage` (que pide rxjs 5/6) y el resto del proyecto (rxjs 7). Sin ese flag, npm rechaza la instalación.

---

## 📱 Setup iOS (Xcode)

Tenés un script que hace TODO automático. Lo único manual es correrlo una vez:

```bash
cd ~/Desktop/Auris/app_kinesiologia_frontend
bash setup-ios.command
```

Lo que hace:
1. Verifica que tengas Xcode, CocoaPods y Node 20 instalados.
2. `npm install @capacitor/ios --legacy-peer-deps`
3. `npm run build` (genera `www/`)
4. `npx cap add ios` (crea carpeta `ios/`, corre `pod install`)
5. Parchea `Info.plist` para permitir HTTP plano a `localhost` (NSAppTransportSecurity)
6. `npx cap sync ios && npx cap open ios` → abre Xcode con el proyecto

Después en Xcode: elegís simulador (iPhone 15 Pro recomendado) y ▶ Play.

### Loop de desarrollo iOS

Cuando cambies código TS/HTML/SCSS:
```bash
npm run build && npx cap sync ios
```
Y volvés a apretar ▶ Play en Xcode.

### Para correr en iPhone físico

`localhost` no funciona en un dispositivo real (apunta al teléfono). Hay que:

1. IP de tu Mac: `ipconfig getifaddr en0` → ej `192.168.1.42`
2. Editá `src/environments/environment.ts` y `environment.prod.ts`:
   ```ts
   BASE_API_URL: 'http://192.168.1.42:3023/controlador_base/',
   LOGICA_API_URL: 'http://192.168.1.42:2000/base_logica/',
   ```
3. `npm run build && npx cap sync ios`
4. Conectá tu iPhone por cable, elegilo en Xcode, ▶ Play.

---

## 🛠 Convenciones del código

### Rutas

Todo el flujo es público:

```
/estudiante/home                       → home con 2 opciones (auscultación 3D | tests)
/estudiante/auscultacion               → modelo 3D del torso con hotspots (modo libre)
/estudiante/cursos                     → lista de cursos (flujo tests)
/estudiante/curso/:cursoId/tests       → tests disponibles del curso
/estudiante/inicio/:aplicacionId       → splash, elegir anónima vs identificada
/estudiante/evaluacion/:aplicacionId   → responder preguntas
/estudiante/resultado/:evaluacionId    → score + descargar informe PDF
```

Raíz (`/`) y wildcard (`**`) redirigen a `/estudiante/home`.

### Llamadas al backend

Para todo lo del flujo (cursos, tests, evaluación), va al **controlador** vía `BASE_API_URL`:
```ts
this.post(this.url + 'evaluacion/iniciar', { aplicacionId, modalidad });
```

Para multimedia (streaming de audio/imagen/video del estudiante), va DIRECTO a la **lógica** vía `LOGICA_API_URL`:
```ts
this.media.urlAudio(pregunta.audio_grid_id);    // → http://localhost:2000/base_logica/multimedia/audio/<gridId>
```

### Render seguro de HTML

Los enunciados y explicaciones de las preguntas vienen con formato HTML (negrita, listas, etc., generadas por el rich text editor del panel docente). Para renderizarlas:

```html
<div [innerHTML]="pregunta.enunciado | safeHtml"></div>
```

El pipe `safeHtml` (`src/app/project/pipes/safe-html.pipe.ts`) primero **sanitiza** con `DomSanitizer.sanitize(SecurityContext.HTML, …)` —conserva el formato seguro (`<p>`, `<strong>`, listas…) y elimina `<script>`, atributos `on*=`, etc.— y solo después confía el resultado **ya limpio**. Así se cierra el riesgo de XSS almacenado proveniente del rich-text del panel.

### Timer por pregunta

`estudiante-evaluacion.page.ts` arranca un `inicioPreguntaMs = Date.now()` cuando se muestra cada pregunta y lo manda al confirmar la respuesta. El backend lo persiste solo si ese intento finaliza la pregunta (acierto en 1°, acierto en 2°, o incorrecta tras 2 intentos).

### Descarga PDF

`estudiante-resultado.page.ts` tiene un método `descargarInforme()` que:
1. Hace POST a `/evaluacion/informeCompleto` (público).
2. Recibe cabecera + preguntas con alternativas, qué eligió, tiempo, explicación.
3. Construye HTML imprimible inline.
4. `window.open()` + `window.print()` → el usuario guarda como PDF desde el diálogo del navegador.

**Cero dependencias externas** — sin jsPDF ni nada.

---

## 🧪 Verificar que todo compile

```bash
npm run build
# (exit 0 + sin "error TS" = OK). Para iOS: npm run build && npx cap sync ios
```

---

## 🐛 Troubleshooting

**`The Capacitor CLI requires NodeJS >=22`** → estás corriendo `npx cap add ios` con Node viejo, pero también significa que tu `package.json` se actualizó a Capacitor 8. Restaurá `package.json` a `^7.0.0` para todas las deps `@capacitor/*` (ya lo dejamos así en este repo).

**`npm install` falla con `ERESOLVE could not resolve`** → siempre instalá con `--legacy-peer-deps`. Es por el conflicto rxjs/Cordova-legacy.

**`Http failure response: 0 Unknown Error`** al subir/cargar multimedia → CORS preflight. Verificá que la lógica esté respondiendo `204` al `OPTIONS` antes del POST (ya está implementado en `index.js` de la lógica).

**El audio/video no reproduce en iOS** → revisá que el Info.plist tenga `NSAllowsArbitraryLoads = true` (el `setup-ios.command` lo hace solo). Sin eso, iOS bloquea HTTP plano.

**Pantalla blanca en el simulator** → el `www/` está viejo. `npm run build && npx cap sync ios` y volvé a apretar Play.

**`pod install` falla con error de FFI en Mac M1/M2** → `sudo arch -x86_64 gem install ffi` y reintentá.

---

## 🤝 Convenciones de equipo

- **No commitear `package-lock.json`** (está en `.gitignore`).
- **No commitear la carpeta `ios/`** ni `www/` (gitignored). Cada dev se regenera con `setup-ios.command`.
- Si cambiás algo en `capacitor.config.ts` (appId, appName), hay que volver a correr `npx cap sync ios` para que se propague al proyecto nativo.
- No agregar componentes que no se usen en el flujo de estudiante (este repo es solo para él).

---

## 📌 Diferencia con el panel web

Si te confundís y querés tocar algo de docente/admin, **estás en el repo equivocado**. Andá a [`../app_kinesiologia_panel`](../app_kinesiologia_panel) — ahí vive todo el panel.

| | Este repo (`_frontend`) | Panel web (`_panel`) |
|---|---|---|
| Para quién | Estudiante (público) | Docente + Admin (login JWT) |
| Plataforma | iOS / Android | Web (Chrome, Safari, etc.) |
| Tecnología | Ionic + Capacitor | Angular + Ionic (sin Capacitor) |
| Puerto dev | 4201 | 4200 |
| Rutas | `/estudiante/*` | `/login`, `/panel-*`, `/mis-*`, `/curso/*`, `/test-*`, `/analitica/*` |
