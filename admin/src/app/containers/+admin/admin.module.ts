import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Size, ShareModule, ToolTipDirective, FileSelect } from '../../shared';
import { ROUTING } from './admin.routes';
import { DashboardContainer } from './dashboard';
import { AdminContainer } from './admin.container';
import { ComponentsModule } from '../../components';
import {
  PluginsContainer, PluginDetailContainer,
  NewPluginContainer, NewConsumerApiContainer
} from './plugins';
import { ApisContainer, NewApiContainer, EditApiContainer, ApiPlugsContainer } from './apis';
import { ConsumersContainer, NewConsumerContainer, EditConsumerContainer } from './consumers';


@NgModule({
  imports: [ ShareModule, ROUTING, ComponentsModule ],
  declarations: [
    DashboardContainer, AdminContainer, Size, ToolTipDirective, FileSelect,
    ApisContainer, NewApiContainer, EditApiContainer, ApiPlugsContainer,
    PluginsContainer, PluginDetailContainer, NewPluginContainer, NewConsumerApiContainer,
    ConsumersContainer, NewConsumerContainer, EditConsumerContainer
  ]
})
export default class AdminModule {
  static routes = ROUTING;
  constructor()  {
    console.log('--ADMIN MODULE INITED--');
  }
}
