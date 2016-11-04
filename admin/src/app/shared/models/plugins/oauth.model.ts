import { BaseModel } from '../base.model';

export const OAUTH_ENDPOINTS = {
  AUTHORIZE: '/oauth2/authorize',
  TOKEN: '/oauth2/token'
};

export class OAuthModelConfig extends BaseModel {
  name: string;
  scopes: Array<string>;
  /* tslint:disable */
  mandatory_scope: boolean;
  token_expiration: number;
  enable_authorization_code: boolean;
  enable_client_credentials: boolean;
  enable_implicit_grant: boolean;
  enable_password_grant: boolean;
  hide_credentials: boolean;
  accept_http_if_already_terminated: boolean;
  /* tslint:enable */
}

export class OAuthModel extends BaseModel {
  name: string;
  /* tslint:disable */
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  /* tslint:enable */
}
