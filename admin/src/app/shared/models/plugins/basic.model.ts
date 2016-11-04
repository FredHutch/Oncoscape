import { BaseModel } from '../base.model';

export class BasicModelConfig extends BaseModel {
  name: string;
  /* tslint:disable */
  hide_credentials: boolean;
  /* tslint:enable */
}

export class BasicModel extends BaseModel {
  username: string;
  password: string;
}
