import { FormGroup, FormControl } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';

import { FormService } from './forms';
import { Container } from '../../../core';
import { AlertModel, ComboBox } from '../../../components';
import {
  SYMBOLS, ConsumerService
} from '../../../shared';

@Component({
  moduleId: __filename,
  selector: 'new-consumer-page',
  templateUrl: './new.consumer.template.html',
  providers: [ Title, FormService, ConsumerService ]
})
export class NewConsumerApiContainer extends Container implements OnInit, OnDestroy {
  alertModel: AlertModel;
  formControls: Array<any>;
  consumerForm: FormGroup;
  formTitle: string;
  help: string;

  @ViewChild(ComboBox) combo: ComboBox;

  constructor(
    private title: Title,
    private fS: FormService,
    private router: Router,
    private consumerService: ConsumerService,
    private activeRoute: ActivatedRoute
  ) {
    super();
  }

  ngOnInit() {
    this.title.setTitle('Associate Plugin');

    let id = this.activeRoute.snapshot.params['id'];

    this.fS.create(`${id}-consumer`);

    this.formTitle = this.fS.manager.description.title;
    this.help = this.fS.manager.description.help;
    this.formControls = this.fS.manager.description.controls;
    this.consumerForm = this.fS.manager.form;

    this.changeDetection(() => {
      this.consumerForm.addControl('search', this.combo.formCombo.get('search'));
    });

    this.combo.events
      .subscribe((input: any) => {
        if (input.hasOwnProperty('search')) {
          this.search(input.search);
        }
      });
  }

  ngOnDestroy() {
    this.clean();
  }

  reset(event: MouseEvent) {
    event.preventDefault();

    this.consumerForm.reset();
  }

  cancel(event: MouseEvent) {
    event.preventDefault();

    this.router.navigate([SYMBOLS.ROUTES.PLUGINS.INDEX]);
  }

  save() {
    if (!this.consumerForm.valid) {
      return false;
    }

    let consumer = this.consumerForm.value.search;
    let plugin = this.activeRoute.snapshot.params['id'];

    this.fS.updateModel(this.consumerForm);

    this.consumerService.insertPlugin(consumer, plugin, this.fS.manager.model)
      .subscribe(
        (rs) => {
          if (rs.ok) {
            this.alertModel = <AlertModel>{
              visible: true,
              autoHide: true,
              title: '<h4><i class="icon fa fa-check">Plugin Associated!</i></h4>',
              info: 'Plugin associated with success to Consumer: ' + consumer + '!',
              close: true,
              classes: 'alert-success'
            };

            setTimeout(() => {
              this.consumerForm.reset();
              this.router.navigate([SYMBOLS.ROUTES.PLUGINS.INDEX]);
            }, 1000);
          }
        },
        (error) => {
          this.alertModel = <AlertModel>{
            visible: true,
            autoHide: true,
            title: '<h4><i class="icon fa fa-ban">Plugin Error!</i></h4>',
            info: `<p>Please check your form.</p>
            <p>Details from server:</p>
            <code>${error.text()}</code>`,
            close: true,
            classes: 'alert-danger'
          };
        }
      );
  }

  search(value: string) {
    let params = (value === '*ALL*') ? {} : { username: value };

    this.consumerService.consumers(params)
      .subscribe((consumer) => {
        if (consumer && consumer.collection.total > 0) {
          let data = consumer.collection.data;
          this.combo.model = data.map((rs) => {
            return { id: rs.id, name: rs.username };
          });
        } else {
          this.combo.model = [{ id: undefined, name: 'No results founded.' }];
        }
      });
  }
}
