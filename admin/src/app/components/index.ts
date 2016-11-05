export * from './breadcrumb';
export * from './modal/modal.component';
export * from './alert/alert.component';
export * from './header/header.component';
export * from './footer/footer.component';
export * from './combobox/combo.component';
export * from './sidebar/sidebar.component';
export * from './smallbox/smallbox.component';

import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { Modal } from './modal/modal.component';
import { Header } from './header/header.component';
import { ComboBox } from './combobox/combo.component';
import { Alert, AlertModel } from './alert/alert.component';
import { Footer, FooterModel } from './footer/footer.component';
import { Crumb, CrumbService, CrumbTreeModel } from './breadcrumb';
import { SideBar, SideBarModel } from './sidebar/sidebar.component';
import { SmallBox, SmallBoxModel } from './smallbox/smallbox.component';

@NgModule({
  imports: [ CommonModule, FormsModule, ReactiveFormsModule, HttpModule, RouterModule ],
  declarations: [ Crumb, Modal, Alert, Header, Footer, SideBar, SmallBox, ComboBox ],
  exports: [ Crumb, Modal, Alert, Header, Footer, SideBar, SmallBox, ComboBox ],
  providers: [ CrumbService ]
})
export class ComponentsModule { }
