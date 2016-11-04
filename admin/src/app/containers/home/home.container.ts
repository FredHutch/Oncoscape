import { Component, OnInit } from '@angular/core';

import { State } from '../../core';

@Component({
  moduleId: __filename,
  selector: 'home-page',
  template: `
  <h1>Welcome to HomePage</h1>
  <a routerLink="/login">Login</a>
  <a routerLink="/admin">Admin</a>
  `
})
export class HomeContainer implements OnInit {
  constructor(private state: State) { }

  ngOnInit() {
    this.state.set('ui', true);
    console.log(this.state);
  }
}
