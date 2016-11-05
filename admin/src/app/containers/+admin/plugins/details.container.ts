import { ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Component, OnInit, OnDestroy } from '@angular/core';

import { lowerCase, capitalize, find, includes } from 'lodash';

import { Container, JSONFormatter } from '../../../core';

import {
  SYMBOLS, PluginsService, StatusService, PLUGINSDATA
} from '../../../shared';

@Component({
  moduleId: __filename,
  selector: 'plugin-detail-page',
  templateUrl: './details.template.html',
  providers: [ PluginsService, Title ]
})
export class PluginDetailContainer extends Container implements OnInit, OnDestroy {
  render: HTMLDivElement;

  constructor(
    private title: Title,
    private activeRoute: ActivatedRoute,
    private plugService: PluginsService
  ) {
    super();
  }

  ngOnInit() {
    let id = this.activeRoute.snapshot.params['id'];

    this.title.setTitle(`Plugin Schema - ${id}`);

    this.subscriptions = this.plugService.schema(id)
      .subscribe((schema) => {
        let formatter = new JSONFormatter(
          { fields: schema.fields, no_consumer: schema.no_consumer },
          Infinity
        );

        this.render = formatter.render();
      });
  }

  ngOnDestroy() {
    this.clean();
  }

}
