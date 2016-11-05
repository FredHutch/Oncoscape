import { BaseModel } from '../base.model';

export class ACLModelConfig extends BaseModel {
  name: string;
  whitelist: string;
  blacklist: string;
}

export class ACLModel extends BaseModel {
  group: string;
}
