import { Router } from '@angular/router';
import { URLSearchParams } from '@angular/http';
import { Title } from '@angular/platform-browser';
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Container } from '../../../core';
import { Modal } from '../../../components';
import {
  ClusterService,
  SYMBOLS, paginate, ApiGetParameters, PaginateModel
} from '../../../shared';

@Component({
  moduleId: __filename,
  selector: 'cluster-page',
  templateUrl: './cluster.template.html',
  providers: [ ClusterService, Title ],
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
export class ClusterContainer extends Container implements OnInit, OnDestroy {
  
  clustersModel: Array<any>;
  toolsGroup: FormGroup;

  @ViewChild(Modal) modal: Modal;

  constructor(
    private clusterService: ClusterService,
    private router: Router,
    private title: Title
  ) {
    super();
  }

  ngOnInit() {
    this.title.setTitle('Cluster List');
    this.subscriptions = this.getCluster();
    this.toolsGroup = new FormGroup({
      
    });
  }

  ngOnDestroy() {
    this.clean();
  }


  private getCluster() {
    debugger;
    return this.clusterService.getCluster()
      .subscribe((aclsModel) =>{
        this.clustersModel = aclsModel.data.data.map((v)=>{
          return {id:v.id, name:v.group, created_at:v.created_at};
        });
    });
    
  }
}