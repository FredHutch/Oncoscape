import {
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  HostListener
} from '@angular/core';

import { UploadService, FileUpload } from '../services';

export interface FilePreview {
  data: string;
  el: ElementRef;
  service: UploadService;
}

@Directive({
  selector: '[file-select],[file-select][formControl]'
})
export class FileSelect {
  @Input() events: EventEmitter<any>;
  @Output() onUpload: EventEmitter<FileUpload> = new EventEmitter();
  @Output() onPreviewData: EventEmitter<FilePreview> = new EventEmitter();

  files: any[] = [];
  uploader: UploadService;

  private settings: any;

  get options(): any {
    return this.settings;
  }

  @Input('options')
  set options(value: any) {
    this.settings = value;
    this.uploader.setOptions(this.options);
  }

  constructor(public el: ElementRef) {
    this.uploader = new UploadService();

    setTimeout(() => {
      this.uploader.setOptions(this.options);
    });

    this.uploader.emitter.subscribe((data: any) => {
      this.onUpload.emit(data);
      if (data.done) {
        this.files = this.files.filter(f => f.name !== data.originalName);
      }
    });

    this.uploader.previewEmitter.subscribe((data: any) => {
      this.onPreviewData.emit({data: data, el: this.el, service: this.uploader});
    });

    setTimeout(() => {
      if (this.events) {
        this.events.subscribe((data: string) => {
          if (data === 'startUpload') {
            this.uploader.uploadFilesInQueue();
          }
        });
      }
    });
  }

  filterFilesByExtension(): void {
    this.files = this.files.filter(f => {
      if (this.options.allowedExtensions.indexOf(f.type) !== -1) {
        return true;
      }

      let ext: string = f.name.split('.').pop();

      if (this.options.allowedExtensions.indexOf(ext) !== -1 ) {
        return true;
      }

      return false;
    });
  }

  @HostListener('change') onChange(): void {
    this.files = Array.from(this.el.nativeElement.files);

    if (this.options.filterExtensions && this.options.allowedExtensions) {
      this.filterFilesByExtension();
    }

    if (this.files.length) {
      this.uploader.addFilesToQueue(this.files);
    }
  }
}
