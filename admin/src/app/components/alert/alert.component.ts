import { get, has } from 'lodash';
import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';

export interface AlertModel {
  visible: boolean;
  title?: string;
  info?: string;
  autoHide?: boolean;
  close?: boolean;
  classes?: string;
}

@Component({
  moduleId: __filename,
  selector: 'alert-box',
  templateUrl: './alert.template.html'
})
export class Alert implements OnChanges {
  visible: boolean = false;

  @Input() model: AlertModel;
  @Output() onChange = new EventEmitter<any>();

  ngOnChanges(changes: any) {
    if (has(changes, 'model.currentValue')) {
      let current: AlertModel = <AlertModel>get(changes, 'model.currentValue');

      if (current.autoHide) {
        ($('.alert') as any).on('closed.bs.alert', () => {
          this.hide();
        });
      }

      let defaultClass = 'alert ';

      if (current.close || current.autoHide) {
        defaultClass = defaultClass + 'alert-dismissible ';
      }

      current.classes = current.classes ? (defaultClass + current.classes) : defaultClass;

      this.model = current;
      this.model.visible ? this.show() : this.hide();
    }
  }

  show(): void {
    this.visible = true;
    this.onChange.emit({ visible: true });
  }

  hide(): void {
    this.visible = false;
    this.onChange.emit({ visible: false });
  }

  toggle(): void {
    this.visible = this.visible ? false : true;
    this.onChange.emit({ visible: this.visible });
  }
}
