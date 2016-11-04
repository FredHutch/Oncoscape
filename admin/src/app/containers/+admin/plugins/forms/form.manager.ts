import { Injectable } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { snakeCase, isNumber, isNull } from 'lodash/fp';

import { ControlBase, ControlSignature } from './control.base';
import {
  BasicModelConfig, BasicModel, KeyModelConfig, KeyModel,
  OAuthModelConfig, OAuthModel, HMacModelConfig, HMacModel,
  JWTModel, JWTModelConfig, LdapModelConfig, ACLModelConfig, ACLModel,
  CorsModelConfig, SSLModelConfig, IPModelConfig, BotModelConfig,
  RateModelConfig, ResponseRateLimitingModelConfig, RequestSizeLimitingModelConfig,
  RequestTransformerModelConfig, CorrelationModelConfig
} from '../../../../shared';

export interface FormSettings {
  title: string;
  formModel: any;
  controls: Array<ControlBase<any>>;
  help?: string;
  opts?: Object;
  attributes: Object;
  beforeUpdateModel?: Function;
  afterUpdateModel?: Function;
};

export interface DynamicFormSettings {
  [key: string]: FormSettings;
};

export interface Manager {
  form: FormGroup;
  model: any;
  description: FormSettings;
}

export const FORM_SETTINGS: DynamicFormSettings = <DynamicFormSettings>{
  'basic-auth-config': {
    title: 'Basic Authorization',
    formModel: BasicModelConfig,
    controls: [
      new ControlBase<string>(<ControlSignature<string>>{
        type: 'text',
        value: '',
        control: new FormControl('', Validators.required),
        label: 'Name',
        key: 'name',
        errorMsg: null,
        required: true,
        render: false
      }),
      new ControlBase<boolean>(<ControlSignature<boolean>>{
        type: 'checkbox',
        value: false,
        control: new FormControl(false),
        label: 'Hide Credentials',
        key: 'hideCredentials',
        errorMsg: null,
        required: false,
        render: true
      })
    ],
    /* tslint:disable */
    help: `
    <table class="table table-hover">
      <tr>
        <th>Attribute</th>
        <th>Description</th>
      </tr>
      <tr>
        <td><span class="badge-highlight">hide_credentials</span><br><em>optional</em></td>
        <td><p>An optional boolean value telling the plugin to hide the credential to the upstream API server. It will be removed by Kong before proxying the request.</p></td>
      </tr>
    </table>
    `,
    /* tslint:enable */
    attributes: {
      'name': 'name',
      'hideCredentials': 'config.hide_credentials'
    }
  },
  'basic-auth-consumer': {
    title: 'Basic Authorization',
    formModel: BasicModel,
    controls: [
      new ControlBase<string>(<ControlSignature<string>>{
        type: 'text',
        value: '',
        control: new FormControl('', Validators.required),
        label: 'Username',
        key: 'username',
        errorMsg: null,
        required: true
      }),
      new ControlBase<string>(<ControlSignature<string>>{
        type: 'password',
        value: '',
        control: new FormControl(''),
        label: 'Password',
        key: 'password',
        errorMsg: null,
        required: false
      })
    ],
    help: `
    <table class="table table-hover">
      <tr>
        <th>Attribute</th>
        <th>Description</th>
      </tr>
      <tr>
        <td><span class="badge-highlight">username</span></td>
        <td><p>The username to use in the Basic Authentication.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">password</span><br><em>semi-optional</em></td>
        <td><p>The password to use in the Basic Authentication.</p></td>
      </tr>
    </table>
    `,
    attributes: {
      'username': 'username',
      'password': 'password'
    }
  },
  'key-auth-config': {
    title: 'Key Authentication',
    formModel: KeyModelConfig,
    controls: [
      new ControlBase<string>(<ControlSignature<string>>{
        type: 'text',
        value: '',
        control: new FormControl('', Validators.required),
        label: 'Name',
        key: 'name',
        errorMsg: null,
        required: true,
        render: false
      }),
      new ControlBase<Array<string>>(<ControlSignature<Array<string>>>{
        type: 'text',
        value: [],
        control: new FormControl(),
        label: 'Key Names',
        key: 'keyNames',
        errorMsg: null,
        required: false
      }),
      new ControlBase<boolean>(<ControlSignature<boolean>>{
        type: 'checkbox',
        value: false,
        control: new FormControl(false),
        label: 'Hide Credentials',
        key: 'hideCredentials',
        errorMsg: null,
        required: false
      })
    ],
    /* tslint:disable */
    help: `
    <table class="table table-hover">
      <tr>
        <th>Attribute</th>
        <th>Description</th>
      </tr>
      <tr>
        <td><span class="badge-highlight">key_names</span><br><em>optional</em></td>
        <td><p>Describes an array of comma separated parameter names where the plugin will look for a key. The client must send the authentication key in one of those key names, and the plugin will try to read the credential from a header or the querystring parameter with the same name.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">hide_credentials</span><br><em>optional</em></td>
        <td><p>An optional boolean value telling the plugin to hide the credential to the upstream API server. It will be removed by Kong before proxying the request.</p></td>
      </tr>
    </table>
    `,
    /* tslint:enable */
    attributes: {
      'name': 'name',
      'keyNames': 'config.key_names',
      'hideCredentials': 'config.hide_credentials'
    },
    beforeUpdateModel: (form: FormGroup) => {
      let keys = form.value.keyNames
        ? form.value.keyNames.split(',').map((value: string) => { return value.trim(); })
        : [];

      form.get('keyNames').setValue(keys);
    }
  },
  'key-auth-consumer': {
    title: 'Key Authentication',
    formModel: KeyModel,
    controls: [
      new ControlBase<string>(<ControlSignature<string>>{
        type: 'text',
        value: '',
        control: new FormControl(''),
        label: 'Key',
        key: 'key',
        errorMsg: null,
        required: false
      })
    ],
    /* tslint:disable */
    help: `
    <table class="table table-hover">
      <tr>
        <th>Attribute</th>
        <th>Description</th>
      </tr>
      <tr>
        <td><span class="badge-highlight">key</span><br><em>optional</em></td>
        <td><p>You can optionally set your own unique key to authenticate the client. If missing, the plugin will generate one.</p></td>
      </tr>
    </table>
    `,
    /* tslint:enable */
    attributes: {
      'key': 'key'
    }
  },
  'oauth2-config': {
    title: 'OAUTH 2 Authentication',
    formModel: OAuthModelConfig,
    controls: [
      new ControlBase<string>(<ControlSignature<string>>{
        type: 'text',
        value: '',
        control: new FormControl('', Validators.required),
        label: 'Name',
        key: 'name',
        errorMsg: null,
        required: true,
        render: false
      }),
      new ControlBase<Array<string>>(<ControlSignature<Array<string>>>{
        type: 'text',
        value: [],
        control: new FormControl([], Validators.required),
        label: 'Scopes',
        key: 'scopes',
        errorMsg: null,
        required: true
      }),
      new ControlBase<boolean>(<ControlSignature<boolean>>{
        type: 'checkbox',
        value: false,
        control: new FormControl(false),
        label: 'Mandatory Scope',
        key: 'mandatoryScope',
        errorMsg: null,
        required: false
      }),
      new ControlBase<number>(<ControlSignature<number>>{
        type: 'number',
        value: 7200,
        control: new FormControl(7200),
        label: 'Token Expiration',
        key: 'tokenExpiration',
        errorMsg: null,
        required: false
      }),
      new ControlBase<boolean>(<ControlSignature<boolean>>{
        type: 'checkbox',
        value: false,
        control: new FormControl(false),
        label: 'Enable Authorization Code',
        key: 'enableAuthorizationCode',
        errorMsg: null,
        required: false
      }),
      new ControlBase<boolean>(<ControlSignature<boolean>>{
        type: 'checkbox',
        value: false,
        control: new FormControl(false),
        label: 'Enable Client Credentials',
        key: 'enableClientCredentials',
        errorMsg: null,
        required: false
      }),
      new ControlBase<boolean>(<ControlSignature<boolean>>{
        type: 'checkbox',
        value: false,
        control: new FormControl(false),
        label: 'Enable Implicit Grant',
        key: 'enableImplicitGrant',
        errorMsg: null,
        required: false
      }),
      new ControlBase<boolean>(<ControlSignature<boolean>>{
        type: 'checkbox',
        value: false,
        control: new FormControl(false),
        label: 'Enable Password Grant',
        key: 'enablePasswordGrant',
        errorMsg: null,
        required: false
      }),
      new ControlBase<boolean>(<ControlSignature<boolean>>{
        type: 'checkbox',
        value: false,
        control: new FormControl(false),
        label: 'Hide Credentials',
        key: 'hideCredentials',
        errorMsg: null,
        required: false
      }),
      new ControlBase<boolean>(<ControlSignature<boolean>>{
        type: 'checkbox',
        value: false,
        control: new FormControl(false),
        label: 'Accept Http if Already Terminated',
        key: 'acceptHttpIfAlreadyTerminated',
        errorMsg: null,
        required: false
      })
    ],
    /* tslint:disable */
    help: `
    <table class="table table-hover">
      <tr>
        <th>Attribute</th>
        <th>Description</th>
      </tr>
      <tr>
        <td><span class="badge-highlight">scopes</span></td>
        <td><p>Describes an array of comma separated scope names that will be available to the end user.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">mandatory_scope</span><br><em>optional</em></td>
        <td><p>An optional boolean value telling the plugin to require at least one scope to be authorized by the end user.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">token_expiration</span><br><em>optional</em></td>
        <td><p>An optional integer value telling the plugin how long should a token last, after which the client will need to refresh the token. Set to <span class="badge-highlight">0</span> to disable the expiration.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">enable_authorization_code</span><br><em>optional</em></td>
        <td><p>An optional boolean value to enable the three-legged Authorization Code flow <a href="https://tools.ietf.org/html/rfc6749#section-4.1">(RFC 6742 Section 4.1)</a>.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">enable_client_credentials</span><br><em>optional</em></td>
        <td><p>An optional boolean value to enable the Client Credentials Grant flow <a href="https://tools.ietf.org/html/rfc6749#section-4.4">(RFC 6742 Section 4.4)</a>.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">enable_implicit_grant</span><br><em>optional</em></td>
        <td><p>An optional boolean value to enable the Implicit Grant flow which allows to provision a token as a result of the authorization process <a href="https://tools.ietf.org/html/rfc6749#section-4.2">(RFC 6742 Section 4.2)</a>.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">enable_password_grant</span><br><em>optional</em></td>
        <td><p>An optional boolean value to enable the Resource Owner Password Credentials Grant flow <a href="https://tools.ietf.org/html/rfc6749#section-4.3">(RFC 6742 Section 4.3)</a>.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">hide_credentials</span><br><em>optional</em></td>
        <td><p>An optional boolean value telling the plugin to hide the credential to the upstream API server. It will be removed by Kong before proxying the request.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">accept_http_if_already_terminated</span><br><em>optional</em></td>
        <td><p>Accepts HTTPs requests that have already been terminated by a proxy or load balancer and the <span class="badge-highlight">x-forwarded-proto: https</span> header has been added to the request. Only enable this option if the Kong server cannot be publicly accessed and the only entry-point is such proxy or load balancer.</p></td>
      </tr>
    </table>
    `,
    /* tslint:enable */
    attributes: {
      'name': 'name',
      'acceptHttpIfAlreadyTerminated': 'config.accept_http_if_already_terminated',
      'hideCredentials': 'config.hide_credentials',
      'enablePasswordGrant': 'config.enable_password_grant',
      'enableImplicitGrant': 'config.enable_implicit_grant',
      'enableClientCredentials': 'config.enable_client_credentials',
      'enableAuthorizationCode': 'config.enable_authorization_code',
      'tokenExpiration': 'config.token_expiration',
      'mandatoryScope': 'config.mandatory_scope',
      'scopes': 'config.scopes'
    },
    beforeUpdateModel: (form: FormGroup) => {
      let scopes = form.value.scopes
        ? form.value.scopes.split(',').map(v => { return v.trim(); })
        : [];

      form.get('scopes').setValue(scopes);
    }
  },
  'oauth2-consumer': {
    title: 'OAUTH 2 Authentication',
    formModel: OAuthModel,
    controls: [
      new ControlBase<string>(<ControlSignature<string>>{
        type: 'text',
        value: '',
        control: new FormControl('', Validators.required),
        label: 'Name',
        key: 'name',
        errorMsg: null,
        required: true,
        holder: 'Great Application'
      }),
      new ControlBase<string>(<ControlSignature<string>>{
        type: 'text',
        value: '',
        control: new FormControl(''),
        label: 'Client ID',
        key: 'clientId',
        errorMsg: null,
        required: false
      }),
      new ControlBase<string>(<ControlSignature<string>>{
        type: 'text',
        value: '',
        control: new FormControl(''),
        label: 'Client Secret',
        key: 'clientSecret',
        errorMsg: null,
        required: false
      }),
      new ControlBase<string>(<ControlSignature<string>>{
        type: 'text',
        value: '',
        control: new FormControl('', Validators.required),
        label: 'Redirect URI',
        key: 'redirectUri',
        errorMsg: null,
        required: false,
        holder: 'http://some-domain/endpoint/'
      })
    ],
    /* tslint:disable */
    help: `
    <table class="table table-hover">
      <tr>
        <th>Attribute</th>
        <th>Description</th>
      </tr>
      <tr>
        <td><span class="badge-highlight">name</span></td>
        <td><p>The name to associate to the credential. In OAuth 2.0 this would be the application name.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">client_id</span><br><em>optional</em></td>
        <td><p>You can optionally set your own unique <span class="badge-highlight">client_id</span>. If missing, the plugin will generate one.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">client_secret</span><br><em>optional</em></td>
        <td><p>You can optionally set your own unique <span class="badge-highlight">client_secret</span>. If missing, the plugin will generate one.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">redirect_uri</span></td>
        <td><p>The URL in your app where users will be sent after authorization <a href="https://tools.ietf.org/html/rfc6749#section-3.1.2">(RFC 6742 Section 3.1.2)</a>.</p></td>
      </tr>
    </table>
    `,
    /* tslint:enable */
    attributes: {
      'name': 'name',
      'clientId': 'client_id',
      'clientSecret': 'client_secret',
      'redirectUri': 'redirect_uri'
    }
  },
  'hmac-auth-config': {
    title: 'HMAC Authentication',
    formModel: HMacModelConfig,
    controls: [
      new ControlBase<boolean>(<ControlSignature<boolean>>{
        type: 'checkbox',
        value: false,
        control: new FormControl(false),
        label: 'Hide Credentials',
        key: 'hideCredentials',
        errorMsg: null,
        required: false
      }),
      new ControlBase<number>(<ControlSignature<number>>{
        type: 'number',
        value: 300,
        control: new FormControl(300),
        label: 'Clock Skew',
        key: 'clockSkew',
        errorMsg: null,
        required: false
      }),
      new ControlBase<string>(<ControlSignature<string>>{
        type: 'text',
        value: '',
        control: new FormControl('', Validators.required),
        label: 'Name',
        key: 'name',
        errorMsg: null,
        required: true,
        render: false
      })
    ],
    /* tslint:disable */
    help: `
    <table class="table table-hover">
      <tr>
        <th>Attribute</th>
        <th>Description</th>
      </tr>
      <tr>
        <td><span class="badge-highlight">hide_credentials</span><br><em>optional</em></td>
        <td><p>An optional boolean value telling the plugin to hide the credential to the upstream API server. It will be removed by Kong before proxying the request.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">clock_skew</span><br><em>optional</em></td>
        <td><p>Clock Skew in seconds to prevent replay attacks.</p></td>
      </tr>
    </table>
    `,
    /* tslint:enable */
    attributes: {
      'name': 'name',
      'hideCredentials': 'config.hide_credentials',
      'clockSkew': 'config.clock_skew'
    }
  },
  'hmac-auth-consumer': {
    title: 'HMAC Authentication',
    formModel: HMacModel,
    controls: [
      new ControlBase<string>(<ControlSignature<string>>{
        type: 'text',
        value: '',
        control: new FormControl('', Validators.required),
        label: 'Username',
        key: 'username',
        errorMsg: null,
        required: true
      }),
      new ControlBase<string>(<ControlSignature<string>>{
        type: 'text',
        value: '',
        control: new FormControl(''),
        label: 'Secret',
        key: 'secret',
        errorMsg: null,
        required: false
      })
    ],
    help: `
    <table class="table table-hover">
      <tr>
        <th>Attribute</th>
        <th>Description</th>
      </tr>
      <tr>
        <td><span class="badge-highlight">username</span></td>
        <td><p>The username to use in the HMAC Signature verification.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">secret</span><br><em>optional</em></td>
        <td><p>The secret to use in the HMAC Signature verification.</p></td>
      </tr>
    </table>
    `,
    attributes: {
      'username': 'username',
      'secret': 'secret'
    }
  },
  'jwt-config': {
    title: 'JSON Web Tokens',
    formModel: JWTModelConfig,
    controls: [
      new ControlBase<string>(<ControlSignature<string>>{
        type: 'text',
        value: '',
        control: new FormControl('', Validators.required),
        label: 'name',
        key: 'name',
        errorMsg: null,
        required: true,
        render: false
      }),
      new ControlBase<Array<string>>(<ControlSignature<Array<string>>>{
        type: 'text',
        value: [],
        control: new FormControl(''),
        label: 'URI Parameters Names',
        key: 'uriParamNames',
        errorMsg: null,
        required: false
      }),
      new ControlBase<Array<string>>(<ControlSignature<Array<string>>>{
        type: 'text',
        value: [],
        control: new FormControl(''),
        label: 'Claims to Verify',
        key: 'claimsToVerify',
        errorMsg: null,
        required: false
      }),
      new ControlBase<string>(<ControlSignature<string>>{
        type: 'text',
        value: '',
        control: new FormControl(''),
        label: 'Key Claim Name',
        key: 'keyClaimName',
        errorMsg: null,
        required: false
      }),
      new ControlBase<boolean>(<ControlSignature<boolean>>{
        type: 'checkbox',
        value: false,
        control: new FormControl(false),
        label: 'Secret is Base64',
        key: 'secretIsBase64',
        errorMsg: null,
        required: false
      })
    ],
    /* tslint:disable */
    help: `
    <table class="table table-hover">
      <tr>
        <th>Attribute</th>
        <th>Description</th>
      </tr>
      <tr>
        <td><span class="badge-highlight">uri_param_names</span><br><em>optional</em></td>
        <td><p>A list of querystring parameters that Kong will inspect to retrieve JWTs.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">claims_to_verify</span><br><em>optional</em></td>
        <td><p>A list of registered claims (according to <a href="https://tools.ietf.org/html/rfc7519">RFC 7519</a>) that Kong can verify as well. Accepted values: <span class="badge-highlight">exp</span>, <span class="badge-highlight">nbf</span>.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">key_claim_name</span><br><em>optional</em></td>
        <td><p>The name of the claim in which the <span class="badge-highlight">key</span> identifying the secret must be passed.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">secret_is_base64</span><br><em>optional</em></td>
        <td><p>If true, the plugin assumes the credential's <span class="badge-highlight">secret</span> to be base64 encoded. You will need to create a base64 encoded secret for your consumer, and sign your JWT with the original secret.</p></td>
      </tr>
    </table>
    `,
    /* tslint:enable */
    attributes: {
      'name': 'name',
      'uriParamNames': 'config.uri_param_names',
      'claimsToVerify': 'config.claims_to_verify',
      'keyClaimName': 'config.key_claim_name',
      'secretIsBase64': 'config.secret_is_base64'
    },
    beforeUpdateModel: (form: FormGroup) => {
      let uriParamNames = form.value.uriParamNames
        ? form.value.uriParamNames.split(',').map((value: string) => { return value.trim(); })
        : [];
      let claimsToVerify = form.value.claimsToVerify
        ? form.value.claimsToVerify.split(',').map((value: string) => { return value.trim(); })
        : [];

      form.get('uriParamNames').setValue(uriParamNames);
      form.get('claimsToVerify').setValue(claimsToVerify);
    }
  },
  'jwt-consumer': {
    title: 'JSON Web Tokens',
    formModel: JWTModel,
    controls: [
      new ControlBase<string>(<ControlSignature<string>>{
        type: 'text',
        value: '',
        control: new FormControl(''),
        label: 'Key',
        key: 'key',
        errorMsg: null,
        required: false
      }),
      new ControlBase<string>(<ControlSignature<string>>{
        type: 'text',
        value: 'HS256',
        control: new FormControl('HS256'),
        label: 'Algorithm',
        key: 'algorithm',
        errorMsg: null,
        required: false
      }),
      new ControlBase<string>(<ControlSignature<string>>{
        type: 'textarea',
        value: '',
        control: new FormControl(''),
        label: 'RSA Public Key',
        key: 'rsaPublicKey',
        errorMsg: null,
        required: false
      }),
      new ControlBase<string>(<ControlSignature<string>>{
        type: 'text',
        value: '',
        control: new FormControl(''),
        label: 'Secret',
        key: 'secret',
        errorMsg: null,
        required: false
      })
    ],
    /* tslint:disable */
    help: `
    <table class="table table-hover">
      <tr>
        <th>Attribute</th>
        <th>Description</th>
      </tr>
      <tr>
        <td><span class="badge-highlight">key</span><br><em>optional</em></td>
        <td><p>A unique string identifying the credential. If left out, it will be auto-generated. However, usage of this key is mandatory while crafting your token, as specified in the next section.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">algorithm</span><br><em>optional</em></td>
        <td><p>The algorithm used to verify the token's signature. Can be <span class="badge-highlight">HS256</span> or <span class="badge-highlight">RS256</span>.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">rsa_public_key</span><br><em>optional</em></td>
        <td><p>If <span class="badge-highlight">algorithm</span> is <span class="badge-highlight">RS256</span>, the public key (in PEM format) to use to verify the token's signature.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">secret</span><br><em>optional</em></td>
        <td><p>If <span class="badge-highlight">algorithm</span> is <span class="badge-highlight">HS256</span>, the secret used to sign JWTs for this credential. If left out, will be auto-generated. If <span class="badge-highlight">algorithm</span> is <span class="badge-highlight">RS256</span>, this is the private key (in PEM format) to use to verify the token's signature.</p></td>
      </tr>
    </table>
    `,
    /* tslint:enable */
    attributes: {
      'key': 'key',
      'algorithm': 'algorithm',
      'rsaPublicKey': 'rsa_public_key',
      'secret': 'secret'
    }
  },
  'ldap-auth-config': {
    title: 'LDAP',
    formModel: LdapModelConfig,
    controls: [
      new ControlBase<string>(<ControlSignature<string>>{
        type: 'text',
        value: '',
        control: new FormControl('', Validators.required),
        label: 'Name',
        key: 'name',
        errorMsg: null,
        required: true,
        render: false
      }),
      new ControlBase<boolean>(<ControlSignature<boolean>>{
        type: 'checkbox',
        value: false,
        control: new FormControl(false),
        label: 'Hide Credentials',
        key: 'hideCredentials',
        errorMsg: null,
        required: false
      }),
      new ControlBase<string>(<ControlSignature<string>>{
        type: 'text',
        value: '',
        control: new FormControl('', Validators.required),
        label: 'Ldap Host',
        key: 'ldapHost',
        errorMsg: null,
        required: true
      }),
      new ControlBase<number>(<ControlSignature<number>>{
        type: 'number',
        value: 389,
        control: new FormControl(389, Validators.required),
        label: 'Ldap Port',
        key: 'ldapPort',
        errorMsg: null,
        required: true
      }),
      new ControlBase<boolean>(<ControlSignature<boolean>>{
        type: 'checkbox',
        value: false,
        control: new FormControl(false, Validators.required),
        label: 'Start TLS',
        key: 'startTls',
        errorMsg: null,
        required: true
      }),
      new ControlBase<string>(<ControlSignature<string>>{
        type: 'text',
        value: '',
        control: new FormControl('', Validators.required),
        label: 'Base DN',
        key: 'baseDn',
        errorMsg: null,
        required: true
      }),
      new ControlBase<boolean>(<ControlSignature<boolean>>{
        type: 'checkbox',
        value: false,
        control: new FormControl(false, Validators.required),
        label: 'Verify Ldap Host',
        key: 'verifyLdapHost',
        errorMsg: null,
        required: true
      }),
      new ControlBase<string>(<ControlSignature<string>>{
        type: 'text',
        value: '',
        control: new FormControl('', Validators.required),
        label: 'Attribute',
        key: 'attribute',
        errorMsg: null,
        required: true
      }),
      new ControlBase<number>(<ControlSignature<number>>{
        type: 'number',
        value: 60,
        control: new FormControl(60, Validators.required),
        label: 'Cache TTL',
        key: 'cacheTtl',
        errorMsg: null,
        required: true
      }),
      new ControlBase<number>(<ControlSignature<number>>{
        type: 'number',
        value: 10000,
        control: new FormControl(10000),
        label: 'Timeout',
        key: 'timeout',
        errorMsg: null,
        required: false
      }),
      new ControlBase<number>(<ControlSignature<number>>{
        type: 'number',
        value: 60000,
        control: new FormControl(60000),
        label: 'Keep Alive',
        key: 'keepAlive',
        errorMsg: null,
        required: false
      }),
    ],
    /* tslint:disable */
    help: `
    <table class="table table-hover">
      <tr>
        <th>Attribute</th>
        <th>Description</th>
      </tr>
      <tr>
        <td><span class="badge-highlight">hide_credentials</span><br><em>optional</em></td>
        <td><p>An optional boolean value telling the plugin to hide the credential to the upstream API server. It will be removed by Kong before proxying the request.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">ldap_host</span></td>
        <td><p>Host on which the LDAP server is running.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">ldap_port</span></td>
        <td>TCP port where the LDAP server is listening.</td>
      </tr>
      <tr>
        <td><span class="badge-highlight">start_tls</span></td>
        <td><p>Set it to <span class="badge-highlight">true</span> to issue StartTLS (Transport Layer Security) extended operation over <span class="badge-highlight">ldap</span> connection.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">base_dn</span></td>
        <td><p>Base DN as the starting point for the search.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">verify_ldap_host</span></td>
        <td><p>Set it to <span class="badge-highlight">true</span> to authenticate LDAP server. The server certificate will be verified according to the CA certificates specified by the <span class="badge-highlight">lua_ssl_trusted_certificate</span> directive.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">attribute</span></td>
        <td><p>Attribute to be used to search the user.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">cache_ttl</span></td>
        <td><p>Cache expiry time in seconds.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">timeout</span><br><em>optional</em></td>
        <td><p>An optional timeout in milliseconds when waiting for connection with LDAP server.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">keepalive</span><br><em>optional</em></td>
        <td><p>An optional value in milliseconds that defines for how long an idle connection to LDAP server will live before being closed.</p></td>
      </tr>
    </table>
    `,
    /* tslint:enable */
    attributes: {
      'name': 'name',
      'hideCredentials': 'config.hide_credentials',
      'ldapHost': 'config.ldap_host',
      'ldapPort': 'config.ldap_port',
      'startTls': 'config.start_tls',
      'baseDn': 'config.base_dn',
      'verifyLdapHost': 'config.verify_ldap_host',
      'attribute': 'config.attribute',
      'cacheTtl': 'config.cache_ttl',
      'timeout': 'config.timeout',
      'keepAlive': 'config.keepalive'
    }
  },
  'acl-config': {
    title: 'ACL',
    formModel: ACLModelConfig,
    controls: [
      new ControlBase<string>(<ControlSignature<string>>{
        type: 'text',
        value: '',
        control: new FormControl('', Validators.required),
        label: 'Name',
        key: 'name',
        errorMsg: null,
        required: true,
        render: false
      }),
      new ControlBase<Array<string>>(<ControlSignature<Array<string>>>{
        type: 'text',
        value: [],
        control: new FormControl([]),
        label: 'Whitelist',
        key: 'whitelist',
        errorMsg: null,
        required: false
      }),
      new ControlBase<Array<string>>(<ControlSignature<Array<string>>>{
        type: 'text',
        value: [],
        control: new FormControl([]),
        label: 'Blacklist',
        key: 'blacklist',
        errorMsg: null,
        required: false
      })
    ],
    /* tslint:disable */
    help: `
    <table class="table table-hover">
      <tr>
        <th>Attribute</th>
        <th>Description</th>
      </tr>
      <tr>
        <td><span class="badge-highlight">whitelist</span><br><em>optional</em></td>
        <td><p>Comma separated list of arbitrary group names that are allowed to consume the API. At least one between <span class="badge-highlight">config.whitelist</span> or <span class="badge-highlight">config.blacklist</span> must be specified.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">blacklist</span><br><em>optional</em></td>
        <td><p>Comma separated list of arbitrary group names that are not allowed to consume the API. At least one between <span class="badge-highlight">config.whitelist</span> or <span class="badge-highlight">config.blacklist</span> must be specified.</p></td>
      </tr>
    </table>
    `,
    /* tslint:enable */
    attributes: {
      'name': 'name',
      'whitelist': 'config.whitelist',
      'blacklist': 'config.blacklist'
    },
    beforeUpdateModel: (form: FormGroup) => {
      let whitelist = form.value.whitelist
        ? form.value.whitelist.split(',').map((value: string) => { return value.trim(); })
        : [];

      let blacklist = form.value.blacklist
        ? form.value.blacklist.split(',').map((value: string) => { return value.trim(); })
        : [];

      form.get('whitelist').setValue(whitelist);
      form.get('blacklist').setValue(blacklist);
    }
  },
  'acl-consumer': {
    title: 'ACL',
    formModel: ACLModel,
    controls: [
      new ControlBase<string>(<ControlSignature<string>>{
        type: 'text',
        value: '',
        control: new FormControl('', Validators.required),
        label: 'Group',
        key: 'group',
        errorMsg: null,
        required: true
      })
    ],
    help: `
    <table class="table table-hover">
      <tr>
        <th>Attribute</th>
        <th>Description</th>
      </tr>
      <tr>
        <td><span class="badge-highlight">group</span></td>
        <td><p>The arbitrary group name to associate to the consumer.</p></td>
      </tr>
    </table>
    `,
    attributes: {
      'group': 'group'
    }
  },
  'cors-config': {
    title: 'CORS',
    formModel: CorsModelConfig,
    controls: [
      new ControlBase<string>(<ControlSignature<string>>{
        type: 'text',
        value: '',
        control: new FormControl('', Validators.required),
        label: 'Name',
        key: 'name',
        errorMsg: null,
        required: true,
        render: false
      }),
      new ControlBase<string>(<ControlSignature<string>>{
        type: 'text',
        value: '*',
        control: new FormControl('*'),
        label: 'Origin',
        key: 'origin',
        errorMsg: null,
        required: false
      }),
      new ControlBase<Array<string>>(<ControlSignature<Array<string>>>{
        type: 'text',
        value: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
        control: new FormControl(['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE']),
        label: 'Methods',
        key: 'methods',
        errorMsg: null,
        required: false
      }),
      new ControlBase<Array<string>>(<ControlSignature<Array<string>>>{
        type: 'text',
        value: [],
        control: new FormControl([]),
        label: 'Headers',
        key: 'headers',
        errorMsg: null,
        required: false
      }),
      new ControlBase<Array<string>>(<ControlSignature<Array<string>>>{
        type: 'text',
        value: [],
        control: new FormControl([]),
        label: 'Exposed Headers',
        key: 'exposedHeaders',
        errorMsg: null,
        required: false
      }),
      new ControlBase<boolean>(<ControlSignature<boolean>>{
        type: 'checkbox',
        value: false,
        control: new FormControl(false),
        label: 'Credentials',
        key: 'credentials',
        errorMsg: null,
        required: false
      }),
      new ControlBase<number>(<ControlSignature<number>>{
        type: 'number',
        value: 60,
        control: new FormControl(60),
        label: 'Max Age',
        key: 'maxAge',
        errorMsg: null,
        required: false
      }),
      new ControlBase<boolean>(<ControlSignature<boolean>>{
        type: 'checkbox',
        value: false,
        control: new FormControl(false),
        label: 'Preflight Continue',
        key: 'preflightContinue',
        errorMsg: null,
        required: false
      })
    ],
    /* tslint:disable */
    help: `
    <table class="table table-hover">
      <tr>
        <th>Attribute</th>
        <th>Description</th>
      </tr>
      <tr>
        <td><span class="badge-highlight">origin</span><br><em>optional</em></td>
        <td><p>Value for the <span class="badge-highlight">Access-Control-Allow-Origin</span> header, expects a <span class="badge-highlight">String</span>.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">methods</span><br><em>optional</em></td>
        <td><p>Value for the <span class="badge-highlight">Access-Control-Allow-Methods</span> header, expects a comma delimited string (e.g. <span class="badge-highlight">GET,POST</span>).</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">headers</span><br><em>optional</em></td>
        <td><p>Value for the <span class="badge-highlight">Access-Control-Allow-Headers</span> header, expects a comma delimited string (e.g. <span class="badge-highlight">Origin, Authorization</span>).</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">exposed_headers</span><br><em>optional</em></td>
        <td><p>Value for the <span class="badge-highlight">Access-Control-Expose-Headers</span> header, expects a comma delimited string (e.g. <span class="badge-highlight">Origin, Authorization</span>). If not specified, no custom headers are exposed.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">credentials</span><br><em>optional</em></td>
        <td><p>Flag to determine whether the <span class="badge-highlight">Access-Control-Allow-Credentials</span> header should be sent with <span class="badge-highlight">true</span> as the value.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">max_age</span><br><em>optional</em></td>
        <td><p>Indicated how long the results of the preflight request can be cached, in <span class="badge-highlight">seconds</span>.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">preflight_continue</span><br><em>optional</em></td>
        <td><p>A boolean value that instructs the plugin to proxy the <span class="badge-highlight">OPTIONS</span> preflight request to the upstream API.</p></td>
      </tr>
    </table>
    `,
    /* tslint:enable */
    attributes: {
      'name': 'name',
      'origin': 'config.origin',
      'methods': 'config.methods',
      'headers': 'config.headers',
      'exposedHeaders': 'config.exposed_headers',
      'credentials': 'config.credentials',
      'maxAge': 'config.max_age',
      'preflightContinue': 'config.preflight_continue'
    }
  },
  'ssl-config': {
    title: 'Dynamic SSL',
    formModel: SSLModelConfig,
    controls: [
      new ControlBase<string>(<ControlSignature<string>>{
        type: 'text',
        value: '',
        control: new FormControl('', Validators.required),
        label: 'Name',
        key: 'name',
        errorMsg: null,
        required: true,
        render: false
      }),
      new ControlBase<any>(<ControlSignature<any>>{
        type: 'file',
        value: '',
        control: new FormControl('', Validators.required),
        label: 'Certificate',
        key: 'cert',
        errorMsg: null,
        required: true
      }),
      new ControlBase<any>(<ControlSignature<any>>{
        type: 'file',
        value: '',
        control: new FormControl('', Validators.required),
        label: 'Certificate Key',
        key: 'key',
        errorMsg: null,
        required: true
      }),
      new ControlBase<boolean>(<ControlSignature<boolean>>{
        type: 'checkbox',
        value: false,
        control: new FormControl(false),
        label: 'Only HTTPS',
        key: 'onlyHttps',
        errorMsg: null,
        required: false
      }),
      new ControlBase<boolean>(<ControlSignature<boolean>>{
        type: 'checkbox',
        value: false,
        control: new FormControl(false),
        label: 'Accept Http if already Terminated',
        key: 'acceptHttpIfAlreadyTerminated',
        errorMsg: null,
        required: false
      })
    ],
    /* tslint:disable */
    help: `
    <table class="table table-hover">
      <tr>
        <th>Attribute</th>
        <th>Description</th>
      </tr>
      <tr>
        <td><span class="badge-highlight">cert</span></td>
        <td><p>Upload the data of the certificate to use. Note that is the the actual data of the key (not the path), so it should be sent in <span class="badge-highlight">multipart/form-data</span> upload request.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">key</span></td>
        <td><p>Upload the data of the certificate key to use. Note that is the the actual data of the key (not the path), so it should be sent in <span class="badge-highlight">multipart/form-data</span> upload request.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">only_https</span><br><em>optional</em></td>
        <td><p>Specify if the service should only be available through an <span class="badge-highlight">https</span> protocol.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">accept_http_if_already_terminated</span><br><em>optional</em></td>
        <td><p>If <span class="badge-highlight">config.only_https</span> is <span class="badge-highlight">true</span>, accepts HTTPs requests that have already been terminated by a proxy or load balancer and the <span class="badge-highlight">x-forwarded-proto: https</span> header has been added to the request. Only enable this option if the Kong server cannot be publicly accessed and the only entry-point is such proxy or load balancer.</p></td>
      </tr>
    </table>
    `,
    /* tslint:enable */
    attributes: {
      'name': 'name',
      'cert': 'config.cert',
      'key': 'config.key',
      'onlyHttps': 'config.only_https',
      'acceptHttpIfAlreadyTerminated': 'accept_http_if_already_terminated'
    }
  },
  'ip-restriction-config': {
    title: 'IP Restriction',
    formModel: IPModelConfig,
    controls: [
      new ControlBase<string>(<ControlSignature<string>>{
        type: 'text',
        value: '',
        control: new FormControl('', Validators.required),
        label: 'Name',
        key: 'name',
        errorMsg: null,
        required: true,
        render: false
      }),
      new ControlBase<string>(<ControlSignature<string>>{
        type: 'text',
        value: '',
        control: new FormControl(''),
        label: 'Consumer ID',
        key: 'consumerId',
        errorMsg: null,
        required: false
      }),
      new ControlBase<Array<string>>(<ControlSignature<Array<string>>>{
        type: 'text',
        value: [],
        control: new FormControl([]),
        label: 'Whitelist',
        key: 'whitelist',
        errorMsg: null,
        required: false
      }),
      new ControlBase<Array<string>>(<ControlSignature<Array<string>>>{
        type: 'text',
        value: [],
        control: new FormControl([]),
        label: 'Blacklist',
        key: 'blacklist',
        errorMsg: null,
        required: false
      })
    ],
    /* tslint:disable */
    help: `
    <table class="table table-hover">
      <tr>
        <th>Attribute</th>
        <th>Description</th>
      </tr>
      <tr>
        <td><span class="badge-highlight">consumer_id</span><br><em>optional</em></td>
        <td><p>The CONSUMER ID that this plugin configuration will target. This value can only be used if authentication has been enabled so that the system can identify the user making the request.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">whitelist</span><br><em>semi-optional</em></td>
        <td><p>Comma separated list of arbitrary group names that are allowed to consume the API. At least one between <span class="badge-highlight">config.whitelist</span> or <span class="badge-highlight">config.blacklist</span> must be specified.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">blacklist</span><br><em>semi-optional</em></td>
        <td><p>Comma separated list of arbitrary group names that are not allowed to consume the API. At least one between <span class="badge-highlight">config.whitelist</span> or <span class="badge-highlight">config.blacklist</span> must be specified.</p></td>
      </tr>
    </table>
    `,
    /* tslint:enable */
    attributes: {
      'name': 'name',
      'consumerId': 'consumer_id',
      'whitelist': 'config.whitelist',
      'blacklist': 'config.blacklist'
    }
  },
  'bot-detection-config': {
    title: 'Bot Detection',
    formModel: BotModelConfig,
    controls: [
      new ControlBase<string>(<ControlSignature<string>>{
        type: 'text',
        value: '',
        control: new FormControl('', Validators.required),
        label: 'Name',
        key: 'name',
        errorMsg: null,
        required: true,
        render: false
      }),
      new ControlBase<Array<string>>(<ControlSignature<Array<string>>>{
        type: 'text',
        value: [],
        control: new FormControl([]),
        label: 'Whitelist',
        key: 'whitelist',
        errorMsg: null,
        required: false
      }),
      new ControlBase<Array<string>>(<ControlSignature<Array<string>>>{
        type: 'text',
        value: [],
        control: new FormControl([]),
        label: 'Blacklist',
        key: 'blacklist',
        errorMsg: null,
        required: false
      })
    ],
    /* tslint:disable */
    help: `
    <table class="table table-hover">
      <tr>
        <th>Attribute</th>
        <th>Description</th>
      </tr>
      <tr>
        <td><span class="badge-highlight">whitelist</span><br><em>optional</em></td>
        <td><p>A comma separated array of regular expressions that should be whitelisted. The regular expressions will be checked against the <span class="badge-highlight">User-Agent</span> header.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">blacklist</span><br><em>optional</em></td>
        <td><p>A comma separated array of regular expressions that should be blacklisted. The regular expressions will be checked against the <span class="badge-highlight">User-Agent</span> header.</p></td>
      </tr>
    </table>
    `,
    /* tslint:enable */
    attributes: {
      'name': 'name',
      'whitelist': 'config.whitelist',
      'blacklist': 'config.blacklist'
    }
  },
  'rate-limiting-config': {
    title: 'Rate Limiting',
    formModel: RateModelConfig,
    controls: [
      new ControlBase<string>(<ControlSignature<string>>{
        type: 'text',
        value: '',
        control: new FormControl('', Validators.required),
        label: 'Name',
        key: 'name',
        errorMsg: null,
        required: true,
        render: false
      }),
      new ControlBase<string>(<ControlSignature<string>>{
        type: 'text',
        value: '',
        control: new FormControl(''),
        label: 'Consumer ID',
        key: 'consumerId',
        errorMsg: null,
        required: false
      }),
      new ControlBase<number>(<ControlSignature<number>>{
        type: 'number',
        value: null,
        control: new FormControl(null),
        label: 'Second',
        key: 'second',
        errorMsg: null,
        required: false
      }),
      new ControlBase<number>(<ControlSignature<number>>{
        type: 'number',
        value: null,
        control: new FormControl(null),
        label: 'Minute',
        key: 'minute',
        errorMsg: null,
        required: false
      }),
      new ControlBase<number>(<ControlSignature<number>>{
        type: 'number',
        value: null,
        control: new FormControl(null),
        label: 'Hour',
        key: 'hour',
        errorMsg: null,
        required: false
      }),
      new ControlBase<number>(<ControlSignature<number>>{
        type: 'number',
        value: null,
        control: new FormControl(null),
        label: 'Day',
        key: 'day',
        errorMsg: null,
        required: false
      }),
      new ControlBase<number>(<ControlSignature<number>>{
        type: 'number',
        value: null,
        control: new FormControl(null),
        label: 'Month',
        key: 'month',
        errorMsg: null,
        required: false
      }),
      new ControlBase<number>(<ControlSignature<number>>{
        type: 'number',
        value: null,
        control: new FormControl(null),
        label: 'Year',
        key: 'year',
        errorMsg: null,
        required: false
      }),
      new ControlBase<string>(<ControlSignature<string>>{
        type: 'text',
        value: '',
        control: new FormControl('consumer'),
        label: 'Limit By',
        key: 'limitBy',
        errorMsg: null,
        required: false
      }),
      new ControlBase<string>(<ControlSignature<string>>{
        type: 'text',
        value: '',
        control: new FormControl('cluster'),
        label: 'Policy',
        key: 'policy',
        errorMsg: null,
        required: false
      }),
      new ControlBase<boolean>(<ControlSignature<boolean>>{
        type: 'checkbox',
        value: true,
        control: new FormControl(true),
        label: 'Fault Tolerant',
        key: 'faultTolerant',
        errorMsg: null,
        required: false
      }),
      new ControlBase<string>(<ControlSignature<string>>{
        type: 'text',
        value: null,
        control: new FormControl(null),
        label: 'Redis Host',
        key: 'redisHost',
        errorMsg: null,
        required: false
      }),
      new ControlBase<number>(<ControlSignature<number>>{
        type: 'number',
        value: 6379,
        control: new FormControl(6379),
        label: 'Redis Port',
        key: 'redisPort',
        errorMsg: null,
        required: false
      }),
      new ControlBase<number>(<ControlSignature<number>>{
        type: 'number',
        value: 2000,
        control: new FormControl(2000),
        label: 'Redis Timeout',
        key: 'redisTimeout',
        errorMsg: null,
        required: false
      })
    ],
    /* tslint:disable */
    help: `
    <table class="table table-hover">
      <tr>
        <th>Attribute</th>
        <th>Description</th>
      </tr>
      <tr>
        <td><span class="badge-highlight">consumer_id</span><br><em>optional</em></td>
        <td><p>The CONSUMER ID that this plugin configuration will target. This value can only be used if authentication has been enabled so that the system can identify the user making the request.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">second</span><br><em>semi-optional</em></td>
        <td><p>The amount of HTTP requests the developer can make per second. At least one limit must exist.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">minute</span><br><em>semi-optional</em></td>
        <td><p>The amount of HTTP requests the developer can make per minute. At least one limit must exist.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">hour</span><br><em>semi-optional</em></td>
        <td><p>The amount of HTTP requests the developer can make per hour. At least one limit must exist.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">day</span><br><em>semi-optional</em></td>
        <td><p>The amount of HTTP requests the developer can make per day. At least one limit must exist.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">month</span><br><em>semi-optional</em></td>
        <td><p>The amount of HTTP requests the developer can make per month. At least one limit must exist.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">year</span><br><em>semi-optional</em></td>
        <td><p>The amount of HTTP requests the developer can make per year. At least one limit must exist.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">limit_by</span><br><em>optional</em></td>
        <td><p>The entity that will be used when aggregating the limits: <span class="badge-highlight">consumer</span>, <span class="badge-highlight">credential</span>, <span class="badge-highlight">ip</span>. If the <span class="badge-highlight">consumer</span> or the credential cannot be determined, the system will always fallback to <span class="badge-highlight">ip</span>.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">policy</span><br><em>optional</em></td>
        <td><p>The rate-limiting policies to use for retrieving and incrementing the limits. Available values are <span class="badge-highlight">local</span> (counters will be stored locally in-memory on the node), <span class="badge-highlight">cluster</span> (counters are stored in the datastore and shared across the nodes) and <span class="badge-highlight">redis</span> (counters are stored on a Redis server and will be shared across the nodes).</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">fault_tolerant</span><br><em>optional</em></td>
        <td><p>A boolean value that determines if the requests should be proxied even if Kong has troubles connecting a third-party datastore. If <span class="badge-highlight">true</span> requests will be proxied anyways effectively disabling the rate-limiting function until the datastore is working again. If <span class="badge-highlight">false</span> then the clients will see <span class="badge-highlight">500</span> errors.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">redis_host</span><br><em>semi-optional</em></td>
        <td><p>When using the <span class="badge-highlight">redis</span> policy, this property specifies the address to the Redis server.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">redis_port</span><br><em>optional</em></td>
        <td><p>When using the <span class="badge-highlight">redis</span> policy, this property specifies the port of the Redis server. By default is <span class="badge-highlight">6379</span>.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">redis_port</span><br><em>optional</em></td>
        <td><p>When using the <span class="badge-highlight">redis</span> policy, this property specifies the timeout in milliseconds of any command submitted to the Redis server.</p></td>
      </tr>
    </table>
    `,
    /* tslint:enable */
    attributes: {
      'name': 'name',
      'consumerId': 'consumer_id',
      'second': 'config.second',
      'minute': 'config.minute',
      'hour': 'config.hour',
      'day': 'config.day',
      'month': 'config.month',
      'year': 'config.year',
      'limitBy': 'config.limit_by',
      'policy': 'config.policy',
      'faultTolerant': 'config.fault_tolerant',
      'redisHost': 'config.redis_host',
      'redisPort': 'config.redis_port',
      'redisTimeout': 'config.redis_timeout'
    }
  },
  'response-ratelimiting-config': {
    title: 'Response Rate Limiting',
    formModel: ResponseRateLimitingModelConfig,
    controls: [
      new ControlBase<string>(<ControlSignature<string>>{
        type: 'text',
        value: '',
        control: new FormControl('', Validators.required),
        label: 'Name',
        key: 'name',
        errorMsg: null,
        required: true,
        render: false
      }),
      new ControlBase<string>(<ControlSignature<string>>{
        type: 'text',
        value: null,
        control: new FormControl(null),
        label: 'Consumer ID',
        key: 'consumerId',
        errorMsg: null,
        required: false
      }),
      new ControlBase<string>(<ControlSignature<string>>{
        type: 'text',
        value: null,
        control: new FormControl(null, Validators.required),
        label: 'Limit Name',
        key: 'limitName',
        errorMsg: null,
        required: true
      }),
      new ControlBase<number>(<ControlSignature<number>>{
        type: 'number',
        value: null,
        control: new FormControl(null),
        label: 'Second',
        key: 'second',
        errorMsg: null,
        required: false
      }),
      new ControlBase<number>(<ControlSignature<number>>{
        type: 'number',
        value: null,
        control: new FormControl(null),
        label: 'Minute',
        key: 'minute',
        errorMsg: null,
        required: false
      }),
      new ControlBase<number>(<ControlSignature<number>>{
        type: 'number',
        value: null,
        control: new FormControl(null),
        label: 'Hour',
        key: 'hour',
        errorMsg: null,
        required: false
      }),
      new ControlBase<number>(<ControlSignature<number>>{
        type: 'number',
        value: null,
        control: new FormControl(null),
        label: 'Day',
        key: 'day',
        errorMsg: null,
        required: false
      }),
      new ControlBase<number>(<ControlSignature<number>>{
        type: 'number',
        value: null,
        control: new FormControl(null),
        label: 'Month',
        key: 'month',
        errorMsg: null,
        required: false
      }),
      new ControlBase<number>(<ControlSignature<number>>{
        type: 'number',
        value: null,
        control: new FormControl(null),
        label: 'Year',
        key: 'year',
        errorMsg: null,
        required: false
      }),
      new ControlBase<string>(<ControlSignature<string>>{
        type: 'text',
        value: 'X-Kong-Limit',
        control: new FormControl('X-Kong-Limit'),
        label: 'Header Name',
        key: 'headerName',
        errorMsg: null,
        required: false
      }),
      new ControlBase<boolean>(<ControlSignature<boolean>>{
        type: 'checkbox',
        value: false,
        control: new FormControl(false),
        label: 'Block On First Violation',
        key: 'blockOnFirstViolation',
        errorMsg: null,
        required: false
      }),
      new ControlBase<string>(<ControlSignature<string>>{
        type: 'text',
        value: 'consumer',
        control: new FormControl('consumer'),
        label: 'Limit By',
        key: 'limitBy',
        errorMsg: null,
        required: false
      }),
      new ControlBase<string>(<ControlSignature<string>>{
        type: 'text',
        value: 'cluster',
        control: new FormControl('cluster'),
        label: 'Policy',
        key: 'policy',
        errorMsg: null,
        required: false
      }),
      new ControlBase<boolean>(<ControlSignature<boolean>>{
        type: 'checkbox',
        value: true,
        control: new FormControl(true),
        label: 'Fault Tolerant',
        key: 'faultTolerant',
        errorMsg: null,
        required: false
      }),
      new ControlBase<string>(<ControlSignature<string>>{
        type: 'text',
        value: null,
        control: new FormControl(null),
        label: 'Redis Host',
        key: 'redisHost',
        errorMsg: null,
        required: false
      }),
      new ControlBase<number>(<ControlSignature<number>>{
        type: 'number',
        value: null,
        control: new FormControl(null),
        label: 'Redis Port',
        key: 'redisPort',
        errorMsg: null,
        required: false,
        holder: '6379'
      }),
      new ControlBase<number>(<ControlSignature<number>>{
        type: 'number',
        value: null,
        control: new FormControl(null),
        label: 'Redis Timeout',
        key: 'redisTimeout',
        errorMsg: null,
        required: false,
        holder: '2000'
      })
    ],
    /* tslint:disable */
    help: `
    <table class="table table-hover">
      <tr>
        <th>Attribute</th>
        <th>Description</th>
      </tr>
      <tr>
        <td><span class="badge-highlight">consumer_id</span><br><em>optional</em></td>
        <td><p>The CONSUMER ID that this plugin configuration will target. This value can only be used if authentication has been enabled so that the system can identify the user making the request.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">limit_name</span><br><em>optional</em></td>
        <td><p>This is a list of custom objects that you can set on the API, with arbitrary names set in the <span class="badge-highlight">{limit_name}</span> placeholder, like <span class="badge-highlight">config.limits.sms.minute=20</span> if your object is called "SMS".</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">second</span><br><em>semi-optional</em></td>
        <td><p>The amount of HTTP requests the developer can make per second. At least one limit must exist.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">minute</span><br><em>semi-optional</em></td>
        <td><p>The amount of HTTP requests the developer can make per minute. At least one limit must exist.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">hour</span><br><em>semi-optional</em></td>
        <td><p>The amount of HTTP requests the developer can make per hour. At least one limit must exist.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">day</span><br><em>semi-optional</em></td>
        <td><p>The amount of HTTP requests the developer can make per day. At least one limit must exist.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">month</span><br><em>semi-optional</em></td>
        <td><p>The amount of HTTP requests the developer can make per month. At least one limit must exist.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">year</span><br><em>semi-optional</em></td>
        <td><p>The amount of HTTP requests the developer can make per year. At least one limit must exist.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">header_name</span><br><em>optional</em></td>
        <td><p>The name of the response header used to increment the counters.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">block_on_first_violation</span><br><em>optional</em></td>
        <td><p>A boolean value that determines if the requests should be blocked as soon as one limit is being exceeded. This will block requests that are supposed to consume other limits too.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">limit_by</span><br><em>optional</em></td>
        <td><p>The entity that will be used when aggregating the limits: <span class="badge-highlight">consumer</span>, <span class="badge-highlight">credential</span>, <span class="badge-highlight">ip</span>. If the <span class="badge-highlight">consumer</span> or the <span class="badge-highlight">credential</span> cannot be determined, the system will always fallback to <span class="badge-highlight">ip</span>.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">policy</span><br><em>optional</em></td>
        <td><p>The rate-limiting policies to use for retrieving and incrementing the limits. Available values are <span class="badge-highlight">local</span> (counters will be stored locally in-memory on the node), <span class="badge-highlight">cluster</span> (counters are stored in the datastore and shared across the nodes) and <span class="badge-highlight">redis</span> (counters are stored on a Redis server and will be shared across the nodes).</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">fault_tolerant</span><br><em>optional</em></td>
        <td><p>A boolean value that determines if the requests should be proxied even if Kong has troubles connecting a third-party datastore. If <span class="badge-highlight">true</span> requests will be proxied anyways effectively disabling the rate-limiting function until the datastore is working again. If <span class="badge-highlight">false</span> then the clients will see <span class="badge-highlight">500</span> errors.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">redis_host</span><br><em>optional</em></td>
        <td><p>When using the <span class="badge-highlight">redis</span> policy, this property specifies the address to the Redis server.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">redis_port</span><br><em>optional</em></td>
        <td><p>When using the <span class="badge-highlight">redis</span> policy, this property specifies the port of the Redis server.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">redis_timeout</span><br><em>optional</em></td>
        <td><p>When using the <span class="badge-highlight">redis</span> policy, this property specifies the timeout in milliseconds of any command submitted to the Redis server.</p></td>
      </tr>
    </table>
    `,
    /* tslint:enable */
    attributes: {
      'name': 'name',
      'consumerId': 'consumer_id',
      'limitName': 'config.limits.limit_name',
      'second': 'config.limits.second',
      'minute': 'config.limits.minute',
      'hour': 'config.limits.hour',
      'day': 'config.limits.day',
      'month': 'config.limits.month',
      'year': 'config.limits.year',
      'headerName': 'config.header_name',
      'blockOnFirstViolation': 'config.block_on_first_violation',
      'limitBy': 'config.limit_by',
      'policy': 'config.policy',
      'faultTolerant': 'config.fault_tolerant',
      'redisHost': 'config.redis_host',
      'redisPort': 'config.redis_port',
      'redisTimeout': 'config.redis_timeout'
    },
    afterUpdateModel: (manager: Manager) => {
      let name = snakeCase(manager.form.get('limitName').value);
      let model = manager.model;

      if (isNumber(model.config.limits.day)) {
        model.setAttribute(`config.limits.${name}.day`, model.config.limits.day);
      }
      if (isNumber(model.config.limits.hour)) {
        model.setAttribute(`config.limits.${name}.hour`, model.config.limits.hour);
      }
      if (isNumber(model.config.limits.minute)) {
        model.setAttribute(`config.limits.${name}.minute`, model.config.limits.minute);
      }
      if (isNumber(model.config.limits.month)) {
        model.setAttribute(`config.limits.${name}.month`, model.config.limits.month);
      }
      if (isNumber(model.config.limits.second)) {
        model.setAttribute(`config.limits.${name}.second`, model.config.limits.second);
      }
      if (isNumber(model.config.limits.year)) {
        model.setAttribute(`config.limits.${name}.year`, model.config.limits.year);
      }
      if (isNull(model.config.redis_host)) {
        model.removeAttribute('config.redis_host');
        model.removeAttribute('config.redis_port');
        model.removeAttribute('config.redis_timeout');
      }
      if (isNull(model.consumer_id)) {
        model.removeAttribute('consumer_id');
      }

      model.removeAttribute('config.limits.limit_name');
      model.removeAttribute('config.limits.day');
      model.removeAttribute('config.limits.hour');
      model.removeAttribute('config.limits.minute');
      model.removeAttribute('config.limits.month');
      model.removeAttribute('config.limits.second');
      model.removeAttribute('config.limits.year');
    }
  },
  'request-size-limiting-config': {
    title: 'Request Size Limiting',
    formModel: RequestSizeLimitingModelConfig,
    controls: [
      new ControlBase<string>(<ControlSignature<string>>{
        type: 'text',
        value: '',
        control: new FormControl('', Validators.required),
        label: 'Name',
        key: 'name',
        errorMsg: null,
        required: true,
        render: false
      }),
      new ControlBase<string>(<ControlSignature<string>>{
        type: 'text',
        value: null,
        control: new FormControl(null),
        label: 'Consumer ID',
        key: 'consumerId',
        errorMsg: null,
        required: false
      }),
      new ControlBase<number>(<ControlSignature<number>>{
        type: 'number',
        value: null,
        control: new FormControl(null),
        label: 'Allowed Payload Size',
        key: 'allowedPayloadSize',
        errorMsg: null,
        required: false
      })
    ],
    /* tslint:disable */
    help: `
    <table class="table table-hover">
      <tr>
        <th>Attribute</th>
        <th>Description</th>
      </tr>
      <tr>
        <td><span class="badge-highlight">consumer_id</span><br><em>optional</em></td>
        <td><p>The CONSUMER ID that this plugin configuration will target. This value can only be used if authentication has been enabled so that the system can identify the user making the request.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">allowed_payload_size</span><br><em>optional</em></td>
        <td><p>Allowed request payload size in megabytes, default is <span class="badge-highlight">128</span> (128000000 Bytes)</p></td>
      </tr>
    </table>
    `,
    /* tslint:enable */
    attributes: {
      'name': 'name',
      'consumerId': 'consumer_id',
      'allowedPayloadSize': 'config.allowed_payload_size'
    }
  },
  'request-transformer-config': {
    title: 'Request Transformer',
    formModel: RequestTransformerModelConfig,
    controls: [
      new ControlBase<string>(<ControlSignature<string>>{
        type: 'text',
        value: '',
        control: new FormControl('', Validators.required),
        label: 'Name',
        key: 'name',
        errorMsg: null,
        required: true,
        render: false
      }),
      new ControlBase<string>(<ControlSignature<string>>{
        type: 'text',
        value: null,
        control: new FormControl(null),
        label: 'Consumer ID',
        key: 'consumerId',
        errorMsg: null,
        required: false
      }),
      new ControlBase<string>(<ControlSignature<string>>{
        type: 'text',
        value: null,
        control: new FormControl(null),
        label: 'HTTP Method',
        key: 'httpMethod',
        errorMsg: null,
        required: false
      }),
      new ControlBase<Array<string>>(<ControlSignature<Array<string>>>{
        type: 'text',
        value: null,
        control: new FormControl(null),
        label: 'Remove Headers',
        key: 'removeHeaders',
        errorMsg: null,
        required: false
      }),
      new ControlBase<Array<string>>(<ControlSignature<Array<string>>>{
        type: 'text',
        value: null,
        control: new FormControl(null),
        label: 'Remove Querystring',
        key: 'removeQuerystring',
        errorMsg: null,
        required: false
      }),
      new ControlBase<Array<string>>(<ControlSignature<Array<string>>>{
        type: 'text',
        value: null,
        control: new FormControl(null),
        label: 'Remove Body',
        key: 'removeBody',
        errorMsg: null,
        required: false
      }),
      new ControlBase<Array<string>>(<ControlSignature<Array<string>>>{
        type: 'text',
        value: null,
        control: new FormControl(null),
        label: 'Replace Headers',
        key: 'replaceHeaders',
        errorMsg: null,
        required: false
      }),
      new ControlBase<Array<string>>(<ControlSignature<Array<string>>>{
        type: 'text',
        value: null,
        control: new FormControl(null),
        label: 'Replace Querystring',
        key: 'replaceQuerystring',
        errorMsg: null,
        required: false
      }),
      new ControlBase<Array<string>>(<ControlSignature<Array<string>>>{
        type: 'text',
        value: null,
        control: new FormControl(null),
        label: 'Replace Body',
        key: 'replaceBody',
        errorMsg: null,
        required: false
      }),
      new ControlBase<Array<string>>(<ControlSignature<Array<string>>>{
        type: 'text',
        value: null,
        control: new FormControl(null),
        label: 'Add Headers',
        key: 'addHeaders',
        errorMsg: null,
        required: false
      }),
      new ControlBase<Array<string>>(<ControlSignature<Array<string>>>{
        type: 'text',
        value: null,
        control: new FormControl(null),
        label: 'Add Querystring',
        key: 'addQuerystring',
        errorMsg: null,
        required: false
      }),
      new ControlBase<Array<string>>(<ControlSignature<Array<string>>>{
        type: 'text',
        value: null,
        control: new FormControl(null),
        label: 'Add Body',
        key: 'addBody',
        errorMsg: null,
        required: false
      }),
      new ControlBase<Array<string>>(<ControlSignature<Array<string>>>{
        type: 'text',
        value: null,
        control: new FormControl(null),
        label: 'Append Headers',
        key: 'appendHeaders',
        errorMsg: null,
        required: false
      }),
      new ControlBase<Array<string>>(<ControlSignature<Array<string>>>{
        type: 'text',
        value: null,
        control: new FormControl(null),
        label: 'Append Querystring',
        key: 'appendQuerystring',
        errorMsg: null,
        required: false
      }),
      new ControlBase<Array<string>>(<ControlSignature<Array<string>>>{
        type: 'text',
        value: null,
        control: new FormControl(null),
        label: 'Append Body',
        key: 'appendBody',
        errorMsg: null,
        required: false
      })
    ],
     /* tslint:disable */
    help: `
    <table class="table table-hover">
      <tr>
        <th>Attribute</th>
        <th>Description</th>
      </tr>
      <tr>
        <td><span class="badge-highlight">consumer_id</span><br><em>optional</em></td>
        <td><p>The CONSUMER ID that this plugin configuration will target. This value can only be used if authentication has been enabled so that the system can identify the user making the request.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">http_method</span><br><em>optional</em></td>
        <td><p>Changes the HTTP method for the upstream request.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">remove.headers</span><br><em>optional</em></td>
        <td><p>List of header names. Unset the headers with the given name.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">remove.querystring</span><br><em>optional</em></td>
        <td><p>List of querystring names. Remove the querystring if it is present.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">remove.body</span><br><em>optional</em></td>
        <td><p>List of parameter names. Remove the parameter if and only if content-type is one the following [<span class="badge-highlight">application/json</span>, <span class="badge-highlight">multipart/form-data</span>, <span class="badge-highlight">application/x-www-form-urlencoded</span>] and parameter is present.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">replace.headers</span><br><em>optional</em></td>
        <td><p>List of headername:value pairs. If and only if the header is already set, replace its old value with the new one. Ignored if the header is not already set.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">replace.querystring</span><br><em>optional</em></td>
        <td><p>List of queryname:value pairs. If and only if the header is already set, replace its old value with the new one. Ignored if the header is not already set.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">replace.body</span><br><em>optional</em></td>
        <td><p>List of paramname:value pairs. If and only if content-type is one the following [<span class="badge-highlight">application/json</span>, <span class="badge-highlight">multipart/form-data</span>, <span class="badge-highlight">application/x-www-form-urlencoded</span>] and the parameter is already present, replace its old value with the new one. Ignored if the parameter is not already present.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">add.headers</span><br><em>optional</em></td>
        <td><p>List of headername:value pairs. If and only if the header is not already set, set a new header with the given value. Ignored if the header is already set.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">add.querystring</span><br><em>optional</em></td>
        <td><p>List of queryname:value pairs. If and only if the querystring is not already set, set a new querystring with the given value. Ignored if the header is already set.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">add.body</span><br><em>optional</em></td>
        <td><p>List of pramname:value pairs. If and only if content-type is one the following [<span class="badge-highlight">application/json</span>, <span class="badge-highlight">multipart/form-data</span>, <span class="badge-highlight">application/x-www-form-urlencoded</span>] and the parameter is not present, add a new parameter with the given value to form-encoded body. Ignored if the parameter is already present.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">append.headers</span><br><em>optional</em></td>
        <td><p>List of headername:value pairs. If the header is not set, set it with the given value. If it is already set, a new header with the same name and the new value will be set.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">append.querystring</span><br><em>optional</em></td>
        <td><p>List of queryname:value pairs. If the querystring is not set, set it with the given value. If it is already set, a new querystring with the same name and the new value will be set.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">append.body</span><br><em>optional</em></td>
        <td><p>List of paramname:value pairs. If the content-type is one the following [<span class="badge-highlight">application/json</span>, <span class="badge-highlight">application/x-www-form-urlencoded</span>], add a new parameter with the given value if the parameter is not present, otherwise if it is already present, the two values (old and new) will be aggregated in an array.</p></td>
      </tr>
    </table>
    `,
    /* tslint:enable */
    attributes: {
      'name': 'name',
      'consumerId': 'consumer_id',
      'httpMethod': 'config.http_method',
      'removeHeaders': 'config.remove.headers',
      'removeQuerystring': 'config.remove.querystring',
      'removeBody': 'config.remove.body',
      'replaceHeaders': 'config.replace.headers',
      'replaceQuerystring': 'config.replace.querystring',
      'replaceBody': 'config.replace.body',
      'addHeaders': 'config.add.headers',
      'addQuerystring': 'config.add.querystring',
      'addBody': 'config.add.body',
      'appendHeaders': 'config.append.headers',
      'appendQuerystring': 'config.append.querystring',
      'appendBody': 'config.append.body'
    },
    beforeUpdateModel: (form: FormGroup) => {
      let removeHeaders = form.value.removeHeaders
        ? form.value.removeHeaders.split(',').map((value: string) => { return value.trim(); })
        : null;

      let removeQueryString = form.value.removeQuerystring
        ? form.value.removeQuerystring.split(',').map((value: string) => { return value.trim(); })
        : null;

      let removeBody = form.value.removeBody
        ? form.value.removeBody.split(',').map((value: string) => { return value.trim(); })
        : null;

      let replaceHeaders = form.value.replaceHeaders
        ? form.value.replaceHeaders.split(',').map((value: string) => { return value.trim(); })
        : null;

      let replaceQuerystring = form.value.replaceQuerystring
        ? form.value.replaceQuerystring.split(',').map((value: string) => { return value.trim(); })
        : null;

      let replaceBody = form.value.replaceBody
        ? form.value.replaceBody.split(',').map((value: string) => { return value.trim(); })
        : null;

      let addHeaders = form.value.addHeaders
        ? form.value.addHeaders.split(',').map((value: string) => { return value.trim(); })
        : null;

      let addQuerystring = form.value.addQuerystring
        ? form.value.addQuerystring.split(',').map((value: string) => { return value.trim(); })
        : null;

      let addBody = form.value.addBody
        ? form.value.addBody.split(',').map((value: string) => { return value.trim(); })
        : null;

      let appendHeaders = form.value.appendHeaders
        ? form.value.appendHeaders.split(',').map((value: string) => { return value.trim(); })
        : null;

      let appendQuerystring = form.value.appendQuerystring
        ? form.value.appendQuerystring.split(',').map((value: string) => { return value.trim(); })
        : null;

      let appendBody = form.value.appendBody
        ? form.value.appendBody.split(',').map((value: string) => { return value.trim(); })
        : null;

      form.get('removeHeaders').setValue(removeHeaders);
      form.get('removeQuerystring').setValue(removeQueryString);
      form.get('removeBody').setValue(removeBody);
      form.get('replaceHeaders').setValue(replaceHeaders);
      form.get('replaceQuerystring').setValue(replaceQuerystring);
      form.get('replaceBody').setValue(replaceBody);
      form.get('addHeaders').setValue(addHeaders);
      form.get('addQuerystring').setValue(addQuerystring);
      form.get('addBody').setValue(addBody);
      form.get('appendHeaders').setValue(appendHeaders);
      form.get('appendQuerystring').setValue(appendQuerystring);
      form.get('appendBody').setValue(appendBody);
    }
  },
  'correlation-id-config': {
    title: 'Correlation ID',
    formModel: CorrelationModelConfig,
    controls: [
      new ControlBase<string>(<ControlSignature<string>>{
        type: 'text',
        value: '',
        control: new FormControl('', Validators.required),
        label: 'Name',
        key: 'name',
        errorMsg: null,
        required: true,
        render: false
      }),
      new ControlBase<string>(<ControlSignature<string>>{
        type: 'text',
        value: null,
        control: new FormControl(null),
        label: 'Header Name',
        key: 'headerName',
        errorMsg: null,
        required: false
      }),
      new ControlBase<string>(<ControlSignature<string>>{
        type: 'text',
        value: null,
        control: new FormControl(null),
        label: 'Generator',
        key: 'generator',
        errorMsg: null,
        required: false
      }),
      new ControlBase<boolean>(<ControlSignature<boolean>>{
        type: 'checkbox',
        value: false,
        control: new FormControl(false),
        label: 'Echo Downstream',
        key: 'echoDownstream',
        errorMsg: null,
        required: false
      })
    ],
    /* tslint:disable */
    help: `
    <table class="table table-hover">
      <tr>
        <th>Attribute</th>
        <th>Description</th>
      </tr>
      <tr>
        <td><span class="badge-highlight">header_name</span><br><em>optional</em></td>
        <td><p>The HTTP header name to use for the correlation ID.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">generator</span><br><em>optional</em></td>
        <td><p>The generator to use for the correlation ID. Accepted values are <span class="badge-highlight">uuid</span>, <span class="badge-highlight">uuid#counter</span> and <span class="badge-highlight">tracker</span>.</p></td>
      </tr>
      <tr>
        <td><span class="badge-highlight">echo_downstream</span><br><em>optional</em></td>
        <td><p>Whether to echo the header back to downstream (the client).</p></td>
      </tr>
    </table>
    `,
    /* tslint:enable */
    attributes: {
      'name': 'name',
      'headerName': 'header_name',
      'generator': 'generator',
      'echoDownstream': 'echo_downstream'
    }
  }
};

@Injectable()
export class FormManager {
  private settings: FormSettings;

  set description(settings: FormSettings) {
    throw new Error('Don\'t mutate description. Use init method.');
  }

  get description(): FormSettings {
    return this.settings;
  }

  init(settings: FormSettings): Manager {
    this.settings = settings;

    let form = this.createForm(settings.controls);
    let model = this.createModel();

    return {
      form: form,
      model: model,
      description: settings
    };
  }

  createForm(controls: Array<ControlBase<any>>): FormGroup {
    let group: any = {};

    controls.forEach(control => {
      group[control.key] = control.control;
    });

    return new FormGroup(group);
  }

  createModel() {
    return new this.settings.formModel();
  }
}
