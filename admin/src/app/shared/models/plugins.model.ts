import { has, isObject } from 'lodash';
import { Injectable } from '@angular/core';
import { BaseModel, BaseModelCollection } from './base.model';

/* tslint:disable */
export const PLUGINSDATA = [
  { id: 'ssl', img: 'dynamic-ssl.png', title: 'Dynamic SSL', info: 'Add an SS certificate for an underlying service.', api: true, consumer: false },
  { id: 'jwt', img: 'jwt.png', title: 'JWT', info: 'Verify and authenticate JSON Web Tokens.', api: true, consumer: true },
  { id: 'acl', img: 'acl.png', title: 'ACL', info: 'Control which consumers can access APIs.', api: true, consumer: true },
  { id: 'correlation-id', img: 'correlation-id.png', title: 'Correlation ID', info: 'Correlate requests and responses using a unique ID.', api: true, consumer: false },
  { id: 'cors', img: 'cors.png', title: 'CORS', info: 'Allow developers to make requests from the browser.', api: true, consumer: false },
  { id: 'oauth2', img: 'oauth2-authentication.png', title: 'OAuth 2.0', info: 'Add an OAuth 2.0 authentication to yor APIs.', api: true, consumer: true },
  { id: 'tcp-log', img: 'tcp-log.png', title: 'TCP', info: 'Send request and response logs to a TCP server.', api: true, consumer: true },
  { id: 'udp-log', img: 'udp-log.png', title: 'UDP', info: 'Send request and response logs to an UDP server.', api: true, consumer: true },
  { id: 'file-log', img: 'file-log.png', title: 'File', info: 'Append request and response data to a log file on disk.', api: true, consumer: true },
  { id: 'http-log', img: 'http-log.png', title: 'HTTP', info: 'Send request and response logs to an HTTP server.', api: true, consumer: true },
  { id: 'key-auth', img: 'key-authentication.png', title: 'Key Authentication', info: 'Add a key authentication to your APIs.', api: true, consumer: true },
  { id: 'hmac-auth', img: 'hmac-authentication.png', title: 'HMAC', info: 'Add HMAC authentication to your APIs.', api: true, consumer: true },
  { id: 'basic-auth', img: 'basic-authentication.png', title: 'Basic Authentication', info: 'Add basic authentication to your APIs.', api: true, consumer: true },
  { id: 'ip-restriction', img: 'ip-restriction.png', title: 'IP Restriction', info: 'Whitelist or blacklist IPs that can make requests.', api: true, consumer: false },
  { id: 'galileo', img: 'galileo.png', title: 'Galileo', info: 'Business intelligence platform for APIs.', api: true, consumer: true },
  { id: 'request-transformer', img: 'request-transformer.png', title: 'Request Transformer', info: 'Modify the request before hitting the upstream server.', api: true, consumer: false },
  { id: 'response-transformer', img: 'response-transformer.png', title: 'Response Transformer', info: 'Modify the upstream response before returning it to client.', api: true, consumer: true },
  { id: 'request-size-limiting', img: 'request-size-limiting.png', title: 'Request Size Limiting', 'info': 'Block requests with bodies greater than a specific size.', api: true, consumer: false },
  { id: 'rate-limiting', img: 'rate-limiting.png', title: 'Rate Limiting', info: 'Rate limit how many HTTP requests a developer can make.', api: true, consumer: false },
  { id: 'response-ratelimiting', img: 'response-rate-limiting.png', title: 'Response Rate Limiting', info: 'Rate limiting based on a custom response header value.', api: true, consumer: false },
  { id: 'syslog', img: 'syslog.png', title: 'Syslog', info: 'Send request and response logs to Syslog.', api: true, consumer: true },
  { id: 'loggly', img: 'loggly.png', title: 'Loggly', info: 'Send request and response logs to Loggly.', api: true, consumer: true },
  { id: 'datadog', img: 'datadog.png', title: 'Datadog', info: 'Visualize API metrics on Datadog.', api: true, consumer: true },
  { id: 'runscope', img: 'runscope.png', title: 'Runscope', info: 'API performance testing and monitoring.', api: true, consumer: true },
  { id: 'ldap-auth', img: 'ldap-authentication.png', title: 'LDAP', info: 'Integrate Kong with a LDAP server.', api: true, consumer: false },
  { id: 'statsd', img: 'statsd.png', title: 'StatsD', info: 'Send request and response logs to StatsD.', api: true, consumer: true },
  { id: 'bot-detection', img: '', title: 'Boot Detection', info: 'Protects your API from most common bots.', api: true, consumer: false }
];
/* tslint:enable */

export interface SchemaModelResource {
  no_consumer?: boolean;
  fields?: Object;
}

export interface PluginApiModelResource {
  api_id?: string;
  config?: Object; // TODO: Each plugin resource
  created_at?: number;
  enabled?: boolean;
  id?: string;
  name?: string;
}

@Injectable()
export class SchemaModel extends BaseModel {
  /* tslint:disable */
  no_consumer?: boolean;
  fields?: Object;
  /* tslint:enable */
  collection?: BaseModelCollection<SchemaModelResource>;

  constructor(data?: SchemaModelResource | BaseModelCollection<SchemaModelResource>) {
    super();

    if (has(data, 'data')) {
      this._setCollection(<BaseModelCollection<SchemaModelResource>>data);
    } else if (isObject(data)) {
      Object.assign(this, data);
    }
  }

  private _setCollection(collection: BaseModelCollection<SchemaModelResource>) {
    collection.data.forEach((value, index) => {
      collection.data[index] = new SchemaModel(<SchemaModelResource>value);
    });

    this.collection = collection;
  }
}

@Injectable()
export class PluginApiModel extends BaseModel {
  /* tslint:disable */
  api_id?: string;
  config?: Object; // TODO: Each plugin resource
  created_at?: number;
  enabled?: boolean;
  id?: string;
  name?: string;
  /* tslint:enable */

  collection?: BaseModelCollection<PluginApiModelResource>;

  constructor(data?: PluginApiModelResource | BaseModelCollection<PluginApiModelResource>) {
    super();

    if (has(data, 'data')) {
      this._setCollection(<BaseModelCollection<PluginApiModelResource>>data);
    } else if (isObject(data)) {
      Object.assign(this, data);
    }
  }

  private _setCollection(collection: BaseModelCollection<PluginApiModelResource>) {
    collection.data.forEach((value, index) => {
      collection.data[index] = new PluginApiModel(<PluginApiModelResource>value);
    });

    this.collection = collection;
  }
}
