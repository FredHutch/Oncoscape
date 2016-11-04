import { isEmpty, kebabCase } from 'lodash';

import { Title } from '@angular/platform-browser';
import { Router, ActivatedRoute } from '@angular/router';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';

import { Container } from '../../../core';
import { AlertModel } from '../../../components';
import {
  ConsumerService, ConsumersModel,
  ConsumerModelResource, SYMBOLS, uuid
} from '../../../shared';

@Component({
  moduleId: __filename,
  selector: 'edit-consumer',
  templateUrl: './new.template.html',
  providers: [ ConsumerService, Title ]
})
export class EditConsumerContainer extends Container implements OnInit, OnDestroy {
  uuid: string;
  consumerForm: FormGroup;
  consumerModel: ConsumersModel;
  alertModel: AlertModel;

  constructor(
    private consumerService: ConsumerService,
    private router: Router,
    private activeRoute: ActivatedRoute,
    public fb: FormBuilder,
    private title: Title
  ) {
    super();
  }

  ngOnInit() {
    this.consumerModel = <ConsumersModel>{};

    let id = this.activeRoute.snapshot.params['id'];

    this.subscriptions = this.consumerService.get(id)
      .subscribe((model) => {
        this.consumerModel = model;

        this.title.setTitle(`Edit Consumer - ${model.username}`);

        this.consumerForm.get('username').setValue(model.username);
        this.consumerForm.get('customId').setValue(model.custom_id);
      });

    this.consumerForm = this.fb.group({
      username: new FormControl(),
      customId: new FormControl()
    });

    this.uuid = uuid();
  }

  ngOnDestroy() {
    this.clean();
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

    this.consumerService.update(this.consumerModel)
      .subscribe(
        (rs) => {
          if (rs.ok) {
            this.router.navigate([SYMBOLS.ROUTES.CONSUMER.INDEX]);
          }
        },
        (error) => {
          this.alertModel = <AlertModel>{
            visible: true,
            autoHide: true,
            title: '<h4><i class="icon fa fa-ban">Consumer Error!</i></h4>',
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

    this.router.navigate([SYMBOLS.ROUTES.CONSUMER.INDEX]);
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
