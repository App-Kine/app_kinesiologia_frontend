import { Routes } from '@angular/router';

/**
 * Rutas de la APP MÓVIL del ESTUDIANTE (Ionic + Capacitor).
 * El panel docente/admin vive en `app_kinesiologia_panel` (web).
 *
 * Todo el flujo del estudiante es PÚBLICO (sin login) — RF-01:
 *   /estudiante/cursos               → lista de cursos
 *   /estudiante/curso/:id/tests      → tests del curso
 *   /estudiante/inicio/:aplicacionId → splash + modalidad anónima/identificada
 *   /estudiante/evaluacion/:id       → preguntas
 *   /estudiante/resultado/:id        → resultados + descargar PDF
 */
export const routes: Routes = [
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

  // Raíz: lista de cursos
  {
    path: '',
    redirectTo: '/estudiante/cursos',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '/estudiante/cursos',
  },
];
