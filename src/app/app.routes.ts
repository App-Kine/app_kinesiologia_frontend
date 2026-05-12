import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'tabs',
    loadComponent: () => import('./project/pages/tabs/tabs.page').then( m => m.TabsPage),
    children: [
      {
        path: 'home',
        loadComponent: () => import('./project/pages/home/home.page').then(m => m.HomePage)
      },
      {
        path: 'example-page-1',
        loadComponent: () => import('./project/pages/example-page-1/example-page-1.page').then(m => m.ExamplePage1Page)
      },
      {
        path: '',
        redirectTo: '/tabs/home',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '',
    redirectTo: '/tabs/home',
    pathMatch: 'full',
  },
  {
    path: 'header',
    loadComponent: () => import('./project/components/header/header.page').then( m => m.HeaderPage)
  }
];
