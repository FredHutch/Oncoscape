import { Injectable, Injector } from '@angular/core';
import { Headers, RequestOptions, URLSearchParams } from '@angular/http';

import { Observable } from 'rxjs/Observable';
import { has, get, clone, omit } from 'lodash';

import { Service } from './base.service';
import { SchemaModel, SchemaModelResource } from '../models';
import { Configurator } from '../../core/configurator';
import { RestAdapter } from '../adapters/rest.adapter';
import { SYMBOLS, getLocalStorage } from '../constants';

export interface PluginsGetParameters {
  id?: string;
  name?: string;
  api_id?: string;
  consumer_id?: string;
  size?: string;
  offset?: string;
}

@Injectable()
export class PluginsService extends Service<RestAdapter> {
  constructor(inject: Injector, private _configurator: Configurator) {
    super(inject);
  }

  plugins(args?: PluginsGetParameters): Observable<any> {
    let baseUrl: string = this._configurator.getOption('API.URL');
    let reqOptions = this._reqOptions();

    let params: URLSearchParams = new URLSearchParams();
    /* tslint:disable */
    has(args, 'size') ? params.set('size', get(args, 'size', '10')) : params.set('size', '10');
    has(args, 'name') ? params.set('name', get(args, 'name', '')) : undefined;
    has(args, 'api_id') ? params.set('api_id', get(args, 'api_id', '')) : undefined;
    has(args, 'consumer_id') ? params.set('consumer_id', get(args, 'consumer_id', '')) : undefined;
    has(args, 'offset') ? params.set('offset', get(args, 'offset', '')) : undefined;
    /* tslint:enable */
    reqOptions.search = params;

    return this.adapter.get(`${baseUrl}/plugins`, reqOptions)
      .flatMap((list) => {
        return Observable.of(list.data);
      });
  }

  enabled(): Observable<any> {
    let baseUrl: string = this._configurator.getOption('API.URL');
    let reqOptions = this._reqOptions();

    return this.adapter.get(`${baseUrl}/plugins/enabled`, reqOptions);
  }

  schema(plugin: string): Observable<SchemaModel> {
    let baseUrl: string = this._configurator.getOption('API.URL');
    let reqOptions = this._reqOptions();

    return this.adapter.get(`${baseUrl}/plugins/schema/${plugin}`, reqOptions)
      .flatMap((rs) => {
        return Observable.of(new SchemaModel(rs.data));
      });
  }

  private _reqOptions(): RequestOptions {
    let localData: {key: string, user: string} = JSON.parse(getLocalStorage(SYMBOLS.USER));

    let headers = new Headers();
    headers.append('Authorization', 'Basic ' + localData.key);
    return new RequestOptions({ headers: headers, withCredentials: false });
  }
}
