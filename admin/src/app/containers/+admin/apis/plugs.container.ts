import { URLSearchParams } from '@angular/http';
import { Title } from '@angular/platform-browser';
import { FormControl, FormGroup } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Component, OnInit, OnDestroy } from '@angular/core';

import { Container } from '../../../core';
import {
  ApisService, SYMBOLS, paginate, PluginsGetParameters, PaginateModel,
  PluginApiModel
} from '../../../shared';

@Component({
  moduleId: __filename,
  selector: 'plugs-page',
  templateUrl: './plugs.template.html',
  providers: [ ApisService, Title ],
  styles: [
    `
    .form-group, .input-group {
      margin-left: 10px;
    }
    .input-group {
      width: 20%;
    }
    a {
      cursor: pointer;
    }
    `
  ]
})
export class ApiPlugsContainer extends Container implements OnInit, OnDestroy {
  id: string;
  next: string;
  total: string;
  toolsGroup: FormGroup;
  pagination: PaginateModel = paginate(1);
  pluginApiModel: Array<PluginApiModel>;
  entriesLength: Array<number> = SYMBOLS.TABLE.ENTRIES;

  constructor(
    private activeRoute: ActivatedRoute,
    private apiService: ApisService,
    private router: Router,
    private title: Title
  ) {
    super();
  }

  ngOnInit() {
    this.title.setTitle('API Plugins List');

    this.id = this.activeRoute.snapshot.params['id'];

    this.subscriptions = this.getPlugs(this.id);

    this.toolsGroup = new FormGroup({
      entries: new FormControl(this.entriesLength[0]),
      search: new FormControl()
    });

    this.subscriptions = this.toolsGroup.get('entries').valueChanges
      .subscribe((entry: number) => {
        let args = { size: entry.toString() };

        this.getPlugs(this.id, args);
      });
  }

  ngOnDestroy() {
    this.clean();
  }

  onSearch(event: MouseEvent) {
    event.preventDefault();

    let search = this.toolsGroup.get('search').value;
    let size = this.toolsGroup.get('entries').value || 10;

    if (search) {
      this.getPlugs(this.id, { name: search, size: size });
    }
  }

  onPrevious(event: MouseEvent) {
    this.pagination = paginate(1);
    this.getPlugs(this.id);
  }

  onNext(event: MouseEvent) {
    let params = new URLSearchParams(this.next);
    let size = this.toolsGroup.get('entries').value || 10;
    let search = this.toolsGroup.get('search').value;

    let args = { size: size, offset: params.get('offset') };

    if (search) {
      args['name'] = search;
    }

    this.getPlugs(this.id, args);
  }

  private getPlugs(api: string, params: PluginsGetParameters = {}) {
    return this.apiService.plugins(api, params)
      .subscribe((plugsModel) => {
        console.log(plugsModel);
        this.pluginApiModel = plugsModel.collection.data;
        this.total = plugsModel.collection.total.toString();

        if (plugsModel.collection.next) {
          this.next = plugsModel.collection.next.split('?')[1];
        } else {
          this.next = undefined;
        }

        let size = plugsModel.collection.total;
        let current = (params.hasOwnProperty('offset'))
          ? this.pagination.page + 1 : this.pagination.page;
        let limit = (params.hasOwnProperty('size'))
          ? parseInt(params.size, 10) : this.pagination.limit;

        this.pagination = paginate(size, current, limit);
      });
  }
}
