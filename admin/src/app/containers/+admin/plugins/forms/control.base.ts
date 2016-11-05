import { Injectable } from '@angular/core';
import { FormControl } from '@angular/forms';

export interface ControlSignature<T> {
  type?: string;
  value?: T;
  label?: string;
  control?: FormControl;
  key?: string;
  errorMsg?: string;
  required?: boolean;
  holder?: string;
  render?: boolean;
  opts?: Object;
}

@Injectable()
export class ControlBase<ControlValue> {
  type?: string;
  value?: ControlValue;
  label?: string;
  control?: FormControl;
  key?: string;
  errorMsg?: string;
  required?: boolean;
  holder?: string;
  render?: boolean;
  opts?: Object;

  constructor(options?: ControlSignature<ControlValue>) {
    this.type = options.type || 'text';
    this.value = <ControlValue>(options.value || '');
    this.label = options.label || null;
    this.control = options.control || null;
    this.key = options.key || '';
    this.errorMsg = options.errorMsg || null;
    this.required = options.hasOwnProperty('required') ? options.required : false;
    this.holder = options.holder || '';
    this.render = options.hasOwnProperty('render') ? options.render : true;
    this.opts = options.opts ? options.opts : {};
  }
}
