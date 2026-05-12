# App Base Frontend

Este es el proyecto frontend base construido con Ionic y Angular.

## Características Implementadas

### Home Page (Vista Principal)
Ruta: `src/app/project/pages/home`

La vista de inicio incluye una demostración de integración entre la interfaz de usuario de Ionic y el consumo de servicios HTTP.

**Detalles de Implementación:**
- **Consumo de API:** Al inicializar el componente (`ngOnInit`), se ejecuta una petición mediante el servicio `EnlacesService.getExampleData({})`.
- **Procesamiento de Datos:** La respuesta del servicio se extrae de forma segura y se almacena en una variable local `options` (un arreglo).
- **Interfaz Gráfica:** 
  - Se implementó un `<ion-select>` dentro de un `<ion-list>` para mostrar los datos obtenidos (ej. listado de Facultades).
  - Se utiliza la sintaxis de control de flujo nativa de Angular (`@for (option of options; track $index)`) para iterar y renderizar dinámicamente cada `<ion-select-option>` con el nombre de cada opción (`option.nombre`).
- **Arquitectura Standalone:** El componente está diseñado utilizando la arquitectura *standalone* de Angular 14+, importando directamente los módulos necesarios de Ionic (`IonItem`, `IonSelect`, `IonList`, etc.) sin depender de un módulo tradicional (`NgModule`).

### Servicios
Ruta: `src/app/project/services`

- **`servicio-ejemplo.service.ts` (EnlacesService):**
  Extiende de `BaseService` y proporciona el método `getExampleData()`, el cual realiza una petición HTTP POST (`this.post(this.url + 'getData', args)`) hacia el backend para recuperar los datos mostrados en la vista.

## Requisitos y Configuración Local

- **Node.js**: El proyecto requiere la versión **v20.19** o **v22.12** como mínimo debido a la versión de Angular CLI utilizada (Angular v20). 
- **Ionic CLI**: Instalado globalmente (`npm install -g @ionic/cli`).
- **Angular CLI**: Instalado globalmente (`npm install -g @angular/cli`).
- **Puerto de desarrollo**: El comando `ionic serve` suele ejecutarse por defecto en el puerto `8100`. Si el puerto base está ocupado, se ejecutará en otro disponible.

### Uso de NVM (Node Version Manager)

Si tienes problemas con las versiones de node, se recomienda utilizar **NVM** para gestionar las versiones.

**Pasos útiles con NVM:**
1. **Verificar versión actual:**
   ```bash
   node -v
   ```
2. **Instalar la versión requerida de Node.js** (por ejemplo la versión 20.19.0):
   ```bash
   nvm install 20.19.0
   ```
3. **Cambiar a la versión requerida:**
   ```bash
   nvm use 20.19.0
   ```
4. **Establecer una versión por defecto** en el sistema:
   ```bash
   nvm alias default 20.19.0
   ```
Una vez que hayas cambiado a la versión `v20.19.x` o superior, podrás ejecutar los comandos de compilación y levantamiento sin problemas.
## Instalación y Ejecución

1. **Clonar el repositorio:**
   ```bash
   git clone <url-del-repositorio>
   cd app_base_frontend
   ```

2. **Instalar dependencias:**
   Ejecuta el siguiente comando en la raíz del proyecto para descargar todas las dependencias necesarias:
   ```bash
   npm install
   ```

3. **Ejecutar en modo desarrollo:**
   Levanta un servidor local con recarga en vivo (live-reload):
   ```bash
   ionic serve
   # O alternativamente:
   npm start
   ```
   La aplicación debería abrirse automáticamente en tu navegador por defecto (usualmente en `http://localhost:8100/`).

4. **Compilar para producción:**
   Para generar la versión optimizada de la aplicación lista para despliegue web:
   ```bash
   ionic build
   # O alternativamente:
   npm run build
   ```

## Configuración de Entorno (Conexión al Backend)

El frontend está preconfigurado para comunicarse con el servicio backend (Controlador Base) ejecutándose de manera local en el **puerto 3023**.

Puedes modificar las variables de entorno relacionadas a la URL de conexión dentro del directorio `src/environments/`:

- **Desarrollo** (`src/environments/environment.ts`):
  ```typescript
  export const environment = {
    production: false,
    BASE_API_URL: 'http://localhost:3023/controlador_base/',
    // ...
  };
  ```

- **Producción** (`src/environments/environment.prod.ts`):
  ```typescript
  export const environment = {
    production: true,
    BASE_API_URL: 'http://localhost:3023/controlador_base/', // Cambiar por dominio real en prod
    // ...
  };
  ```
  
Asegúrate de que tu [Controlador Base](https://github.com/dticuv/app_base_controlador) y su [Lógica Base](https://github.com/dticuv/app_base_logica) se encuentren en ejecución para que la petición de `home.page.ts` responda correctamente al arrancar el proyecto.

## Compilación para Dispositivos Móviles (iOS y Android)

Este proyecto utiliza **Capacitor** para empaquetar la aplicación web en plataformas nativas. Sigue estos pasos para agregar y compilar las plataformas móviles:

### 1. Requisitos Previos para Móviles
- **Para Android:** Necesitas tener instalado [Android Studio](https://developer.android.com/studio) y las variables de entorno de Android configuradas.
- **Para iOS:** Necesitas un entorno macOS con [Xcode](https://developer.apple.com/xcode/) instalado.

### 2. Generar el Build Web
Antes de agregar las plataformas nativas, debes compilar el proyecto web:
```bash
ionic build
```

### 3. Agregar Plataformas
Para inicializar y añadir las carpetas de los proyectos nativos (esto solo se hace una vez por plataforma):

**Agregar Android:**
```bash
npm install @capacitor/android
npx cap add android
```

**Agregar iOS:**
```bash
npm install @capacitor/ios
npx cap add ios
```

### 4. Sincronizar Cambios y Abrir IDEs
Cada vez que hagas un cambio en tu código de Angular/Ionic, debes compilar el proyecto web y sincronizar los cambios con los proyectos nativos:
```bash
ionic build
npx cap sync
```

Para abrir los proyectos en sus respectivos IDEs y probar en emuladores o dispositivos físicos:
- **Abrir Android Studio:** `npx cap open android`
- **Abrir Xcode:** `npx cap open ios`
