import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';

import { State, Container } from '../../core';
import { CrumbService, CrumbTreeModel, SideBarModel } from '../../components';
import { SYMBOLS, makeSymbolPath, AuthService, MenuModel, getLocalStorage } from '../../shared';

@Component({
  moduleId: __filename,
  selector: 'admin',
  providers: [ CrumbService ],
  templateUrl: './admin.template.html'
})
export class AdminContainer extends Container implements OnInit {
  UIHEADER = SYMBOLS.HEADER;
  UISIDEBAR = SYMBOLS.SIDEBAR;
  UIFOOTER = SYMBOLS.FOOTER;

  user: string = 'Administrator';
  sideBarModel: Array<SideBarModel> = [];

  constructor(
    private router: Router,
    private appState: State,
    private authService: AuthService,
    private crumbService: CrumbService
  ) {
    super();
  }

  ngOnInit() {
    console.log('--ADMIN CONTAINER INITED--');

    this.setProp(this.UIFOOTER, this.appState.get(makeSymbolPath([SYMBOLS.UI, SYMBOLS.FOOTER])));
    this.setProp(this.UIHEADER, this.appState.get(makeSymbolPath([SYMBOLS.UI, SYMBOLS.HEADER])));
    this.setProp(this.UISIDEBAR, this.appState.get(makeSymbolPath([SYMBOLS.UI, SYMBOLS.SIDEBAR])));

    this.appState.observe().subscribe((rs: any) => {
      this.changeDetection(
        () => {
          this.setProp(this.UIFOOTER, rs[SYMBOLS.UI][SYMBOLS.FOOTER]);
          this.setProp(this.UIHEADER, rs[SYMBOLS.UI][SYMBOLS.HEADER]);
          this.setProp(this.UISIDEBAR, rs[SYMBOLS.UI][SYMBOLS.SIDEBAR]);
        }
      );
    });

    this.createCrumb();
    this.createSideBar();
    this.defineUser();
  }

  signOut(event: MouseEvent): void {
    event.preventDefault();

    this.authService.logout();
    this.router.navigate([SYMBOLS.ROUTES.LOGIN]);
  }

  private defineUser(): void {
    let _user = JSON.parse(getLocalStorage(SYMBOLS.USER));
    this.user = _user.user;
  }

  private createSideBar(): void {
    let menuModel = new MenuModel();
    this.sideBarModel = menuModel.getAttribute('menu');
  }

  private createCrumb(): void {
    let crumbTreeModel: CrumbTreeModel = {
      '/admin': {
        title: 'Dashboard',
        info: 'Resume view',
        label: 'Control Panel'
      },
      '/admin/acls':{
        title: 'ACLS',
        info: 'Register REST acl',
        label: 'Acls List'
      },
      '/admin/apis': {
        title: 'APIS',
        info: 'Register REST apis',
        label: 'Apis List'
      },
      '/admin/apis/new': {
        title: 'New API',
        info: 'Create a new REST api',
        label: 'New Rest API'
      },
      '/admin/apis/edit': {
        title: 'Edit API',
        info: 'Edit this REST api',
        label: 'Edit Rest API'
      },
      '/admin/apis/plugin': {
        title: 'API Plugins',
        info: 'List API plugins',
        label: 'List plugins'
      },
      '/admin/consumers': {
        title: 'Consumers',
        info: 'Register consumers for APIS',
        label: 'Consumers List'
      },
      '/admin/consumers/new': {
        title: 'New Consumer',
        info: 'Create a new Consumer',
        label: 'New Consumer'
      },
      '/admin/consumers/edit': {
        title: 'Edit Consumer',
        info: 'Edit this Consumer',
        label: 'Edit Consumer'
      },
      '/admin/plugins': {
        title: 'Plugins',
        info: 'List plugins installed on Kong',
        label: 'Plugins List'
      },
      '/admin/plugins/schema': {
        title: 'Plugin Schema',
        info: 'Plugin object schema',
        label: 'Schema'
      },
      '/admin/plugins/api': {
        title: 'Plugin Activation',
        info: 'Add plugin to API',
        label: 'New Plugin'
      },
      '/admin/plugins/consumer': {
        title: 'Consumer Association',
        info: 'Associate consumer to API',
        label: 'New Consumer association'
      }
    };

    this.crumbService.addCrumbTree(crumbTreeModel);
  }
}
