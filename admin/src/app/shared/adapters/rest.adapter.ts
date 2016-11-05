import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/throw';

import { Observable } from 'rxjs/Observable';
import { Injectable, Inject } from '@angular/core';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import {
  Http, Request, RequestOptionsArgs, Response, Headers, ResponseType
} from '@angular/http';

export interface AdapterRestSignature {
  get(path: string, params?: RequestOptionsArgs): Observable<any>;
  post(path: string, params?: any, options?: RequestOptionsArgs): Observable<any>;
  put(path: string, params?: any, options?: RequestOptionsArgs): Observable<any>;
  delete(path: string, params?: RequestOptionsArgs): Observable<any>;
  patch(path: string, body?: any, options?: RequestOptionsArgs): Observable<any>;
}

/**
 * Rest response resource signature
 *
 * @export
 * @interface ResourceResponse
 */
export interface ResourceResponse<ResourceModel> {
  headers: Headers;
  type: ResponseType;
  status: number;
  data: ResourceModel;
  ok: boolean;
}

/**
 * Defines Rest adapter driver to comunicate
 * with REST API services.
 *
 * @export
 * @class RestAdapter
 * @implements {AdapterSignature}
 */
@Injectable()
export class RestAdapter implements AdapterRestSignature {
  constructor(@Inject(Http) private _http: Http) { }

  /**
   * Transform Rest resources on the signature
   * of ResourceResponse.
   *
   * @protected
   * @param {Response} response
   * @returns {ResourceResponse}
   */
  protected _toResponse(response: Response): ResourceResponse<any> {
    let json;

    try {
      json = response.json();
    } catch (error) {
      json = {};
    }

    return {
      headers: response.headers,
      data: json,
      status: response.status,
      type: response.type,
      ok: response.ok
    };
  }

  /**
   * Interceptor for Http errors.
   *
   * @protected
   * @param {*} error
   * @returns {ErrorObservable}
   */
  protected _handleError(error: any): ErrorObservable {
    let errMsg = (error.message) ? error.message :
    error.status ? `${error.status} - ${error.statusText}` : 'Server error';
    console.error(errMsg); // log to console instead

    return Observable.throw(error);
  }

  /**
   * Generic method to make Http requests.
   *
   * @param {(string | Request)} url
   * @param {RequestOptionsArgs} [options]
   * @returns {Observable<any>}
   */
  request(url: string | Request, options?: RequestOptionsArgs): Observable<ResourceResponse<any>> {
      return this._http.request(url, options).map(this._toResponse).catch(this._handleError);
  }

  /**
   * Http get method.
   *
   * @param {string} path
   * @param {RequestOptionsArgs} params
   * @returns {Observable<ResourceResponse>}
   */
  get(path: string, params?: RequestOptionsArgs): Observable<ResourceResponse<any>> {
    return this._http.get(path, params).map(this._toResponse).catch(this._handleError);
  }

  /**
   * Http post method.
   *
   * @param {string} path
   * @param {*} params
   * @param {RequestOptionsArgs} options
   * @returns {Observable<ResourceResponse>}
   */
  /* tslint:disable */
  post(path: string, params?: any, options?: RequestOptionsArgs): Observable<ResourceResponse<any>> {
    return this._http.post(path, params, options).map(this._toResponse).catch(this._handleError);
  }
  /* tslint:enable */

  /**
   * Http put method.
   *
   * @param {string} path
   * @param {*} params
   * @param {RequestOptionsArgs} options
   * @returns {Observable<ResourceResponse>}
   */
  put(path: string, params: any, options: RequestOptionsArgs): Observable<ResourceResponse<any>> {
    return this._http.put(path, params).map(this._toResponse).catch(this._handleError);
  }

  /**
   * Http delete method.
   *
   * @param {string} path
   * @param {RequestOptionsArgs} params
   * @returns {Observable<ResourceResponse>}
   */
  delete(path: string, params: RequestOptionsArgs): Observable<ResourceResponse<any>> {
    return this._http.delete(path, params).map(this._toResponse).catch(this._handleError);
  }

  /**
   * Http patch method.
   *
   * @param {string} path
   * @param {*} [body]
   * @param {RequestOptionsArgs} [options]
   * @returns {Observable<ResourceResponse>}
   */
  patch(path: string, body?: any, options?: RequestOptionsArgs): Observable<ResourceResponse<any>> {
    return this._http.patch(path, body, options).map(this._toResponse).catch(this._handleError);
  }
}
