import { NgModule } from '@angular/core';

import { HomeContainer } from './home';
import { LoginContainer, LoginGuard } from './login';
import { ROUTING } from './container.routes';
import { ShareModule, GuardService } from '../shared';

@NgModule({
  imports: [ ROUTING, ShareModule ],
  declarations: [ HomeContainer, LoginContainer ],
  providers: [ GuardService, LoginGuard ]
})
export class ContainerModule {
  constructor()  {
    console.log('--CONTAINER MODULE INITED--');
  }
}
