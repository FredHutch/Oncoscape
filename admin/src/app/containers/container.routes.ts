import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HomeContainer } from './home';
import { LoginContainer, LoginGuard } from './login';

const ROUTES: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginContainer, canActivate: [ LoginGuard ] },
  { path: 'admin', loadChildren: () => System.import('./+admin/admin.module') }
];

export const ROUTING: ModuleWithProviders = RouterModule.forRoot(ROUTES, { useHash: false });
