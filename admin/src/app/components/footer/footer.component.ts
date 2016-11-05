import { Component, Input, OnInit } from '@angular/core';

export interface FooterModel {
  rightHtml?: string;
  leftHtml?: string;
}

@Component({
  moduleId: __filename,
  selector: 'footer-tag',
  templateUrl: './footer.template.html'
})
export class Footer {
  @Input() footerModel: FooterModel;
}
