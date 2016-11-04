import { Directive, ElementRef, HostListener, Input, Renderer } from '@angular/core';

@Directive({
  selector: '[tooltip]'
})
export class ToolTipDirective {
  private msg: string;
  private place: string = 'top';

  constructor(private el: ElementRef, private renderer: Renderer) { }

  @Input('placement') set placement(place: string) {
    this.place = place || this.place;
  }

  @Input('tooltip') set tooltip(msg: string) {
    this.msg = msg;
  }

  @HostListener('mouseenter') onMouseEnter() {
    ($(this.el.nativeElement) as any)
      .tooltip({ placement: this.place, title: this.msg }).tooltip('show');
  }

  @HostListener('mouseleave') onMouseLeave() {
    ($(this.el.nativeElement) as any).tooltip('hide');
  }
}
