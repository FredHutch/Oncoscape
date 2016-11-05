import { Injectable, Injector, Inject } from '@angular/core';

import { SYMBOLS } from '../constants';
import { RestAdapter } from './rest.adapter';
import { Configurator } from '../../core/configurator';

const ADAPTER = 'ADAPTER';

/**
 * Gets a driver for comunnication.
 *
 * @export
 * @class Adapter
 */
@Injectable()
export class Driver {

  /**
   * Driver defined to use.
   *
   * @private
   * @type {*}
   */
  private _adapter: any;

  /**
   * Creates an instance of Adapter.
   *
   * @param {Injector} _injector
   */
  constructor(@Inject(Injector) private _injector: Injector) {
    this._setupAdapter();
  }

  /**
   * Gets current adapter driver.
   *
   * @readonly
   */
  get adapter() {
    return this._adapter;
  }

  /**
   * Setup driver defined on Configurator
   * options.
   *
   * @private
   */
  private _setupAdapter(): void {
    let configurator: Configurator = this._injector.get(Configurator);
    let adapterType: string = configurator.getOption(ADAPTER, SYMBOLS.ADAPTERS.REST);

    switch (adapterType) {
      default:
        this._adapter = this._injector.get(RestAdapter);
        break;
    }
  }
}
