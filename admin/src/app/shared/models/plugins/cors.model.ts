import { BaseModel } from '../base.model';

export class CorsModelConfig extends BaseModel {
  name: string;
  origin: string;
  methods: string;
  headers: string;
  /* tslint:disable */
  exposed_headers: string;
  max_age: number;
  preflight_continue: boolean;
  /* tslint:enable */
  credentials: boolean;
}
