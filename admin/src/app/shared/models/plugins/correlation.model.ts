import { BaseModel } from '../base.model';

export class CorrelationModelConfig extends BaseModel {
  name: string;
  /* tslint:disable */
  header_name: string;
  echo_downstream: boolean;
  /* tslint:enable */
  generator: string;
}
