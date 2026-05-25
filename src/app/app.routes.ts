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
      import('./project/pages/registro-profesor/registro-profesor.page').then(
        (m) => m.RegistroProfesorPage
      ),
  },
  {
    // RF-59: solicitar recuperación de contraseña
    path: 'recuperar-password',
    loadComponent: () =>
      import('./project/pages/recuperar-password/recuperar-password.page').then(
        (m) => m.RecuperarPasswordPage
      ),
  },
  {
    // RF-59: fijar nueva contraseña con el token del correo
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
  // Mis cursos: listar, crear, editar, detalle (RF-61 + CRUD)
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
  // Gestión docente: tests + preguntas + aplicaciones
  // (RF-62..RF-73, RF-88..RF-93)
  //
  // Las preguntas se gestionan dentro de cada test.
  // Las aplicaciones se gestionan desde cada curso.
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
  // Analítica docente (RF-94 a RF-104)
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
  // Flujo de evaluación del ESTUDIANTE (público, sin guard — RF-01 a RF-44)
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
  // Tabs / home (app del estudiante, RF-01, sin guard).
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
