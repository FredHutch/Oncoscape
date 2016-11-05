import { BaseModel } from '../base.model';

export class SSLModelConfig extends BaseModel {
  name: string;
  cert: any;
  key: any;
  /* tslint:disable */
  only_https: boolean;
  accept_http_if_already_terminated: boolean;
  /* tslint:enable */
}
