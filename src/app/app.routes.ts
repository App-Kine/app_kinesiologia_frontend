import { Routes } from '@angular/router';
import { authGuard } from './project/services/auth.guard';
import { adminGuard, docenteGuard } from './project/services/role.guard';

export const routes: Routes = [
  // -----------------------------------------------------------
  // Públicas: login (RF-51) y registro de profesor por invitación (RF-79)
  // -----------------------------------------------------------
  {
    path: 'login',
    loadComponent: () =>
      import('./project/pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'registro-profesor/:token',
    loadComponent: () =>
      import(
        './project/pages/registro-profesor/registro-profesor.page'
      ).then((m) => m.RegistroProfesorPage),
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
  // Módulo docente: preguntas, tests, aplicaciones
  // (RF-61..RF-73, RF-88..RF-93)
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
    path: 'curso/:cursoId',
    canActivate: [docenteGuard],
    loadComponent: () =>
      import('./project/pages/curso-detalle/curso-detalle.page').then(
        (m) => m.CursoDetallePage
      ),
  },
  {
    path: 'preguntas',
    canActivate: [docenteGuard],
    loadComponent: () =>
      import('./project/pages/preguntas/preguntas.page').then(
        (m) => m.PreguntasPage
      ),
  },
  {
    path: 'crear-pregunta',
    canActivate: [docenteGuard],
    loadComponent: () =>
      import('./project/pages/crear-pregunta/crear-pregunta.page').then(
        (m) => m.CrearPreguntaPage
      ),
  },
  {
    path: 'tests',
    canActivate: [docenteGuard],
    loadComponent: () =>
      import('./project/pages/tests/tests.page').then((m) => m.TestsPage),
  },
  {
    path: 'crear-test',
    canActivate: [docenteGuard],
    loadComponent: () =>
      import('./project/pages/crear-test/crear-test.page').then(
        (m) => m.CrearTestPage
      ),
  },
  {
    path: 'aplicaciones',
    canActivate: [docenteGuard],
    loadComponent: () =>
      import('./project/pages/aplicaciones/aplicaciones.page').then(
        (m) => m.AplicacionesPage
      ),
  },
  {
    path: 'crear-aplicacion',
    canActivate: [docenteGuard],
    loadComponent: () =>
      import('./project/pages/crear-aplicacion/crear-aplicacion.page').then(
        (m) => m.CrearAplicacionPage
      ),
  },

  // -----------------------------------------------------------
  // Tabs / home: lo dejamos como vista pública del estudiante.
  // Se monta SIN guard porque la app del estudiante es de acceso
  // público según RF-01. Si en el futuro proteges algo, agrega
  // el guard apropiado.
  // -----------------------------------------------------------
  {
    path: 'tabs',
    loadComponent: () =>
      import('./project/pages/tabs/tabs.page').then((m) => m.TabsPage),
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('./project/pages/home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'example-page-1',
        loadComponent: () =>
          import('./project/pages/example-page-1/example-page-1.page').then(
            (m) => m.ExamplePage1Page
          ),
      },
      {
        path: '',
        redirectTo: '/tabs/home',
        pathMatch: 'full',
      },
    ],
  },

  // -----------------------------------------------------------
  // Raíz y otros
  // -----------------------------------------------------------
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full',
  },
  {
    path: 'header',
    loadComponent: () =>
      import('./project/components/header/header.page').then(
        (m) => m.HeaderPage
      ),
  },
];
