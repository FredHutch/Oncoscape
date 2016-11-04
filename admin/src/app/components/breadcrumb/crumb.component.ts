import { CrumbService } from './crumb.service';
import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';

@Component({
  moduleId: __filename,
  selector: 'crumb-tag',
  templateUrl: './crumb.template.html'
})
export class Crumb {
  urls: string[];
  activeUrl: string;
  urlCrumb: string;

  constructor(
    private router: Router,
    private service: CrumbService
  ) {
    this.router.events.subscribe(
      (navigation: NavigationEnd) => {
        this.urls = [];
        this.activeUrl = navigation.urlAfterRedirects
          ? navigation.urlAfterRedirects : navigation.url;

        this.urlCrumb = this.checkUrl(this.activeUrl);
        this.buildCrumb(this.urlCrumb);
      }
    );
  }

  buildCrumb(url: string): void {
    let _url = url;

    this.urls.unshift(_url);

    if (_url.lastIndexOf('/') > 0) {
      this.buildCrumb(_url.substr(0, _url.lastIndexOf('/')));
    }
  }

  getCrumbProperty(url: string, property: string): string {
    return this.service.getUrlProperty(this.checkUrl(url), property);
  }

  hasCrumbProperty(url: string, property: string): boolean {
    return this.service.hasUrlProperty(this.checkUrl(url), property);
  }

  private checkUrl(url: string, count: number = 1): string {
    if (!this.service.hasUrl(url) && url !== undefined && count < 5) {
      url = url.substr(0, url.lastIndexOf('/'));
      count = count + 1;
      this.checkUrl(url, count);
    }

    return url;
  }
}
