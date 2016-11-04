import { has, isObject } from 'lodash';
import { Injectable } from '@angular/core';
import { BaseModel, BaseModelCollection } from './base.model';

export interface ConsumerModelResource {
  created_at?: string;
  custom_id?: string;
  id?: string;
  username?: string;
}

@Injectable()
export class ConsumersModel extends BaseModel {
  id?: string;
  username?: string;
  /* tslint:disable */
  created_at?: string;
  custom_id?: string;
  /* tslint:enable */

  collection: BaseModelCollection<ConsumerModelResource>;

  constructor(data?: ConsumerModelResource | BaseModelCollection<ConsumerModelResource>) {
    super();

    if (has(data, 'data')) {
      this._setCollection(<BaseModelCollection<ConsumerModelResource>>data);
    } else if (isObject(data)) {
      Object.assign(this, data);
    }
  }

  private _setCollection(collection: BaseModelCollection<ConsumerModelResource>) {
    collection.data.forEach((value, index) => {
      collection.data[index] = new ConsumersModel(<ConsumerModelResource>value);
    });

    this.collection = collection;
  }
}
