import { Injectable } from '@angular/core';

import { Descriptor } from './descriptor';
import { Subscription } from 'rxjs/Subscription';

@Injectable()
export abstract class Container extends Descriptor {

  private _subscriptions: Array<Subscription> = [];

  constructor() {
    super();
  }

  /**
   * Work around for issue expression has changed after checked
   * https://github.com/angular/angular/issues/6005#issuecomment-233547490
   *
   * @param {Function} fn
   * @param {Array<any>} [args]
   * @param {Object} [context]
   */
  changeDetection(fn: Function, args?: Array<any>, context?: Object): void {
    setTimeout(
      () => {
        let params: Array<any> = args ? args : [];
        let self: Object = context ? context : this;
        fn.apply(self, params);
      },
      0
    );
  }

  set subscriptions(value: Subscription) {
    this._subscriptions.push(value);
  }

  clean(): void {
    this._subscriptions.map((subscription) => {
      subscription.unsubscribe();
    });
  }
}
