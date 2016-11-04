import { BaseModel } from '../base.model';

export class KeyModelConfig extends BaseModel {
  name: string;
  /* tslint:disable */
  key_names: Array<string>;
  hide_credentials: boolean;
  /* tslint:enable */
}

export class KeyModel extends BaseModel {
  key: string;
}
