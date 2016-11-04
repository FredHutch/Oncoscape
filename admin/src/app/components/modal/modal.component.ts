import { isFunction } from 'lodash';
import {
  Component, Input, Output, EventEmitter,
  ElementRef, AfterViewInit, OnChanges
} from '@angular/core';

@Component({
  moduleId: __filename,
  selector: 'modal-tag',
  templateUrl: './modal.template.html'
})
export class Modal implements AfterViewInit {
  @Input() onOpen: Function;
  @Input() onClose: Function;
  @Input() idSelector: string;
  @Input() hasFooter: boolean;
  @Input() hasClose: boolean;
  @Input() hasAction: boolean;

  @Output() events = new EventEmitter<any>();

  title: string;
  body: string;
  actionLabel: string;
  actionFn: Function;
  actionClass: string;

  private _selector: string;

  constructor(private _ref: ElementRef) { }

  ngAfterViewInit() {
    this._selector = this.idSelector ? '#' + this.idSelector : '.modal';

    ($(this._selector) as any).on('hidden.bs.modal', (e) => {
      this.events.emit({ hide: true, show: false });

      if (isFunction(this.onClose)) {
        this.onClose(e);
      }
    });

    ($(this._selector) as any).on('show.bs.modal', (e) => {
      this.events.emit({ hide: false, show: true });

      if (isFunction(this.onOpen)) {
        this.onOpen(e);
      }
    });
  }

  show() {
    ($(this._selector) as any).modal('show');
  }

  hide() {
    ($(this._selector) as any).modal('hide');
  }

  onAction(event: MouseEvent) {
    event.preventDefault();

    if (isFunction(this.actionFn)) {
      this.actionFn(event);
    }
  }
}
