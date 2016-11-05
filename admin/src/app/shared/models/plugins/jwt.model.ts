import { BaseModel } from '../base.model';

export class JWTModelConfig extends BaseModel {
  name: string;
  /* tslint:disable */
  uri_param_names: string;
  claims_to_verify: string;
  key_claim_name: string;
  secret_is_base64: boolean;
  /* tslint:enable */
}

export class JWTModel extends BaseModel {
  key: string;
  algorithm: string;
  /* tslint:disable */
  rsa_public_key: string;
  /* tslint:enable */
  secret: string;
}
