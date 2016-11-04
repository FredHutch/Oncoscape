import { Title } from '@angular/platform-browser';
import { Component, OnInit, OnDestroy } from '@angular/core';

import { find, includes, keys } from 'lodash';

import { Container } from '../../../core';
import {
  SYMBOLS, PluginsService, StatusService, PLUGINSDATA
} from '../../../shared';

@Component({
  moduleId: __filename,
  selector: 'plugins-page',
  templateUrl: './plugins.template.html',
  providers: [ PluginsService, StatusService, Title ]
})
export class PluginsContainer extends Container implements OnInit, OnDestroy {

  available: Array<any> = [];

  constructor(
    private title: Title,
    private plugService: PluginsService,
    private statusService: StatusService
  ) {
    super();
  }

  ngOnInit() {
    this.title.setTitle('Plugins List');

    this.subscriptions = this.statusService.kong()
      .subscribe((kongModel) => {
        let available = keys(kongModel.plugins.available_on_server).sort();
        let active = kongModel.plugins.enabled_in_cluster;

        this.available = available.map((value) => {
          let data = find(PLUGINSDATA, { id: value });

          return {
            id: value,
            data: data
              ? data
              : {
                id: value,
                title: 'Custom Plugin',
                info: 'Custom plugin. Add models definitions to create form for plugin.',
                api: false,
                consumer: false
              },
            active: includes(active, value)
          };
        });
      });
  }

  ngOnDestroy() {
    this.clean();
  }
}
