import { Routes } from '@angular/router';
import { PROFESOR_ROUTES } from './profesor/profesor.routes';

/**
 * Rutas de la APP UNIFICADA de Auris (web + móvil con Capacitor).
 *
 * Una sola app con dos mundos que comparten backend (Controlador + Lógica):
 *   - Landing  (`/`)                 → portada con dos botones (estudiante / profesor).
 *   - Estudiante (`/estudiante/...`) → flujo del alumno, PÚBLICO (sin login).
 *   - Profesor  (login, mis-cursos, analitica, ...) → panel docente/admin (JWT).
 *
 * Las rutas del profesor viven en `profesor/profesor.routes.ts` y se montan
 * PLANAS (al mismo nivel) para no romper las navegaciones internas del panel
 * (que usan rutas absolutas como `/login`, `/panel-docente`, `/mis-cursos`).
 * No hay colisión: el estudiante usa el prefijo `estudiante/` y el panel usa
 * nombres propios.
 */
export const routes: Routes = [
  // -----------------------------------------------------------
  // Landing (entrada común)
  // -----------------------------------------------------------
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./landing/landing.page').then((m) => m.LandingPage),
  },

  // -----------------------------------------------------------
  // Flujo del ESTUDIANTE (público, sin login)
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
    path: 'estudiante/evaluacion/:aplicacionId',
    loadComponent: () =>
      import('./project/pages/estudiante-evaluacion/estudiante-evaluacion.page').then(
        (m) => m.EstudianteEvaluacionPage
      ),
  },
  {
    path: 'estudiante/resultado/:evaluacionUuid',
    loadComponent: () =>
      import('./project/pages/estudiante-resultado/estudiante-resultado.page').then(
        (m) => m.EstudianteResultadoPage
      ),
  },

  // -----------------------------------------------------------
  // Flujo del PROFESOR (panel docente/admin — login + guards JWT)
  // -----------------------------------------------------------
  ...PROFESOR_ROUTES,

  // -----------------------------------------------------------
  // Cualquier otra URL → landing
  // -----------------------------------------------------------
  {
    path: '**',
    redirectTo: '',
  },
];
