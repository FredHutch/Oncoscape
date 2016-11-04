import { Injectable } from '@angular/core';

const STORE = require('store');

/**
 * Class to persist data on local storage.
 *
 * @export
 * @class Persistence
 */
@Injectable()
export class Persistence {

  /**
   * Adds data identified by key to local storage.
   *
   * @param {string} key
   * @param {*} value
   */
  set(key: string, value: any) {
    STORE.set(key, JSON.stringify(value));
  }

  /**
   * Get data from local storage identified by key.
   *
   * @param {string} key
   * @returns
   */
  get(key: string) {
    return STORE.get(key);
  }

  /**
   * Get all data persisted on local storage.
   *
   * @returns
   */
  all() {
    return STORE.getAll();
  }

  /**
   * Deletes data on local storage
   * identified by key.
   *
   * @param {string} key
   */
  delete(key: string) {
    STORE.remove(key);
  }

  /**
   * Clear all local storage data.
   */
  clear() {
    STORE.clear();
  }

  /**
   * Check if browser support local
   * storage feature.
   *
   * @returns {boolean}
   */
  supported(): boolean {
    return !!STORE.enabled;
  }
}
