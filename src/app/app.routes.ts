import { Routes } from '@angular/router';
import { authGuard } from './project/services/auth.guard';
import { adminGuard, docenteGuard } from './project/services/role.guard';

/**
 * Rutas del PANEL WEB (docente + admin).
 * El flujo del estudiante vive en el repo `app_kinesiologia_frontend` (app móvil).
 */
export const routes: Routes = [
  // -----------------------------------------------------------
  // Públicas: login + registro por invitación + recuperar contraseña
  // -----------------------------------------------------------
  {
    path: 'login',
    loadComponent: () =>
      import('./project/pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'registro-profesor/:token',
    loadComponent: () =>
      import('./project/pages/registro-profesor/registro-profesor.page').then(
        (m) => m.RegistroProfesorPage
      ),
  },
  {
    path: 'recuperar-password',
    loadComponent: () =>
      import('./project/pages/recuperar-password/recuperar-password.page').then(
        (m) => m.RecuperarPasswordPage
      ),
  },
  {
    path: 'restablecer-password/:token',
    loadComponent: () =>
      import('./project/pages/restablecer-password/restablecer-password.page').then(
        (m) => m.RestablecerPasswordPage
      ),
  },

  // -----------------------------------------------------------
  // Paneles internos (RF-54 / RF-55 / RF-56)
  // -----------------------------------------------------------
  {
    path: 'panel-admin',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./project/pages/panel-admin/panel-admin.page').then(
        (m) => m.PanelAdminPage
      ),
  },
  {
    path: 'panel-docente',
    canActivate: [docenteGuard],
    loadComponent: () =>
      import('./project/pages/panel-docente/panel-docente.page').then(
        (m) => m.PanelDocentePage
      ),
  },
  {
    path: 'seleccion-panel',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./project/pages/seleccion-panel/seleccion-panel.page').then(
        (m) => m.SeleccionPanelPage
      ),
  },

  // -----------------------------------------------------------
  // Mis cursos
  // -----------------------------------------------------------
  {
    path: 'mis-cursos',
    canActivate: [docenteGuard],
    loadComponent: () =>
      import('./project/pages/mis-cursos/mis-cursos.page').then(
        (m) => m.MisCursosPage
      ),
  },
  {
    path: 'curso-nuevo',
    canActivate: [docenteGuard],
    loadComponent: () =>
      import('./project/pages/curso-nuevo/curso-nuevo.page').then(
        (m) => m.CursoNuevoPage
      ),
  },
  {
    path: 'curso-editar/:cursoId',
    canActivate: [docenteGuard],
    loadComponent: () =>
      import('./project/pages/curso-editar/curso-editar.page').then(
        (m) => m.CursoEditarPage
      ),
  },
  {
    path: 'curso/:cursoId',
    canActivate: [docenteGuard],
    loadComponent: () =>
      import('./project/pages/curso-detalle/curso-detalle.page').then(
        (m) => m.CursoDetallePage
      ),
  },

  // -----------------------------------------------------------
  // Tests + preguntas + aplicaciones (gestión docente)
  // -----------------------------------------------------------
  {
    path: 'mis-tests',
    canActivate: [docenteGuard],
    loadComponent: () =>
      import('./project/pages/mis-tests/mis-tests.page').then(
        (m) => m.MisTestsPage
      ),
  },
  {
    path: 'test-nuevo',
    canActivate: [docenteGuard],
    loadComponent: () =>
      import('./project/pages/test-nuevo/test-nuevo.page').then(
        (m) => m.TestNuevoPage
      ),
  },
  {
    path: 'test-detalle/:id',
    canActivate: [docenteGuard],
    loadComponent: () =>
      import('./project/pages/test-detalle/test-detalle.page').then(
        (m) => m.TestDetallePage
      ),
  },
  {
    path: 'test-editar/:id',
    canActivate: [docenteGuard],
    loadComponent: () =>
      import('./project/pages/test-editar/test-editar.page').then(
        (m) => m.TestEditarPage
      ),
  },
  {
    path: 'pregunta-nueva',
    canActivate: [docenteGuard],
    loadComponent: () =>
      import('./project/pages/pregunta-nueva/pregunta-nueva.page').then(
        (m) => m.PreguntaNuevaPage
      ),
  },
  {
    path: 'pregunta-editar/:id',
    canActivate: [docenteGuard],
    loadComponent: () =>
      import('./project/pages/pregunta-editar/pregunta-editar.page').then(
        (m) => m.PreguntaEditarPage
      ),
  },
  {
    path: 'mis-aplicaciones',
    canActivate: [docenteGuard],
    loadComponent: () =>
      import('./project/pages/mis-aplicaciones/mis-aplicaciones.page').then(
        (m) => m.MisAplicacionesPage
      ),
  },
  {
    path: 'aplicacion-nueva',
    canActivate: [docenteGuard],
    loadComponent: () =>
      import('./project/pages/aplicacion-nueva/aplicacion-nueva.page').then(
        (m) => m.AplicacionNuevaPage
      ),
  },
  {
    // Alias usado por curso-detalle.aplicarNuevoTest()
    path: 'crear-aplicacion',
    canActivate: [docenteGuard],
    loadComponent: () =>
      import('./project/pages/aplicacion-nueva/aplicacion-nueva.page').then(
        (m) => m.AplicacionNuevaPage
      ),
  },

  // -----------------------------------------------------------
  // Analítica docente
  // -----------------------------------------------------------
  {
    path: 'analitica',
    canActivate: [docenteGuard],
    loadComponent: () =>
      import('./project/pages/analitica/analitica.page').then(
        (m) => m.AnaliticaPage
      ),
  },
  {
    path: 'analitica/:aplicacionId',
    canActivate: [docenteGuard],
    loadComponent: () =>
      import('./project/pages/analitica-detalle/analitica-detalle.page').then(
        (m) => m.AnaliticaDetallePage
      ),
  },

  // -----------------------------------------------------------
  // Raíz: login. Wildcard → login (las URLs viejas tipo /estudiante/*
  // que llegan por error van a parar acá).
  // -----------------------------------------------------------
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '/login',
  },
];
