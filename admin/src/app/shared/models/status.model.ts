import { BaseModel } from './base.model';
import { Injectable } from '@angular/core';

export interface StatusModelResourceDatabase {
  oauth2_tokens: number;
  jwt_secrets: number;
  response_ratelimiting_metrics: number;
  keyauth_credentials: number;
  oauth2_authorization_codes: number;
  acls: number;
  apis: number;
  hmacauth_credentials: number;
  consumers: number;
  ratelimiting_metrics: number;
  basicauth_credentials: number;
  nodes: number;
  oauth2_credentials: number;
  plugins: number;
}

export interface StatusModelResourceServer {
  connections_accepted: number;
  connections_active: number;
  connections_handled: number;
  connections_reading: number;
  connections_waiting: number;
  connections_writing: number;
  total_requests: number;
}

export interface StatusModelResource {
  server: StatusModelResourceServer;
  database: StatusModelResourceDatabase;
}

@Injectable()
export class StatusModel extends BaseModel {
  server?: StatusModelResourceServer;
  database?: StatusModelResourceDatabase;

  constructor(data?: StatusModelResource) {
    super();

    if (data) {
      Object.assign(this, data);
    }
  }
}
