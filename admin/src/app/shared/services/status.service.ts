import { Injectable, Injector } from '@angular/core';
import { Headers, RequestOptions } from '@angular/http';

import { Observable } from 'rxjs/Observable';

import { Service } from './base.service';
import { KongModel } from '../models/kong.model';
import { StatusModel } from '../models/status.model';
import { Configurator } from '../../core/configurator';
import { RestAdapter } from '../adapters/rest.adapter';
import { SYMBOLS, getLocalStorage } from '../constants';

@Injectable()
export class StatusService extends Service<RestAdapter> {
  constructor(inject: Injector, private _configurator: Configurator) {
    super(inject);
  }

  status(): Observable<StatusModel> {
    let baseUrl: string = this._configurator.getOption('API.URL');
    let localData: {key: string, user: string} = JSON.parse(getLocalStorage(SYMBOLS.USER));

    let headers = new Headers();
    headers.append('Authorization', 'Basic ' + localData.key);
    // headers.append('Content-Type', 'application/json');
    let reqOptions = new RequestOptions({ headers: headers, withCredentials: false });

    return this.adapter.get(`${baseUrl}/status`, reqOptions)
      .flatMap((response) => {
        return Observable.of(new StatusModel(response.data));
      });
  }

  kong(): Observable<KongModel> {
    let baseUrl: string = this._configurator.getOption('API.URL');
    let localData: {key: string, user: string} = JSON.parse(getLocalStorage(SYMBOLS.USER));

    let headers = new Headers();
    headers.append('Authorization', 'Basic ' + localData.key);
    // headers.append('Content-Type', 'application/json');
    let reqOptions = new RequestOptions({ headers: headers, withCredentials: false });

    return this.adapter.get(`${baseUrl}`, reqOptions)
      .flatMap((response) => {
        return Observable.of(new KongModel(response.data));
      });
  }
}
