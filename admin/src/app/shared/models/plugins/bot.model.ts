import { BaseModel } from '../base.model';

export class BotModelConfig extends BaseModel {
  name: string;
  whitelist: string;
  blacklist: string;
}
