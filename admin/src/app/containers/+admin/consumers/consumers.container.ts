import { Router } from '@angular/router';
import { URLSearchParams } from '@angular/http';
import { Title } from '@angular/platform-browser';
import { FormControl, FormGroup } from '@angular/forms';
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';

import { Container } from '../../../core';
import { Modal } from '../../../components';
import {
  ConsumerService, ConsumerModelResource,
  SYMBOLS, paginate, ConsumerGetParameters, PaginateModel
} from '../../../shared';

@Component({
  moduleId: __filename,
  selector: 'consumers',
  templateUrl: './consumers.template.html',
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
  ],
  providers: [ ConsumerService, Title ]
})
export class ConsumersContainer extends Container implements OnInit, OnDestroy {
  next: string;
  total: string;
  toolsGroup: FormGroup;
  pagination: PaginateModel = paginate(1);
  consumersModel: Array<ConsumerModelResource>;
  entriesLength: Array<number> = SYMBOLS.TABLE.ENTRIES;

  @ViewChild(Modal) modal: Modal;

  constructor(
    private consumerService: ConsumerService,
    private router: Router,
    private title: Title
  ) {
    super();
  }

  ngOnInit() {
    this.title.setTitle('Consumers');

    this.subscriptions = this.getConsumers();

    this.toolsGroup = new FormGroup({
      entries: new FormControl(this.entriesLength[0]),
      search: new FormControl()
    });

    this.subscriptions = this.toolsGroup.get('entries').valueChanges
      .subscribe((entry: number) => {
        let args = { size: entry.toString() };

        this.getConsumers(args);
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
      this.getConsumers({ username: search, size: size });
    }
  }

  onPrevious(event: MouseEvent) {
    this.pagination = paginate(1);
    this.getConsumers();
  }

  onNext(event: MouseEvent) {
    let params = new URLSearchParams(this.next);
    let size = this.toolsGroup.get('entries').value || 10;
    let search = this.toolsGroup.get('search').value;

    let args = { size: size, offset: params.get('offset') };

    if (search) {
      args['username'] = search;
    }

    this.getConsumers(args);
  }

  onDelete(event: MouseEvent, id: string, name: string) {
    event.preventDefault();

    this.modal.title = 'Delete Confirmation';
    this.modal.hasAction = true;
    this.modal.actionLabel = 'Delete';
    this.modal.actionClass = 'btn-danger';
    this.modal.body = `<p>Are you sure you wanto to delete consumer: <b>${name}</b>?</p>`;

    this.modal.actionFn = () => {
      this.consumerService.delete(id).subscribe(
        (rs) => {
          if (rs.ok) {
            this.modal.title = 'Success';
            this.modal.hasAction = false;
            this.modal.body = `<p>CONSUMER: <b>${name}</b> successful deleted.</p>`;
            this.getConsumers();
          }
        }
      );
    };

    this.modal.show();
  }

  goToNewConsumer(event: MouseEvent) {
    event.preventDefault();

    this.router.navigate([SYMBOLS.ROUTES.CONSUMER.NEW]);
  }

  private getConsumers(params: ConsumerGetParameters = {}) {
    return this.consumerService.consumers(params)
      .subscribe((consumersModel) => {
        this.consumersModel = consumersModel.collection.data;
        this.total = consumersModel.collection.total.toString();

        if (consumersModel.collection.next) {
          this.next = consumersModel.collection.next.split('?')[1];
        } else {
          this.next = undefined;
        }

        let size = consumersModel.collection.total;
        let current = (params.hasOwnProperty('offset'))
          ? this.pagination.page + 1 : this.pagination.page;
        let limit = (params.hasOwnProperty('size'))
          ? parseInt(params.size, 10) : this.pagination.limit;

        this.pagination = paginate(size, current, limit);
      });
  }
}
