import { CommonModule } from '@angular/common';
import { ModuleWithProviders, NgModule, Optional, SkipSelf } from '@angular/core';

import { AUTH_PROVIDER } from './services';
import { ADAPTER_PROVIDER } from './adapters';
import { Configurator, Persistence } from '../core';

@NgModule({
  imports:      [ CommonModule ],
  providers:    [ Configurator, Persistence ]
})
export class CoreModule {

  static forRoot(): ModuleWithProviders {
    return {
      ngModule: CoreModule,
      providers: [
        { provide: Configurator, useClass: Configurator },
        ADAPTER_PROVIDER,
        AUTH_PROVIDER
      ]
    };
  }

  constructor (@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error('CoreModule is already loaded. Import it in the AppModule only');
    }
  }

}
