import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';

import { isEmpty, kebabCase } from 'lodash';

import { Container } from '../../../core';
import { AlertModel } from '../../../components';
import {
  ApisService, ApisModel,
  ApisModelResource, SYMBOLS
} from '../../../shared';

@Component({
  moduleId: __filename,
  selector: 'new-api',
  templateUrl: './new.template.html',
  providers: [ ApisService, Title ],
})
export class NewApiContainer extends Container implements OnInit {

  apiForm: FormGroup;
  apiModel: ApisModel;
  alertModel: AlertModel;

  constructor(
    private apiService: ApisService,
    private router: Router,
    public fb: FormBuilder,
    private title: Title
  ) {
    super();
  }

  ngOnInit() {
    this.title.setTitle('New API');

    this.apiModel = new ApisModel(<ApisModelResource>{
      name: '',
      request_host: '',
      request_path: '',
      upstream_url: '',
      preserve_host: false,
      strip_request_path: false
    });

    this.apiForm = this.fb.group({
      name: new FormControl(this.apiModel.name),
      requestHost: new FormControl(this.apiModel.request_host),
      requestPath: new FormControl(this.apiModel.request_path),
      stripRequestPath: new FormControl(this.apiModel.strip_request_path),
      preserveHost: new FormControl(this.apiModel.preserve_host),
      upstreamUrl: new FormControl(this.apiModel.upstream_url, Validators.required)
    });
  }

  save() {
    if (!this.apiForm.valid) {
      return false;
    }

    this.cleanModel();

    this.apiService.add(this.apiModel)
      .subscribe(
        (rs) => {
          if (rs.ok) {
            this.alertModel = <AlertModel>{
              visible: true,
              autoHide: true,
              title: '<h4><i class="icon fa fa-check">API Created!</i></h4>',
              info: 'API with id: ' + rs.data.id + ' created with success!',
              close: true,
              classes: 'alert-success'
            };

            this.apiForm.reset();
          }
        },
        (error) => {
          this.alertModel = <AlertModel>{
            visible: true,
            autoHide: true,
            title: '<h4><i class="icon fa fa-ban">API Error!</i></h4>',
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

    this.apiForm.reset();
  }

  private cleanModel() {
    let form = this.apiForm.value;

    if (isEmpty(form.name)) {
      this.apiModel.removeAttribute('name');
    } else {
      this.apiModel.setAttribute('name', kebabCase(form.name));
    }

    if (isEmpty(form.requestHost)) {
      this.apiModel.removeAttribute('request_host');
    } else {
      this.apiModel.setAttribute('request_host', form.requestHost);
    }

    if (isEmpty(form.requestPath)) {
      this.apiModel.removeAttribute('request_path');
    } else {
      this.apiModel.setAttribute('request_path', form.requestPath);
    }

    if (isEmpty(form.upstreamUrl)) {
      this.apiModel.removeAttribute('upstream_url');
    } else {
      this.apiModel.setAttribute('upstream_url', form.upstreamUrl);
    }

    this.apiModel.setAttribute('preserve_host', form.preserveHost || false);
    this.apiModel.setAttribute('strip_request_path', form.stripRequestPath || false);
  }

}
