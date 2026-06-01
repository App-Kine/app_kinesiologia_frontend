import { Routes } from '@angular/router';

/**
 * Rutas de la APP MÓVIL del ESTUDIANTE (Ionic + Capacitor).
 * El panel docente/admin vive en `app_kinesiologia_panel` (web).
 *
 * Todo el flujo del estudiante es PÚBLICO (sin login) — RF-01.
 *
 * Mapa de rutas:
 *   /estudiante/home                 → home con 2 opciones (auscultación / tests)
 *   /estudiante/auscultacion         → modelo 3D con hotspots (modo libre)
 *   /estudiante/cursos               → lista de cursos (flujo tests)
 *   /estudiante/curso/:id/tests      → tests del curso
 *   /estudiante/inicio/:aplicacionId → splash + modalidad anónima/identificada
 *   /estudiante/evaluacion/:id       → preguntas
 *   /estudiante/resultado/:id        → resultados + descargar PDF
 */
export const routes: Routes = [
  // -----------------------------------------------------------
  // Home del estudiante (pedido cliente 2026-05-27)
  // -----------------------------------------------------------
  {
    path: 'estudiante/home',
    loadComponent: () =>
      import('./project/pages/estudiante-home/estudiante-home.page').then(
        (m) => m.EstudianteHomePage
      ),
  },
  {
    path: 'estudiante/auscultacion',
    loadComponent: () =>
      import('./project/pages/estudiante-auscultacion/estudiante-auscultacion.page').then(
        (m) => m.EstudianteAuscultacionPage
      ),
  },

  // -----------------------------------------------------------
  // Flujo de tests (existente)
  // -----------------------------------------------------------
  {
    path: 'estudiante/cursos',
    loadComponent: () =>
      import('./project/pages/estudiante-cursos/estudiante-cursos.page').then(
        (m) => m.EstudianteCursosPage
      ),
  },
  {
    path: 'estudiante/curso/:cursoId/tests',
    loadComponent: () =>
      import('./project/pages/estudiante-tests/estudiante-tests.page').then(
        (m) => m.EstudianteTestsPage
      ),
  },
  {
    path: 'estudiante/inicio/:aplicacionId',
    loadComponent: () =>
      import('./project/pages/estudiante-inicio/estudiante-inicio.page').then(
        (m) => m.EstudianteInicioPage
      ),
  },
  {
    path: 'estudiante/evaluacion/:evaluacionId',
    loadComponent: () =>
      import('./project/pages/estudiante-evaluacion/estudiante-evaluacion.page').then(
        (m) => m.EstudianteEvaluacionPage
      ),
  },
  {
    path: 'estudiante/resultado/:evaluacionId',
    loadComponent: () =>
      import('./project/pages/estudiante-resultado/estudiante-resultado.page').then(
        (m) => m.EstudianteResultadoPage
      ),
  },

  // -----------------------------------------------------------
  // Raíz: home con las 2 opciones
  // -----------------------------------------------------------
  {
    path: '',
    redirectTo: '/estudiante/home',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '/estudiante/home',
  },
];
