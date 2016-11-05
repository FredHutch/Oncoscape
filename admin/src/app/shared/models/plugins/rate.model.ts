import { BaseModel } from '../base.model';

export class RateModelConfig extends BaseModel {
  name: string;
  /* tslint:disable */
  consumer_id: string;
  limit_by: string;
  fault_tolerant: boolean;
  redis_host: string;
  redis_port: number;
  redis_timeout: number;
  /* tslint:enable */
  second: number;
  minute: number;
  hour: number;
  day: number;
  month: number;
  year: number;
  policy: string;
}
