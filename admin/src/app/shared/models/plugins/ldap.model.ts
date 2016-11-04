import { BaseModel } from '../base.model';

export class LdapModelConfig extends BaseModel {
  name: string;
  /* tslint:disable */
  hide_credentials: boolean;
  ldap_host: string;
  ldap_port: number;
  start_tls: boolean;
  base_dn: string;
  verify_ldap_host: boolean;
  cache_ttl: number;
  /* tslint:enable */
  attribute: string;
  timeout: number;
  keepalive: number;
}
