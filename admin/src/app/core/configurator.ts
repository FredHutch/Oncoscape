import { Injectable, Inject } from '@angular/core';

import { isObject, mapKeys, set, startsWith } from 'lodash';

import { APP_CONFIG } from '../environment';

/**
 * Interface description for options
 *
 * @export
 * @interface Options
 */
export interface Options {
  [key: string]: any;
}

/**
 * Class to centralized configurations values.
 *
 * @export
 * @class Configurator
 */
@Injectable()
export class Configurator {
  private _repository: Options = <Options>{};

  constructor( @Inject(APP_CONFIG) options: Options) {
    this.options = options || {};
  }

  setOption(name: string, value: any): void {
    this._repository[name] = value;
  }

  /**
   * Get a configuration value from the collection.
   *
   * @param {string} name (Key name on collection)
   * @param {*} [defaults=null] (Default value if not exist)
   * @returns {*}
   */
  getOption(name: string, defaults: any = null): any {
    return this.hasOption(name) ? this._repository[name] : defaults;
  }

  getOptionTree(rootKey: string, fromRoot: boolean = true): any {
    let tree = {};

    mapKeys(this.options, (value: any, key: string) => {
      if (startsWith(key, rootKey)) {
        set(tree, key, value);
      }

      return key;
    });

    return fromRoot ? tree : tree[rootKey];
  }

  get options(): Options {
    return this._repository;
  }

  set options(opt: Options) {
    this._flat(opt);
  }

  /**
   * Verify if option name exists on the collection.
   *
   * @param {string} name (description)
   * @returns {boolean} (description)
   */
  hasOption(name: string): boolean {
    return this._repository.hasOwnProperty(name);
  }

  /**
   * Converts a tree object keys in flat
   * key string in one level.
   *
   * {
   *  name: '',
   *  profile: {
   *    email: ''
   *  }
   * }
   *
   * to: {'name': '', 'profile.email': ''}
   *
   * @private
   * @param {*} config (Configuration object)
   * @param {string} [key=''] (Append key tree to flat)
   */
  private _flat(config: any, key: string = '') {
    let path: string = + (key === '') ? key : key + '.';

    Object.keys(config).forEach((keyId: string) => {
      if (isObject(config[keyId])) {
        this._flat(config[keyId], path + keyId);
      } else {
        this.setOption(`${path + keyId}`, config[keyId]);
      }
    });
  }
}
