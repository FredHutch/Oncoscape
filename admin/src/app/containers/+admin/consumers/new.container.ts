import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';

import { isEmpty, kebabCase } from 'lodash';

import { Container } from '../../../core';
import { AlertModel } from '../../../components';
import {
  ConsumerService, ConsumersModel,
  ConsumerModelResource, SYMBOLS, uuid
} from '../../../shared';

@Component({
  moduleId: __filename,
  selector: 'new-consumer',
  templateUrl: './new.template.html',
  providers: [ ConsumerService, Title ],
})
export class NewConsumerContainer extends Container implements OnInit {
  uuid: string;
  consumerForm: FormGroup;
  consumerModel: ConsumersModel;
  alertModel: AlertModel;

  constructor(
    private consumerService: ConsumerService,
    private router: Router,
    public fb: FormBuilder,
    private title: Title
  ) {
    super();
  }

  ngOnInit() {
    this.title.setTitle('New Consumer');

    this.consumerModel = new ConsumersModel(<ConsumerModelResource>{
      username: '',
      custom_id: ''
    });

    this.consumerForm = this.fb.group({
      username: new FormControl(this.consumerModel.username),
      customId: new FormControl(this.consumerModel.custom_id)
    });

    this.uuid = uuid();
  }

  generateUUID(event: MouseEvent) {
    event.preventDefault();

    this.uuid = uuid();
  }

  save() {
    if (!this.consumerForm.valid) {
      return false;
    }

    this.cleanModel();

    this.consumerService.add(this.consumerModel)
      .subscribe(
        (rs) => {
          if (rs.ok) {
            this.alertModel = <AlertModel>{
              visible: true,
              autoHide: true,
              title: '<h4><i class="icon fa fa-check">Consumer Created!</i></h4>',
              info: 'CONSUMER with id: ' + rs.data.id + ' created with success!',
              close: true,
              classes: 'alert-success'
            };

            this.consumerForm.reset();
          }
        },
        (error) => {
          this.alertModel = <AlertModel>{
            visible: true,
            autoHide: true,
            title: '<h4><i class="icon fa fa-ban">CONSUMER Error!</i></h4>',
            info: `<p>Please check your form.</p>
            <p>Details from server:</p>
            <code>${error.text()}</code>`,
            close: true,
            classes: 'alert-danger'
          };
        }
      );

    return true;
  }

  cancel(event: MouseEvent) {
    event.preventDefault();

    this.router.navigate([SYMBOLS.ROUTES.APIS.INDEX]);
  }

  reset(event: MouseEvent) {
    event.preventDefault();

    this.consumerForm.reset();
  }

  private cleanModel() {
    let form = this.consumerForm.value;

    if (isEmpty(form.username)) {
      this.consumerModel.removeAttribute('username');
    } else {
      this.consumerModel.setAttribute('username', kebabCase(form.username));
    }

    if (isEmpty(form.customId)) {
      this.consumerModel.removeAttribute('custom_id');
    } else {
      this.consumerModel.setAttribute('custom_id', form.customId);
    }
  }

}
