import { BaseModel } from '../base.model';

export class RequestSizeLimitingModelConfig extends BaseModel {
  name: string;
  /* tslint:disable */
  consumer_id: string;
  allowed_payload_size: number;
  /* tslint:enable */
}
