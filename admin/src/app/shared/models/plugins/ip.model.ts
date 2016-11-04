import { BaseModel } from '../base.model';

export class IPModelConfig extends BaseModel {
  name: string;
  /* tslint:disable */
  consumer_id: string;
  /* tslint:enable */
  whitelist: string;
  blacklist: string;
}
