import { Router } from '@angular/router';
import { URLSearchParams } from '@angular/http';
import { Title } from '@angular/platform-browser';
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Container } from '../../../core';
import { Modal } from '../../../components';
import {
  AclsService,
  SYMBOLS, paginate, ApiGetParameters, PaginateModel
} from '../../../shared';

@Component({
  moduleId: __filename,
  selector: 'acls-page',
  templateUrl: './acls.template.html',
  providers: [ AclsService, Title ],
  styles: [
    `
    .form-group, .input-group {
      margin-left: 10px;
    }
    .input-group {
      width: 20%;
    }
    a {
      cursor: pointer;
    }
    `
  ]
})
export class AclsContainer extends Container implements OnInit, OnDestroy {
  
  rolesModel: Array<any>;
  entriesLength: Array<number> = SYMBOLS.TABLE.ENTRIES;
  toolsGroup: FormGroup;

  @ViewChild(Modal) modal: Modal;

  constructor(
    private aclsService: AclsService,
    private router: Router,
    private title: Title
  ) {
    super();
  }

  ngOnInit() {
    this.title.setTitle('Acls List');
    this.subscriptions = this.getAcls();
    this.toolsGroup = new FormGroup({
      entries: new FormControl(this.entriesLength[0]),
      search: new FormControl()
    });
  }

  ngOnDestroy() {
    this.clean();
  }


  private getAcls() {
    return this.aclsService.getRoles()
      .subscribe((aclsModel) =>{
        this.rolesModel = aclsModel.data.data.map((v)=>{
          return {id:v.id, name:v.group, created_at:v.created_at};
        });
    });
    
  }
}