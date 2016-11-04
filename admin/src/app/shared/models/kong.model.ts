import { BaseModel } from './base.model';
import { Injectable } from '@angular/core';

export interface KongModelTimer {
  running: number;
  pending: number;
}

export interface KongModelConfigurationDnsResolver {
  address: string;
  dnsmasq: boolean;
  port: number;
}

export interface KongModelConfigurationPostgres {
  host: string;
  database: string;
  user: string;
  port: number;
}

export interface KongModelConfigurationCluster {
  'auto-join': boolean;
  profile: string;
  ttl_on_failure: number;
}

export interface KongModelConfigurationDao {
  host: string;
  database: string;
  user: string;
  port: number;
}

export interface KongModelConfiguration {
  send_anonymous_reports: boolean;
  dns_resolver: KongModelConfigurationDnsResolver;
  postgres: KongModelConfigurationPostgres;
  cluster_listen: string;
  cluster: KongModelConfigurationCluster;
  proxy_listen: string;
  nginx: string;
  custom_plugins: Object;
  proxy_listen_ssl: string;
  dns_resolvers_available: {
    server: {
      address: string;
    },
    dnsmasq: {
      port: number;
    }
  };
  dao_config: KongModelConfigurationDao;
  nginx_working_dir: string;
  database: string;
  plugins: Array<string>;
  pid_file: string;
  cassandra: {
    contact_points: Array<string>;
    data_centers: Object;
    ssl: {
      verify: boolean;
      enabled: boolean;
    };
    port: number;
    timeout: number;
    replication_strategy: string;
    keyspace: string;
    replication_factor: number;
    consistency: string;
  };
  admin_api_listen: string;
  memory_cache_size: number;
  cluster_listen_rpc: string;
}

export interface KongModelPlugins {
  enabled_in_cluster: Array<string>;
  available_on_server: {
    [key: string]: boolean;
  };
}

export interface KongModelResource {
  timers?: KongModelTimer;
  version?: string;
  configuration?: KongModelConfiguration;
  lua_version?: string;
  tagline?: string;
  hostname?: string;
  plugins?: KongModelPlugins;
}

@Injectable()
export class KongModel extends BaseModel {
  timers?: KongModelTimer;
  version?: string;
  configuration?: KongModelConfiguration;
  /* tslint:disable */
  lua_version?: string;
  /* tslint:enable */
  tagline?: string;
  hostname?: string;
  plugins?: KongModelPlugins;

  constructor(data?: KongModelResource) {
    super();

    if (data) {
      Object.assign(this, data);
    }
  }
}
