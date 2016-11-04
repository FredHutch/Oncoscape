export * from './auth.service';
export * from './base.service';
export * from './guard.service';
export * from './apis.service';
export * from './status.service';
export * from './plugins.service';
export * from './uploader.service';
export * from './consumers.service';

import { Injector } from '@angular/core';
import { AuthService } from './auth.service';

export const AUTH_PROVIDER: any[] = [
  { provide: AuthService, useClass: AuthService, deps: [Injector] },
];
