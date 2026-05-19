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
