import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

import { Observable } from 'rxjs/Observable';

import { State } from '../../core';
import { AuthService } from './auth.service';
import { SYMBOLS, makeSymbolPath } from '../constants';

@Injectable()
export class GuardService implements CanActivate {
  constructor(
    private state: State,
    private router: Router,
    private authService: AuthService
  ) { }

  canActivate() {
    /*let url: string = this.router.url;
    let isAdmin: boolean = /(?:\/admin)/.test(url);*/

    return this.adminAccess()
      .do((logged) => {
        if (!logged) {
          this.state.set(makeSymbolPath([SYMBOLS.UI, SYMBOLS.HEADER]), false);
          this.state.set(makeSymbolPath([SYMBOLS.UI, SYMBOLS.SIDEBAR]), false);
          this.state.set(makeSymbolPath([SYMBOLS.UI, SYMBOLS.FOOTER]), false);

          this.router.navigate([SYMBOLS.ROUTES.LOGIN]);
        } else {
          this.state.set(makeSymbolPath([SYMBOLS.UI, SYMBOLS.HEADER]), true);
          this.state.set(makeSymbolPath([SYMBOLS.UI, SYMBOLS.SIDEBAR]), true);
          this.state.set(makeSymbolPath([SYMBOLS.UI, SYMBOLS.FOOTER]), true);
        }
      });
  }

  private adminAccess(): Observable<boolean> {
    if (this.authService.isLoggedIn) {
      return Observable.of(true);
    }

    if (this.authService.hasLocal()) {
      return this.authService.verify()
        .flatMap((rs) => {
          return Observable.of(true);
        })
        .catch(() => {
          return Observable.of(false);
        });
    } else {
      return Observable.of(false);
    }
  }
}
