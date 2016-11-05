import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import { get, has, set, unset } from 'lodash';

export interface BaseModelCollection<ResourceModelCollection> {
  data: Array<any|ResourceModelCollection>;
  total: number;
  next?: string;
}

export abstract class BaseModel {
  collection?: BaseModelCollection<any>;

  private _subject: Subject<any>;

  constructor() {
    this._subject = new Subject();
  }

  hasAttribute(attribute: string): boolean {
    return has(this, attribute);
  }

  setAttribute(key: string, value: any): void {
    set(this, key, value);
    this._subject.next(this);
  }

  getAttribute(key: string): any {
    return get(this, key, undefined);
  }

  removeAttribute(key: string): boolean {
    return unset(this, key);
  }

  observe(): Observable<any> {
    return this._subject.asObservable();
  }
}
