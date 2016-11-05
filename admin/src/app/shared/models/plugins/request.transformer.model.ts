import { BaseModel } from '../base.model';

export class RequestTransformerModelConfig extends BaseModel {
  name: string;
  /* tslint:disable */
  consumer_id: string;
  config: {
    http_method: string;
    remove: {
      headers: Array<string>;
      querystring: Array<string>;
      body: Array<string>;
    };
    replace: {
      headers: Array<string>;
      querystring: Array<string>;
      body: Array<string>;
    };
    add: {
      headers: Array<string>;
      querystring: Array<string>;
      body: Array<string>;
    };
    append: {
      headers: Array<string>;
      querystring: Array<string>;
      body: Array<string>;
    };
  };
  /* tslint:enable */
}
