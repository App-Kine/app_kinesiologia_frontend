# Auris · App Móvil del Estudiante

**App Ionic + Angular 20 + Capacitor 7** para Android/iOS (y también ejecutable en navegador). Es la app del **estudiante** de la plataforma de auscultación Auris. Tiene tres capacidades principales:

- **Exploración 3D de auscultación**: un modelo del torso (`torso.glb`, renderizado con `<model-viewer>` + three.js) con *hotspots* numerados; al tocar uno se ve el nombre, la ubicación y la descripción clínica del punto.
- **Evaluaciones (tests)**: el estudiante elige curso → test → responde preguntas (con audio/imagen/video y **espectrograma** en vivo bajo el audio) → ve su resultado.
- **Informe PDF + envío por correo**: al terminar genera un **PDF** del informe (con `jsPDF`) que puede descargar/compartir; si rindió identificándose con un email, además puede **recibir ese mismo PDF por correo**.

**100 % pública** — el flujo del estudiante **NO requiere login**. Puede rendir como anónimo o identificarse con su email solo para recibir el informe por correo.

> **Setup completo del entorno (BD + 3 servicios):** ver [`../app_kinesiologia_logica/database/SETUP.md`](../app_kinesiologia_logica/database/SETUP.md)

> ⚠️ **Esta app NO se conecta a ninguna base de datos.** Consume el **Controlador** (gateway, puerto `3023`) y la **Lógica** (multimedia, puerto `2000`). Toda la BD (SQL Server + MongoDB) la maneja la Lógica. Ver [Conexión a la base de datos](#-conexión-a-la-base-de-datos) y [Levantar el sistema completo](#-levantar-el-sistema-completo-en-local).

---

## 📋 Información para la revisión técnica (DTIC / Ciberseguridad)

App del **estudiante** (Ionic + Angular 20 + Capacitor 7), navegador y Android/iOS. **100 % pública, sin login.** Consume el gateway (Controlador, 3023) y sube/descarga multimedia directo a la Lógica (2000). No guarda credenciales ni datos sensibles en el dispositivo (solo un token efímero si aplica).

| Ítem solicitado | Sección |
|---|---|
| Descripción general | Encabezado + ["¿Dónde encaja esto?"](#-dónde-encaja-esto) |
| Estructura de carpetas | ["🗂 Estructura"](#-estructura) |
| Tecnologías y versiones | ["Tecnologías y versiones"](#tecnologías-y-versiones) (abajo) |
| Instalación y ejecución (web) | ["🚀 Setup web"](#-setup-web-5-min) |
| Instalación y ejecución (móvil) | ["📱 Setup móvil (Capacitor)"](#-setup-móvil-capacitor-androidios) |
| Variables de entorno | ["Configuración de entorno"](#configuración-de-entorno) (abajo) |
| Credenciales de prueba | ["🔑 Credenciales de acceso"](#-credenciales-de-acceso-para-pruebas) (app pública, sin login) |
| Conexión a la base de datos | ["🗄 Conexión a la base de datos"](#-conexión-a-la-base-de-datos) (no toca BD — consume el Controlador) |
| Endpoints / servicios | ["🔌 Endpoints / servicios"](#-endpoints--servicios-relevantes) + ["Configuración de entorno"](#configuración-de-entorno) |
| Levantar el sistema completo | ["▶ Levantar el sistema completo"](#-levantar-el-sistema-completo-en-local) |
| Tests | ["🧪 Tests"](#-tests-karmajasmine) |

### Tecnologías y versiones

| Componente | Versión (de `package.json`) | Para qué |
|---|---|---|
| Angular | `^20.0.0` (standalone, `@if`/`@for`, sin NgModule) | Framework SPA |
| Ionic | `@ionic/angular ^8.0.0` | UI móvil (componentes, theming) |
| Capacitor | `core/cli/android/ios ^7.0.0` (`@capacitor/android ^7.6.6`) | Empaquetado nativo Android/iOS |
| Modelo 3D | `@google/model-viewer ^4.0.0` + `three ^0.169.0` | Torso 3D (`torso.glb`) con hotspots |
| Informe PDF | `jspdf ^4.2.1` | Genera el PDF del informe (descarga / adjunto correo) |
| Multimedia nativa | `@capacitor/filesystem ^7.1.8`, `@capacitor/share ^7.0.4` | Guardar/compartir el PDF en el dispositivo |
| Storage token | `@ionic-native/native-storage ^5.36.0` + `cordova-plugin-nativestorage` | Token efímero (fallback a `localStorage` en web) |
| Reactividad | `rxjs ~7.8.0`, `zone.js ~0.15.0` | HTTP + ciclo de vida |
| Iconos | `ionicons ^7.0.0` | Iconografía |
| TypeScript | `~5.9.0` | Lenguaje |
| Tests | Karma `~6.4.0` + Jasmine `~5.1.0` + Puppeteer `^24.43.1` | Unit tests (92 tests) |
| Node | **Node 20** (NO Node 22 — ver nota abajo) | Runtime de build |
| Angular CLI | `@angular/cli ^20.0.0` | `ng serve` / `ng build` |
| Build | `ng build` → genera `www/`; móvil usa `--configuration development` | Compilación |

### Configuración de entorno

No usa variables de entorno del sistema operativo. **Toda la configuración vive en dos archivos** que se compilan dentro del bundle:

- **`src/environments/environment.ts`** → usado en DEV (`npm start`, build móvil `--configuration development`).
- **`src/environments/environment.prod.ts`** → usado en el build de producción (`ng build` por defecto).

| Clave | Descripción | `environment.ts` (DEV) | `environment.prod.ts` (PROD) |
|---|---|---|---|
| `production` | Flag de build | `false` | `true` |
| `BASE_API_URL` | URL del **Controlador** (gateway). Cursos, tests, evaluación, informe. | `http://localhost:3023/controlador_base/` | `https://CAMBIAR-DOMINIO-PRODUCCION/controlador_base/` |
| `LOGICA_API_URL` | URL de la **Lógica** (multimedia directa: audio/imagen/video). | `http://localhost:2000/base_logica/` | `https://CAMBIAR-DOMINIO-PRODUCCION/base_logica/` |
| `DATA_KEY_TOKEN` | Clave del token efímero en storage | `'token'` | `'token'` |
| `ERROR_EXPIRED_TOKEN` | Mensaje de sesión expirada | `'Su sesión ha expirado'` | idem |
| `PAGES` | Mapa interno de rutas auxiliares | `{ home, novedades }` | idem |

> **⚠️ Producción:** los valores `https://CAMBIAR-DOMINIO-PRODUCCION/...` son **placeholders**. DTIC/infra debe reemplazarlos por el dominio institucional **HTTPS real** (ej. `https://auris.uv.cl/api/controlador_base/`) **antes de compilar**. No debe quedar `http://` ni `localhost` en producción.

> **Probar en celular físico:** ver [Setup móvil](#-setup-móvil-capacitor-androidios). Hay que reemplazar `localhost` por la **IP de la Mac en la WiFi** (el teléfono no resuelve `localhost`) y recompilar.

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

## 🔑 Credenciales de acceso (para pruebas)

**El flujo del estudiante es PÚBLICO: NO requiere login ni credenciales.** El revisor puede abrir la app y usarla directamente (rinde como anónimo o se identifica con un email solo para recibir el informe por correo).

Para que la app **muestre datos** (cursos, tests, preguntas con su multimedia), esos datos deben existir primero. Se crean desde el **Panel docente** (`app_kinesiologia_panel`, puerto 4200), que **sí** tiene login. Credenciales de prueba del Panel:

| Rol | Usuario | Clave |
|---|---|---|
| Admin (Panel) | `admin@auris.local` | `ChangeMe!2026` |

> Estas credenciales son **solo del Panel**, no de esta app. Esta app no almacena ni valida credenciales.

---

## 🗄 Conexión a la base de datos

**Esta app NO se conecta a ninguna base de datos** y no contiene strings de conexión, drivers ni credenciales de BD. Toda la persistencia (SQL Server + MongoDB) la maneja el servicio de **Lógica**. El flujo es:

```
App estudiante  ──HTTP──>  Controlador (3023)  ──>  Lógica (2000)  ──>  SQL Server + MongoDB
   (este repo)                 gateway                backend datos          bases de datos
```

- Para **datos** (cursos, tests, evaluación, informe) la app llama al **Controlador** (`BASE_API_URL`, puerto **3023**), que reenvía a la Lógica.
- Para **multimedia** (audio/imagen/video) la app llama **directo a la Lógica** (`LOGICA_API_URL`, puerto **2000**), porque es streaming / multipart y no conviene pasarlo por el gateway.

Por eso, para "conectar la app a la BD" en realidad hay que **levantar el backend** en el orden de [Levantar el sistema completo](#-levantar-el-sistema-completo-en-local). La configuración de SQL Server / MongoDB vive en `app_kinesiologia_logica` (ver su `database/SETUP.md`).

---

## 🔌 Endpoints / servicios relevantes

La app habla con **dos servicios**, configurados en [`environment.*`](#configuración-de-entorno):

| Servicio | Variable | Puerto (dev) | Qué consume |
|---|---|---|---|
| **Controlador** (gateway) | `BASE_API_URL` | 3023 | Cursos, tests, iniciar/responder/finalizar evaluación, informe completo, envío de informe por correo |
| **Lógica** (datos/multimedia) | `LOGICA_API_URL` | 2000 | Streaming de audio / imagen / video de las preguntas |

Ejemplos reales en el código:

```ts
// Datos → Controlador (BASE_API_URL)
this.post(this.url + 'evaluacion/iniciar', { aplicacionId, modalidad });
this.post(this.url + 'evaluacion/informeCompleto', { evaluacionUuid });

// Multimedia → Lógica (LOGICA_API_URL), directo
this.media.urlAudio(pregunta.audio_grid_id);
// → http://localhost:2000/base_logica/multimedia/audio/<gridId>
```

Servicios Angular involucrados (en `src/app/project/services/`):
- `evaluacion.service.ts` — iniciar, responder, finalizar, informe completo, enviar informe.
- `multimedia.service.ts` — construye URLs de audio/imagen/video contra la Lógica.

---

## 📦 Stack

- **Ionic 8** + **Angular 20** standalone components (`@if`, `@for`, no NgModule)
- **Capacitor 7** (iOS/Android)
- **@google/model-viewer** + **three.js** para el torso 3D con hotspots
- **Web Audio API** (AnalyserNode + canvas) para el espectrograma en vivo
- **jsPDF** para el informe PDF (descarga / compartir nativo / adjunto de correo)
- **@capacitor/filesystem** + **@capacitor/share** para guardar/compartir el PDF en el dispositivo
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

## ▶ Levantar el sistema completo (en local)

Esta app es **el último eslabón**: necesita el backend arriba para mostrar datos. Orden de arranque obligatorio:

```text
1. Bases de datos:   SQL Server  +  MongoDB        (ver ../app_kinesiologia_logica/database/SETUP.md)
2. Lógica:           app_kinesiologia_logica        → puerto 2000
3. Controlador:      app_kinesiologia_controlador    → puerto 3023
4. App estudiante:   este repo                        → npm start (puerto 4201)
   (opcional) Panel: app_kinesiologia_panel           → puerto 4200  (para crear cursos/tests de prueba)
```

Si la app abre pero no muestra cursos, lo más probable es que falte levantar la Lógica (2000) o el Controlador (3023), o que no haya datos creados desde el Panel.

---

## 🚀 Setup web (5 min)

Para correr en navegador (testing rápido del flujo del estudiante).

```bash
npm install --legacy-peer-deps
npm start                       # = ng serve --port 4201
# abre http://localhost:4201
# la raíz / redirige a /estudiante/home
```

⚠️ El `--legacy-peer-deps` es necesario por un conflicto entre `@ionic-native/native-storage` (que pide rxjs 5/6) y el resto del proyecto (rxjs 7). Sin ese flag, npm rechaza la instalación.

> Recordá tener arriba la Lógica (2000) y el Controlador (3023) — ver [Levantar el sistema completo](#-levantar-el-sistema-completo-en-local).

---

## 📱 Setup móvil (Capacitor · Android/iOS)

El proyecto ya está configurado con Capacitor 7. Los **scripts de `package.json`** automatizan el ciclo build + sync + run (todos compilan en modo **development**, para usar `environment.ts` y NO el de producción):

```jsonc
"sync":        "ng build --configuration development && npx cap sync",
"android":     "ng build --configuration development && npx cap sync android && npx cap run android",
"ios":         "ng build --configuration development && npx cap sync ios && npx cap run ios",
"open:android":"npx cap open android",
"open:ios":    "npx cap open ios"
```

### Requisitos

| Plataforma | Necesitás |
|---|---|
| Android | **Android Studio** + **JDK 21** (el que trae Android Studio). `@capacitor/android` ya está instalado. |
| iOS | **Xcode** + **CocoaPods** (macOS). |
| Ambas | **Node 20** y haber corrido `npm install --legacy-peer-deps`. |

### Android

```bash
npm install --legacy-peer-deps
npx cap add android          # solo la 1ª vez (crea la carpeta android/)
npm run android              # build dev + sync + run en emulador/dispositivo
# o, para abrir Android Studio y darle Play manualmente:
npm run open:android
```

### iOS

```bash
npm install --legacy-peer-deps
npx cap add ios              # solo la 1ª vez (crea ios/ y corre pod install)
npm run ios                  # build dev + sync + run
# o abrir Xcode manualmente:
npm run open:ios
```

> Existe además un script `setup-ios.command` / `setup-ios.sh` que hace el primer setup de iOS de punta a punta (verifica Xcode/CocoaPods/Node 20, agrega la plataforma, parchea `Info.plist` para permitir HTTP plano y abre Xcode).

### Loop de desarrollo

Cada vez que cambies TS/HTML/SCSS, re-sincronizá el código nativo:

```bash
npm run sync                 # build dev + cap sync (ambas plataformas)
# y volvé a darle Play / Run, o usá npm run android / npm run ios
```

### HTTP en DEV (cleartext)

`capacitor.config.ts` está en `androidScheme: 'http'` + `cleartext: true` + `android.allowMixedContent: true`. Esto permite que la app (servida desde `http://localhost`) hable con el backend de DEV por **HTTP plano** sin que Android lo bloquee como *mixed content*. En iOS el `setup-ios.command` parchea `NSAllowsArbitraryLoads` en `Info.plist` por el mismo motivo. **En producción se vuelve a HTTPS** (backend con TLS) y se quita el cleartext.

### 📱 Para probar en un celular FÍSICO (iPhone / Android)

> **El archivo que se edita es `src/environments/environment.ts`.** `localhost`
> **no resuelve desde el teléfono** (apunta al propio dispositivo), así que hay
> que apuntar a la **IP del Mac** en la WiFi. En el **simulador iOS** y en el
> **navegador** sí funciona `localhost` (no hace falta cambiar nada).

**Requisitos:** Mac y teléfono en la **MISMA red WiFi**, y los backends
(Controlador `:3023` + Lógica `:2000`) **corriendo**.

**1. Obtené la IP del Mac:**
```bash
ipconfig getifaddr en0      # ej. 192.168.1.84
```

**2. Editá `src/environments/environment.ts`** — reemplazá `localhost` por esa IP en las DOS líneas:
```ts
//  ANTES (DEV web / simulador):
BASE_API_URL:  'http://localhost:3023/controlador_base/',
LOGICA_API_URL:'http://localhost:2000/base_logica/',

//  DESPUÉS (celular físico) — usá TU IP:
BASE_API_URL:  'http://192.168.1.84:3023/controlador_base/',
LOGICA_API_URL:'http://192.168.1.84:2000/base_logica/',
```

**3. Recompilá y desplegá al teléfono:**

- **Android:**
  ```bash
  npm run android
  ```
- **iOS (iPhone físico):** evitá `npm run ios` si CocoaPods da error; usá:
  ```bash
  npx ng build --configuration development
  npx cap copy ios          # copia el nuevo bundle (con la IP) al proyecto iOS
  npx cap open ios          # abre Xcode → seleccioná tu iPhone → ▶ Run
  ```

**4.** Verificá que el firewall del Mac no bloquee los puertos 2000/3023 (los
servidores ya escuchan en `0.0.0.0`, aceptan conexiones de la red).

> ⚠️ **Antes del commit / entrega final: volvé a dejar `localhost`** en
> `environment.ts` (la IP es específica de tu máquina y red). Para producción se
> usa `environment.prod.ts` con el dominio HTTPS real.

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
/estudiante/resultado/:evaluacionUuid  → score + descargar PDF + enviar por correo
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

### Informe PDF + envío por correo

`estudiante-resultado.page.ts`:
1. Pide el informe completo al Controlador (POST a `evaluacion/informeCompleto`, público): cabecera + preguntas con alternativas, qué eligió el estudiante, tiempo y explicación.
2. Construye un **PDF real con `jsPDF`** (escribiendo el texto directamente; A4). El documento se **cachea por `evaluacion_uuid`** para no generarlo dos veces (descargar + enviar reutilizan el mismo).
3. **Descargar** (`descargarInforme()`, disponible para anónimos e identificados):
   - **App nativa (Capacitor):** escribe el PDF en el almacenamiento de la app (`@capacitor/filesystem`) y abre el menú nativo **Compartir / Guardar en Archivos** (`@capacitor/share`).
   - **Web:** descarga directa del archivo PDF.
4. **Enviar por correo** (`enviarInforme()`, solo modalidad **identificada** con email): adjunta el **mismo PDF** (base64) al correo. El PDF viaja por el servidor solo en memoria para adjuntarlo; **no se guarda en BD ni en disco**. Si la generación del PDF fallara, el correo igual se envía sin adjunto para no bloquear al usuario.

---

## 🧪 Tests (Karma/Jasmine)

El repo tiene **92 tests** unitarios (Karma + Jasmine). Para correrlos sin abrir navegador (modo CI):

```bash
npx ng test --watch=false --browsers=ChromeHeadlessCI
```

`karma.conf.js` usa automáticamente el **Chromium que trae Puppeteer** (Puppeteer es devDependency), así no hace falta tener Chrome instalado en el sistema. Si querés el modo interactivo con UI, basta `npm test` (= `ng test`).

---

## 🛠 Build (compilar)

```bash
# Build de producción (usa environment.prod.ts) → genera www/
npm run build            # = ng build

# Build de desarrollo (usa environment.ts) → el que usa el flujo móvil
ng build --configuration development

# Verificación rápida: exit 0 + sin "error TS" = OK
```

Para móvil, recordá re-sincronizar el código nativo tras compilar: `npm run sync` (o directamente `npm run android` / `npm run ios`, que ya hacen build dev + sync + run).

---

## 🐛 Troubleshooting

**`The Capacitor CLI requires NodeJS >=22`** → estás corriendo `npx cap add ios` con Node viejo, pero también significa que tu `package.json` se actualizó a Capacitor 8. Restaurá `package.json` a `^7.0.0` para todas las deps `@capacitor/*` (ya lo dejamos así en este repo).

**`npm install` falla con `ERESOLVE could not resolve`** → siempre instalá con `--legacy-peer-deps`. Es por el conflicto rxjs/Cordova-legacy.

**`Http failure response: 0 Unknown Error`** al subir/cargar multimedia → CORS preflight. Verificá que la lógica esté respondiendo `204` al `OPTIONS` antes del POST (ya está implementado en `index.js` de la lógica).

**El audio/video no reproduce en iOS** → revisá que el Info.plist tenga `NSAllowsArbitraryLoads = true` (el `setup-ios.command` lo hace solo). Sin eso, iOS bloquea HTTP plano.

**Pantalla blanca en el simulator** → el `www/` está viejo. `npm run build && npx cap sync ios` y volvé a apretar Play.

**`pod install` falla con error de FFI en Mac M1/M2** → `sudo arch -x86_64 gem install ffi` y reintentá.

**Android: el build de Gradle falla por versión de Java** → usá el **JDK 21** que trae Android Studio (Settings → Build Tools → Gradle → Gradle JDK). Capacitor 7 + AGP requieren JDK 17+, y el equipo usa el 21.

**Android: pantalla blanca / no carga datos** → regenerá el bundle nativo con `npm run sync` (o `npm run android`); y en celular físico recordá cambiar `localhost` por la IP del Mac (ver [Para correr en un celular físico](#-para-correr-en-un-celular-físico)).

---

## 🤝 Convenciones de equipo

- **No commitear `package-lock.json`** (está en `.gitignore`).
- **No commitear las carpetas `ios/` ni `android/`** ni `www/` (gitignored). Cada dev las regenera con `npx cap add ios` / `npx cap add android` (o `setup-ios.command`).
- Si cambiás algo en `capacitor.config.ts` (appId, appName), hay que volver a correr `npm run sync` (o `npx cap sync`) para que se propague al proyecto nativo.
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
