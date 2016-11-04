import { BaseModel } from '../base.model';

export class HMacModelConfig extends BaseModel {
  name: string;
  /* tslint:disable */
  hide_credentials: boolean;
  clock_skew: number;
  /* tslint:enable */
}

export class HMacModel extends BaseModel {
  username: string;
  algorithm: string;
  headers: string;
  signature: string;
}
