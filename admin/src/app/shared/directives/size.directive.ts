import { Directive, Input, ElementRef, AfterViewInit } from '@angular/core';

@Directive({
  selector: '[size]'
})
export class Size implements AfterViewInit {

  @Input() size: number;

  constructor(private _el: ElementRef) {}

  ngAfterViewInit() {
    this.listenForBodyChanges();

    this.setElementMinHeight(document.body.offsetHeight);
  }

  setElementMinHeight(min: number) {
    (this._el.nativeElement as HTMLElement).style.minHeight = `${min}px`;
  }

  listenForBodyChanges() {
    window.addEventListener('resize', (ev: Event) => {
      this.setElementMinHeight(document.body.offsetHeight);
    });
  }

  private detectBodyHeight(): number {
    return Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight
    );
  }
}
