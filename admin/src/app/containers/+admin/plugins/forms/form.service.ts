import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { get, isString, isPlainObject, isNull } from 'lodash';

import { FORM_SETTINGS, FormManager, FormSettings, Manager } from './form.manager';

@Injectable()
export class FormService {
  manager: Manager;

  create(form: string | FormSettings): void {
    let manager = new FormManager();
    let settings: FormSettings;

    if (isString(form)) {
      settings = get(FORM_SETTINGS, form, <FormSettings>{});
    } else if (isPlainObject(form)) {
      settings = form;
    }

    this.manager = manager.init(settings);
  }

  updateModel(form: FormGroup, options?: any): void {
    if (this.manager.description.beforeUpdateModel) {
      this.manager.description.beforeUpdateModel(form);
    }

    let inputs = form.value;
    let attrs = this.manager.description.attributes;

    Object.keys(attrs).forEach((key, index) => {
      if (inputs.hasOwnProperty(key) && !isNull(inputs[key])) {
        this.manager.model.setAttribute(`${attrs[key]}`, inputs[key]);
      }
    });

    if (this.manager.description.afterUpdateModel) {
      this.manager.description.afterUpdateModel(this.manager);
    }
  }
}
