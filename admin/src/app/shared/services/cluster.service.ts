import { Injectable, Injector } from '@angular/core';
import { Headers, RequestOptions, URLSearchParams } from '@angular/http';

import { Observable } from 'rxjs/Observable';
import { has, get, clone, omit } from 'lodash';

import { Service } from './base.service';
import { Configurator } from '../../core/configurator';
import { SYMBOLS, getLocalStorage } from '../constants';

import { RestAdapter, ResourceResponse } from '../adapters/rest.adapter';

@Injectable()
export class ClusterService extends Service<RestAdapter> {

  constructor(inject: Injector, private _configurator: Configurator) {
    super(inject);
  }

  getCluster(): Observable<any> {
    let baseUrl: string = this._configurator.getOption('API.URL');
    let reqOptions = this._reqOptions();  

    return this.adapter.get(`${baseUrl}/cluster`, reqOptions);
  }

  private _reqOptions(): RequestOptions {
    let localData: {key: string, user: string} = JSON.parse(getLocalStorage(SYMBOLS.USER));

    let headers = new Headers();
    headers.append('Authorization', 'Basic ' + localData.key);
    return new RequestOptions({ headers: headers, withCredentials: false });
  }

}