import { BaseModel } from './base.model';
import { Injectable } from '@angular/core';

export interface MenuModelItem {
  label?: string;
  className?: string;
  icon?: string;
  url?: string;
  fn?: Function;
  tree?: Array<MenuModelItem>;
}

@Injectable()
export class MenuModel extends BaseModel {
  menu: Array<MenuModelItem>;

  constructor(menu?: Array<MenuModelItem>) {
    super();

    if (menu) {
      Object.assign(this.menu, menu);
    } else {
      this.menu = [
        {
          label: 'Dashboard',
          url: '/admin',
          icon: 'fa fa-tachometer'
        },
        {
          label: 'Apis',
          url: '/admin/apis',
          icon: 'fa fa-gg'
        },
        {
          label: 'Acls',
          url: '/admin/acls',
          icon: 'fa fa-lock'
        },
        {
          label: 'Consumers',
          url: '/admin/consumers',
          icon: 'fa fa-spoon'
        },
        {
          label: 'Plugins',
          url: '/admin/plugins',
          icon: 'fa fa-plug'
        },
        {
          label: 'Cluster',
          url: '/admin/cluster',
          icon: 'fa fa-cubes'
        }
      ];
    }
  }
}
