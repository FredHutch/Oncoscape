import { Title } from '@angular/platform-browser';
import { CanActivate, Router } from '@angular/router';
import { Component, OnInit, Injectable } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';

import { Observable } from 'rxjs/Observable';

import { State } from '../../core';
import {
  AuthService, CredentialsBasic, SYMBOLS,
  KongModel, makeSymbolPath
} from '../../shared';

@Component({
  moduleId: __filename,
  selector: 'login-page',
  templateUrl: './login.template.html',
  providers: [ Title ]
})
export class LoginContainer implements OnInit {
  loginForm: FormGroup;
  invalid: boolean = false;

  constructor(
    public fb: FormBuilder,
    private state: State,
    private router: Router,
    private title: Title,
    private authService: AuthService,
  ) { }

  ngOnInit() {
    console.log('--LOGIN INITED--');
    console.log(this.state);
    this.title.setTitle('Login');

    this.loginForm = this.fb.group({
      'mail': ['', Validators.compose([Validators.required])],
      'password': ['', Validators.required]
    });
  }

  onSubmit(form: FormControl) {
    if (form.invalid) {
      return;
    }

    let credentials: CredentialsBasic = <CredentialsBasic>{
      username: form.get('mail'),
      password: form.get('password')
    };

    this.authService
      .login(credentials)
      .subscribe(
        (model: KongModel) => {
          this.invalid = false;
          this.router.navigate([SYMBOLS.ROUTES.ADMIN]);
        },
        (error: Error) => {
          this.invalid = true;
        },
        () => {
          if (this.authService.isLoggedIn) {
            this.state.set(makeSymbolPath([SYMBOLS.UI, SYMBOLS.HEADER]), true);
            this.state.set(makeSymbolPath([SYMBOLS.UI, SYMBOLS.SIDEBAR]), true);
            this.state.set(makeSymbolPath([SYMBOLS.UI, SYMBOLS.FOOTER]), true);
          }
        }
      );
  }
}

@Injectable()
export class LoginGuard implements CanActivate {
  constructor(
    private state: State,
    private router: Router,
    private authService: AuthService
  ) {}

  canActivate() {
    return this.loginAccess()
      .do((logged) => {
        if (!logged) {
          this.router.navigate([SYMBOLS.ROUTES.ADMIN]);

          this.state.set(makeSymbolPath([SYMBOLS.UI, SYMBOLS.HEADER]), true);
          this.state.set(makeSymbolPath([SYMBOLS.UI, SYMBOLS.SIDEBAR]), true);
          this.state.set(makeSymbolPath([SYMBOLS.UI, SYMBOLS.FOOTER]), true);
        } else {
          this.state.set(makeSymbolPath([SYMBOLS.UI, SYMBOLS.HEADER]), false);
          this.state.set(makeSymbolPath([SYMBOLS.UI, SYMBOLS.SIDEBAR]), false);
          this.state.set(makeSymbolPath([SYMBOLS.UI, SYMBOLS.FOOTER]), false);
        }
      });
  }

  private loginAccess(): Observable<boolean> {
    if (this.authService.isLoggedIn) {
      return Observable.of(false);
    }

    if (this.authService.hasLocal()) {
      return this.authService.verify()
        .flatMap((rs) => {
          return Observable.of(false);
        })
        .catch(() => {
          return Observable.of(true);
        });
    } else {
      return Observable.of(true);
    }
  }
}
