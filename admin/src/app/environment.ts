// Angular 2
// rc2 workaround
import { OpaqueToken } from '@angular/core';
import { enableProdMode, ApplicationRef, ErrorHandler } from '@angular/core';
import { enableDebugTools, disableDebugTools } from '@angular/platform-browser';

// Environment Providers
let PROVIDERS: any[] = [
  // common env directives
];

export const APP_CONFIG = new OpaqueToken('app.config');

// Angular debug tools in the dev console
// https://github.com/angular/angular/blob/86405345b781a9dc2438c0fbe3e9409245647019/TOOLS_JS.md
let _decorateModuleRef = function identity<T>(value: T): T { return value; };

if ('production' === ENV) {
  // Production
  disableDebugTools();
  enableProdMode();

  let config = {};

  PROVIDERS = [
    ...PROVIDERS,
    { provide: APP_CONFIG, useValue: config }
    // custom providers in production
  ];

} else {

  _decorateModuleRef = (modRef: any) => {
    const appRef = modRef.injector.get(ApplicationRef);
    const cmpRef = appRef.components[0];

    let _ng = (<any>window).ng;
    enableDebugTools(cmpRef);
    (<any>window).ng.probe = _ng.probe;
    (<any>window).ng.coreTokens = _ng.coreTokens;
    return modRef;
  };

  let config = {
    ADAPTER: 'REST',
    ENVIRONMENT: 'DEV',
    'API.URL': 'https://oncoscape-test.fhcrc.org/api/kong',
    UPLOAD: {
      url: 'http://localhost:8001/upload',
      debug: true,
      filterExtensions: false,
      calculateSpeed: true,
      autoUpload: false,
      previewUrl: true
    }
  };

  // Development
  PROVIDERS = [
    ...PROVIDERS,
    { provide: APP_CONFIG, useValue: config }
    // custom providers in development
  ];

}

export const decorateModuleRef = _decorateModuleRef;

export const ENV_PROVIDERS = [
  ...PROVIDERS
];
