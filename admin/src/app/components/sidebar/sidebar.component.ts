import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

export interface SideBarModel {
  label?: string;
  className?: string;
  icon?: string;
  url?: string;
  fn?: Function;
  tree?: Array<SideBarModel>;
}

@Component({
  moduleId: __filename,
  selector: 'side-bar',
  templateUrl: './sidebar.template.html'
})
export class SideBar {
  @Input() model: SideBarModel;
  @Output() onLinkClick = new EventEmitter<any>();

  sideBarItem(item: SideBarModel) {
    this.onLinkClick.emit(item);
  }
}
