import 'rxjs/add/operator/do';
import { Observable } from 'rxjs/Observable';

import { FormControl } from '@angular/forms';
import { Headers, RequestOptions } from '@angular/http';
import { Injectable, Injector, Inject } from '@angular/core';

import { SYMBOLS } from '../constants';
import { Service } from './base.service';
import { KongModel } from '../models/kong.model';
import { Persistence } from '../../core/persistence';
import { RestAdapter } from '../adapters/rest.adapter';
import { Configurator } from '../../core/configurator';

export interface CredentialsBasic {
  password: FormControl;
  username: FormControl;
}

@Injectable()
export class AuthService extends Service<RestAdapter> {
  isLoggedIn: boolean = false;

  private persistence: Persistence;
  private configurator: Configurator;

  constructor(@Inject(Injector) inject: Injector) {
    super(inject);

    this.configurator = inject.get(Configurator);
    this.persistence = inject.get(Persistence);
  }

  login(credentials: CredentialsBasic): Observable<KongModel> {

    let encoded: string = btoa(
      `${credentials.username.value}:${credentials.password.value}`
    );

    return this._performLogin({ key: encoded, user: credentials.username.value });
  }

  logout(): void {
    this.isLoggedIn = false;
    this.persistence.clear();
  }

  hasLocal(): boolean {
    return !!this.persistence.get(SYMBOLS.USER);
  }

  verify(): Observable<KongModel> {
    let localData: { key: string, user: string };

    try {
      let local = JSON.parse(this.persistence.get(SYMBOLS.USER));
      local.user = local.user;

      localData = local;
    } catch (error) {
      localData = { key: null, user: null };
    }

    return this._performLogin(localData);
  }

  private _performLogin(persistence: {key: string, user: string}): Observable<KongModel> {
    const BASEAPIURL = this.configurator.getOption('API.URL');

    let headers = new Headers();
    headers.append('Authorization', 'Basic ' + persistence.key);
    // headers.append('Content-Type', 'application/json');
    let reqOptions = new RequestOptions({ headers: headers, withCredentials: false });

    return this.adapter
      .get(BASEAPIURL, reqOptions)
      .do(
        (response) => {
          if (response.ok) {
            this.isLoggedIn = true;

            if (!this.hasLocal()) {
              this.persistence.set(SYMBOLS.USER, {
                key: persistence.key,
                user: persistence.user
              });
            }
          } else {
            this.logout();
          }
        },
        (error) => {
          this.logout();
          throw error;
        }
      )
      .flatMap((response) => {
        return Observable.of(new KongModel(response.data));
      });
  }
}
