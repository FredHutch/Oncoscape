import { Component, OnInit } from '@angular/core';

import { State } from './core';
import { AuthService } from './shared';
import { SYMBOLS, makeSymbolPath } from './shared';

@Component({
  moduleId: __filename,
  selector: 'app',
  template: '<router-outlet></router-outlet>'
})
export class AppContainer implements OnInit {
  constructor(
    private state: State,
    private auth: AuthService
  ) { }

  ngOnInit() {
    console.log('--APP CONTAINER INITED--');
  }
}
