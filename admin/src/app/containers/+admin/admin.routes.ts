import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { GuardService } from '../../shared';
import { DashboardContainer } from './dashboard';
import { AdminContainer } from './admin.container';
import {
  PluginsContainer, PluginDetailContainer, NewPluginContainer, NewConsumerApiContainer
} from './plugins';
import { ApisContainer, NewApiContainer, EditApiContainer, AclsContainer, ApiPlugsContainer } from './apis';
import { ConsumersContainer, NewConsumerContainer, EditConsumerContainer } from './consumers';

const ROUTES: Routes = [
  {
    path: '',
    component: AdminContainer,
    canActivate: [ GuardService ],
    children: [
      { path: '', component: DashboardContainer },
      {
        path: 'acls',
        pathMath: '',
        children:[ 
          {path:'', component: AclsContainer }
        ]
      },
      {
        path: 'apis',
        pathMatch: '',
        children: [
          { path: '', component: ApisContainer },
          { path: 'new', component: NewApiContainer },
          { path: 'edit/:id', component: EditApiContainer },
          { path: 'plugin/:id', component: ApiPlugsContainer }
        ]
      },
      {
        path: 'consumers',
        pathMatch: '',
        children: [
          { path: '', component: ConsumersContainer },
          { path: 'new', component: NewConsumerContainer },
          { path: 'edit/:id', component: EditConsumerContainer }
        ]
      },
      {
        path: 'plugins',
        pathMatch: '',
        children: [
          { path: '', component: PluginsContainer },
          { path: 'schema/:id', component: PluginDetailContainer },
          { path: 'api/:id', component: NewPluginContainer },
          { path: 'consumer/:id', component: NewConsumerApiContainer }
        ]
      }
    ]
  }
];

export const ROUTING: ModuleWithProviders = RouterModule.forChild(ROUTES);
