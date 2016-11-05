import { FormGroup, FormControl } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { Component, OnInit, OnDestroy, ViewChild, NgZone, ElementRef } from '@angular/core';

import { FormService } from './forms';
import { Container } from '../../../core';
import { Configurator } from '../../../core';
import { AlertModel, ComboBox } from '../../../components';
import {
  SYMBOLS, ApisService, UploadService, FileUpload, FilePreview
} from '../../../shared';

@Component({
  moduleId: __filename,
  selector: 'new-plugin-page',
  templateUrl: './new.plugin.template.html',
  providers: [ Title, FormService, ApisService ]
})
export class NewPluginContainer extends Container implements OnInit, OnDestroy {
  alertModel: AlertModel;
  formControls: Array<any>;
  pluginForm: FormGroup;
  formTitle: string;
  help: string;
  uploadOptions: Object;

  @ViewChild(ComboBox) combo: ComboBox;

  private zone: NgZone;

  constructor(
    private title: Title,
    private fS: FormService,
    private router: Router,
    private configurator: Configurator,
    private apiService: ApisService,
    private activeRoute: ActivatedRoute
  ) {
    super();
  }

  ngOnInit() {
    this.zone = new NgZone({ enableLongStackTrace: false });
    this.uploadOptions = this.configurator.getOptionTree(SYMBOLS.UPLOADER, false);

    this.title.setTitle('Activate Plugin');

    let id = this.activeRoute.snapshot.params['id'];

    this.fS.create(`${id}-config`);

    this.formTitle = this.fS.manager.description.title;
    this.help = this.fS.manager.description.help;
    this.formControls = this.fS.manager.description.controls;
    this.pluginForm = this.fS.manager.form;

    this.changeDetection(() => {
      this.fS.manager.form.get('name').setValue(id);
      this.fS.manager.form.addControl('search', this.combo.formCombo.get('search'));
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

    this.pluginForm.reset();
  }

  cancel(event: MouseEvent) {
    event.preventDefault();

    this.router.navigate([SYMBOLS.ROUTES.PLUGINS.INDEX]);
  }

  upload(data: FileUpload, controlKey: string) {
    let el = <HTMLDivElement>document.querySelector(`#${controlKey}-progress`);

    this.zone.run(() => {
      el.textContent = el.style.width = data.progress.percent.toString() + '%';
      // this.progress = data.progress.percent.toString() + '%';
      // Math.floor(data.progress.percent / 100).toString() + '%';
    });
  }

  preview(data: FilePreview, controlKey: string) {
    let el = <FileList>data.el.nativeElement.files;
    let control = this.pluginForm.get(controlKey);
    let service = data.service;

    control.validator = () => {
      return el.length > 0 ? null : {
        validFile: false
      };
    };

    control.updateValueAndValidity();

    if (control.valid) {
      service.uploadFilesInQueue();
    }
  }

  save() {
    if (!this.pluginForm.valid) {
      return false;
    }

    let api = this.pluginForm.value.search;
    this.fS.updateModel(this.pluginForm);

    this.apiService.insertPlugin(api, this.fS.manager.model)
      .subscribe(
        (rs) => {
          if (rs.ok) {
            this.alertModel = <AlertModel>{
              visible: true,
              autoHide: true,
              title: '<h4><i class="icon fa fa-check">Plugin Added!</i></h4>',
              info: 'Plugin added with success to API: ' + api + '!',
              close: true,
              classes: 'alert-success'
            };

            setTimeout(() => {
              this.pluginForm.reset();
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
    let params = (value === '*ALL*') ? {} : { name: value };

    this.apiService.apis(params)
      .subscribe((api) => {
        if (api && api.collection.total > 0) {
          let data = api.collection.data;
          this.combo.model = data;
        } else {
          this.combo.model = [{ id: undefined, name: 'No results founded.' }];
        }
      });
  }
}
