import { Driver } from '../adapters';

import { Injectable, Injector, Inject } from '@angular/core';

/**
 * Class to be extended and have driver adapter
 * defined to use to comunicate with any service you have defined on Configurator.
 * Current only Rest driver exist.
 *
 * @export
 * @abstract
 * @class Service
 */
@Injectable()
export abstract class Service<GenericDriver> {
  adapter: GenericDriver;

  constructor(@Inject(Injector) private injector: Injector) {
    /*let reflectiveInjector: ReflectiveInjector = <ReflectiveInjector>injector;
    console.log(injector, reflectiveInjector);
    let other = reflectiveInjector.resolveAndInstantiate(OtherDependency);*/
    this._initAdapter();
  }

  /**
   * Define driver to be used.
   *
   * @private
   */
  private _initAdapter(): void {
    let adapterProvider: Driver = this.injector.get(Driver);

    this.adapter = adapterProvider.adapter;
  }
}
