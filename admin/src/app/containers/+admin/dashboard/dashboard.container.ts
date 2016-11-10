import { Title } from '@angular/platform-browser';
import { Component, OnInit, OnDestroy } from '@angular/core';

import { keys } from 'lodash';

import { State, Container } from '../../../core';
import { SmallBoxModel } from '../../../components';
import {
  StatusModel, StatusModelResourceServer, StatusModelResourceDatabase,
  StatusService, ApisService, ApisModel, ApisModelResource,
  ConsumerService, ConsumersModel, ConsumerModelResource, SYMBOLS,
  makeSymbolPath, KongModel
} from '../../../shared';

@Component({
  moduleId: __filename,
  selector: 'dashboard-page',
  templateUrl: './dashboard.template.html',
  providers: [ StatusService, ApisService, ConsumerService, Title ]
})
export class DashboardContainer extends Container implements OnInit, OnDestroy {
  boxModel: Array<SmallBoxModel>;
  kongModel: KongModel;
  pluginsAvailable: Array<string>;

  constructor(
    private appState: State,
    private title: Title,
    private statusService: StatusService,
  ) {
    super();
  }

  ngOnInit() {
    console.log('--DASHBOARD INITED--');
    this.title.setTitle('Dashboard');

    this.statusSubscription();
    this.kongSubscription();
  }

  ngOnDestroy() {
    this.clean();
  }

  private statusSubscription(): void {
    this.subscriptions = this.statusService.status()
      .subscribe((statusModel: StatusModel) => {
        let server = <StatusModelResourceServer>statusModel.getAttribute('server');
        let db = <StatusModelResourceDatabase>statusModel.getAttribute('database');

        this.boxModel = [
          {
            info: 'Requests',
            title: server.total_requests.toString(),
            icon: 'ion ion-stats-bars',
            classBg: 'small-box bg-aqua'
          },
          {
            info: 'Connections',
            title: server.connections_accepted.toString(),
            icon: 'ion ion-log-in',
            classBg: 'small-box bg-green'
          },
          {
            info: 'Connections Active',
            title: server.connections_active.toString(),
            icon: 'ion ion-ios-pulse-strong',
            classBg: 'small-box bg-yellow'
          },
          {
            info: 'Apis',
            title: db.apis.toString(),
            icon: 'ion ion-ios-analytics',
            classBg: 'small-box bg-red'
          },
          {
            info: 'Plugins',
            title: db.plugins.toString(),
            icon: 'fa fa-plug',
            classBg: 'small-box bg-red'
          },
          {
            info: 'Nodes',
            title: db.nodes.toString(),
            icon: 'fa fa-cubes',
            classBg: 'small-box bg-yellow'
          },
          {
            info: 'ACLS',
            title: db.acls.toString(),
            icon: 'fa fa-shield',
            classBg: 'small-box bg-green'
          },
          {
            info: 'Consumers',
            title: db.consumers.toString(),
            icon: 'fa fa-spoon',
            classBg: 'small-box bg-aqua'
          }
        ];
      });
  }



  private kongSubscription(): void {
    this.subscriptions = this.statusService.kong()
      .subscribe((kongModel) => {
        debugger;
        this.kongModel = kongModel;
        this.pluginsAvailable = keys(kongModel.plugins.available_on_server);
      });
  }
}
