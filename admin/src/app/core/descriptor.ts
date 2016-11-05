import { set, get, has } from 'lodash';
import { Observable } from 'rxjs/Observable';
import { Injectable, EventEmitter } from '@angular/core';


/**
 * Descriptor class to add local state and properties
 * to current extended class.
 *
 * @export
 * @abstract
 * @class Descriptor
 */
@Injectable()
export abstract class Descriptor {
  private _state: any = {};
  private _props: any = {};
  private _emitter: EventEmitter<any>;

  constructor() {
    this._emitter = new EventEmitter();
  }

  /**
   * Set unique local state. When setted
   * this value is emit to listeners.
   */
  set state(value) {
    this._state = value;
    this._emitter.emit({ state: value });
  }

  /**
   * Get current state
   */
  get state() {
    return this._state;
  }

  /**
   * Get emitter as Observable to
   * subscribe on changes.
   *
   * @returns {Observable<any>}
   */
  observe(): Observable<any> {
    return this._emitter.asObservable();
  }

  /**
   * Get the emitter to listen for changes.
   *
   * @returns {EventEmitter<any>}
   */
  event(): EventEmitter<any> {
    return this._emitter;
  }

  /**
   * Set a property. This property is also emitted
   * for subscribers.
   *
   * @param {string} key
   * @param {*} value
   */
  setProp(key: string, value: any): void {
    set(this._props, key, value);
    this._emitter.emit({ props: this._props });
  }

  /**
   * Get a defined property. Case doesn't
   * exist you receive all props collection.
   *
   * @param {string} [key]
   * @returns {*}
   */
  getProp(key?: string): any {
    return get(this._props, key, this._props);
  }

  /**
   * Clear all properties defined.
   */
  resetProps(): void {
    this._props = {};
  }
}
