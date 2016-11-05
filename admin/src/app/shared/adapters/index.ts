export * from './driver';
export * from './rest.adapter';

import { Http } from '@angular/http';
import { Injector } from '@angular/core';

import { Driver } from './driver';
import { RestAdapter } from './rest.adapter';

export const ADAPTER_PROVIDER: any[] = [
  { provide: Driver, useClass: Driver, deps: [Injector] },
  { provide: RestAdapter, useClass: RestAdapter, deps: [Http]}
];
