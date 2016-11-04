import { BaseModel } from '../base.model';

export class ResponseRateLimitingModelConfig extends BaseModel {
  name: string;
  /* tslint:disable */
  consumer_id: string;
  limit_by: string;
  header_name: string;
  block_on_first_violation: boolean;
  fault_tolerant: boolean;
  redis_host: string;
  redis_port: number;
  redis_timeout: number;
  /* tslint:enable */
  policy: string;
}
