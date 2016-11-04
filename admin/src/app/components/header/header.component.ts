import { DOCUMENT } from '@angular/platform-browser';
import { Component, Output, EventEmitter, Inject } from '@angular/core';

@Component({
  moduleId: __filename,
  selector: 'header-tag',
  templateUrl: './header.template.html'
})
export class Header {
  @Output() onToggleClick = new EventEmitter<any>();

  collapse: boolean = false;

  constructor(@Inject(DOCUMENT) private _document) { }

  toggle(event: MouseEvent): void {
    event.preventDefault();

    let body: HTMLBodyElement = this._document.querySelector('body');

    this.collapse
      ? body.classList.remove('sidebar-collapse')
      : body.classList.add('sidebar-collapse');

    this.collapse = this.collapse ? false : true;
    this.onToggleClick.emit(this.collapse);
  }
}
