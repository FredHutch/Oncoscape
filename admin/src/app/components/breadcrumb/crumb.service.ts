import { Injectable } from '@angular/core';
import { get, has } from 'lodash';

export interface CrumbTreeModel {
  [key: string]: CrumbTreeItem;
}

export interface CrumbTreeItem {
  title?: string;
  info?: string;
  label?: string;
}

@Injectable()
export class CrumbService {
  private _crumbTree: CrumbTreeModel;

  addCrumbTree(crumbTree: CrumbTreeModel) {
    this._crumbTree = crumbTree;
  }

  getUrlProperty(url: string, property: string): string {
    return get(this._crumbTree, `${url}[${property}]`, '');
  }

  hasUrlProperty(url: string, property: string): boolean {
    return has(this._crumbTree, `${url}[${property}]`);
  }

  hasUrl(url: string): boolean {
    return has(this._crumbTree, url);
  }

}
