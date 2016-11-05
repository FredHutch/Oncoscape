import { Router } from '@angular/router';
import { URLSearchParams } from '@angular/http';
import { Title } from '@angular/platform-browser';
import { FormControl, FormGroup } from '@angular/forms';
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';

import { Container } from '../../../core';
import { Modal } from '../../../components';
import {
  ApisService, ApisModelResource,
  SYMBOLS, paginate, ApiGetParameters, PaginateModel
} from '../../../shared';

@Component({
  moduleId: __filename,
  selector: 'acls-page',
  templateUrl: './acls.template.html',
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
export class AclsContainer extends Container implements OnInit, OnDestroy {
 
 	
  next: string;
  total: string;
  toolsGroup: FormGroup;
  pagination: PaginateModel = paginate(1);
  apisModel: Array<ApisModelResource>;
  entriesLength: Array<number> = SYMBOLS.TABLE.ENTRIES;

  @ViewChild(Modal) modal: Modal;

  constructor(
    private apiService: ApisService,
    private router: Router,
    private title: Title
  ) {
    super();
  }

  ngOnInit() {
    this.title.setTitle('ACLS List');
    this.subscriptions = this.getApis();

    this.toolsGroup = new FormGroup({
      entries: new FormControl(this.entriesLength[0]),
      search: new FormControl()
    });

    this.subscriptions = this.toolsGroup.get('entries').valueChanges
      .subscribe((entry: number) => {
        let args = { size: entry.toString() };

        this.getApis(args);
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
      this.getApis({ name: search, size: size });
    }
  }

  onPrevious(event: MouseEvent) {
    this.pagination = paginate(1);
    this.getApis();
  }

  onNext(event: MouseEvent) {
    let params = new URLSearchParams(this.next);
    let size = this.toolsGroup.get('entries').value || 10;
    let search = this.toolsGroup.get('search').value;

    let args = { size: size, offset: params.get('offset') };

    if (search) {
      args['name'] = search;
    }

    this.getApis(args);
  }

  onDelete(event: MouseEvent, id: string, name: string) {
    event.preventDefault();

    this.modal.title = 'Delete Confirmation';
    this.modal.hasAction = true;
    this.modal.actionLabel = 'Delete';
    this.modal.actionClass = 'btn-danger';
    this.modal.body = `<p>Are you sure you wanto to delete api: <b>${name}</b>?</p>`;

    this.modal.actionFn = () => {
      this.apiService.delete(id).subscribe(
        (rs) => {
          if (rs.ok) {
            this.modal.title = 'Success';
            this.modal.hasAction = false;
            this.modal.body = `<p>API: <b>${name}</b> successful deleted.</p>`;
            this.getApis();
          }
        }
      );
    };

    this.modal.show();
  }

  goToNewApi(event: MouseEvent) {
    event.preventDefault();

    this.router.navigate([SYMBOLS.ROUTES.APIS.NEW]);
  }

  private getApis(params: ApiGetParameters = {}) {
    return this.apiService.apis(params)
      .subscribe((apisModel) => {
        this.apisModel = apisModel.collection.data;
        this.total = apisModel.collection.total.toString();

        if (apisModel.collection.next) {
          this.next = apisModel.collection.next.split('?')[1];
        } else {
          this.next = undefined;
        }

        let size = apisModel.collection.total;
        let current = (params.hasOwnProperty('offset'))
          ? this.pagination.page + 1 : this.pagination.page;
        let limit = (params.hasOwnProperty('size'))
          ? parseInt(params.size, 10) : this.pagination.limit;

        this.pagination = paginate(size, current, limit);
      });
  }
}
