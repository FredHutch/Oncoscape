import { Injectable, EventEmitter } from '@angular/core';

import { humanizeBytes } from '../constants';

export interface FileProgress {
  loaded: number;
  total: number;
  percent: number;
  speed?: number;
  speedHumanized?: string;
};

export interface FileCustomData {
  [key: string]: any;
}

@Injectable()
export class FileUpload {
  file: any;
  id: string;
  status: number;
  statusText: string;
  progress: FileProgress;
  originalName: string;
  size: number;
  response: string;
  done: boolean;
  error: boolean;
  abort: boolean;
  startTime: number;
  endTime: number;
  speedAverage: number;
  speedAverageHumanized: string;

  constructor(id: string, originalName: string, size: number) {
    this.id = id;
    this.originalName = originalName;
    this.size = size;
    this.progress = <FileProgress>{
      loaded: 0,
      total: 0,
      percent: 0,
      speed: 0,
      speedHumanized: null
    };
    this.done = false;
    this.error = false;
    this.abort = false;
    this.startTime = new Date().getTime();
    this.endTime = 0;
    this.speedAverage = 0;
    this.speedAverageHumanized = null;
  }

  setFile(file: any) {
    this.file = file;
  }

  setProgres(progress: FileProgress): void {
    this.progress = progress;
  }

  setError(): void {
    this.error = true;
    this.done = true;
  }

  setAbort(): void {
    this.abort = true;
    this.done = true;
  }

  onFinished(status: number, statusText: string, response: string): void {
    this.endTime = new Date().getTime();
    this.speedAverage = this.size / (this.endTime - this.startTime) * 1000;
    this.speedAverage = parseInt(<any>this.speedAverage, 10);
    this.speedAverageHumanized = humanizeBytes(this.speedAverage);
    this.status = status;
    this.statusText = statusText;
    this.response = response;
    this.done = true;
  }
}

@Injectable()
export class UploadService {
  url: string;
  cors: boolean = false;
  withCredentials: boolean = false;
  multiple: boolean = false;
  maxUploads: number = 3;
  data: FileCustomData = {};
  autoUpload: boolean = true;
  multipart: boolean = true;
  method: string = 'POST';
  debug: boolean = false;
  customHeaders: any = {};
  encodeHeaders: boolean = true;
  authTokenPrefix: string = 'Bearer';
  authToken: string = undefined;
  fieldName: string = 'file';
  previewUrl: boolean = false;
  calculateSpeed: boolean = false;
  emitter: EventEmitter<any> = new EventEmitter();
  previewEmitter: EventEmitter<any> = new EventEmitter();

  private queue: any[] = [];

  setOptions(options: any): void {
    this.url = (options.url !== undefined)
      ? options.url : this.url;
    this.cors = (options.cors !== undefined)
      ? options.cors : this.cors;
    this.withCredentials = (options.withCredentials !== undefined)
      ? options.withCredentials : this.withCredentials;
    this.multiple = (options.multiple !== undefined)
      ? options.multiple : this.multiple;
    this.maxUploads = (options.maxUploads !== undefined)
      ? options.maxUploads : this.maxUploads;
    this.data = (options.data !== undefined)
      ? options.data : this.data;
    this.autoUpload = (options.autoUpload !== undefined)
      ? options.autoUpload : this.autoUpload;
    this.multipart = (options.multipart !== undefined)
      ? options.multipart : this.multipart;
    this.method = (options.method !== undefined)
      ? options.method : this.method;
    this.customHeaders = (options.customHeaders !== undefined)
      ? options.customHeaders : this.customHeaders;
    this.encodeHeaders = (options.encodeHeaders !== undefined)
      ? options.encodeHeaders : this.encodeHeaders;
    this.authTokenPrefix = (options.authTokenPrefix !== undefined)
      ? options.authTokenPrefix : this.authTokenPrefix;
    this.authToken = (options.authToken !== undefined)
      ? options.authToken : this.authToken;
    this.fieldName = (options.fieldName !== undefined)
      ? options.fieldName : this.fieldName;
    this.previewUrl = (options.previewUrl !== undefined)
      ? options.previewUrl : this.previewUrl;
    this.calculateSpeed = (options.calculateSpeed !== undefined)
      ? options.calculateSpeed : this.calculateSpeed;

    if (!this.multiple) {
      this.maxUploads = 1;
    }
  }

  uploadFilesInQueue(): void {
    let newFiles = this.queue.filter((f) => { return !f.uploading; });

    newFiles.forEach((f) => {
      this.uploadFile(f);
    });
  };

  uploadFile(file: any): void {
    let xhr = new XMLHttpRequest();
    let form = new FormData();
    form.append(this.fieldName, file, file.name);

    Object.keys(this.data).forEach(k => {
      form.append(k, this.data[k]);
    });

    let uploadingFile = new FileUpload(
      this.generateRandomIndex(),
      file.name,
      file.size
    );

    uploadingFile.setFile(file);

    let queueIndex = this.queue.indexOf(file);

    let time: number = new Date().getTime();
    let load = 0;
    let speed = 0;
    let speedHumanized: string = null;

    xhr.upload.onprogress = (e: ProgressEvent) => {
      if (e.lengthComputable) {
        if (this.calculateSpeed) {
          time = new Date().getTime() - time;
          load = e.loaded - load;
          speed = load / time * 1000;
          speed = parseInt(<any>speed, 10);
          speedHumanized = humanizeBytes(speed);
        }

        let percent = Math.round(e.loaded / e.total * 100);

        if (speed === 0) {
          uploadingFile.setProgres({
            total: e.total,
            loaded: e.loaded,
            percent: percent
          });
        } else {
          uploadingFile.setProgres({
            total: e.total,
            loaded: e.loaded,
            percent: percent,
            speed: speed,
            speedHumanized: speedHumanized
          });
        }

        this.emitter.emit(uploadingFile);
      }
    };

    xhr.upload.onabort = (e: Event) => {
      uploadingFile.setAbort();
      this.emitter.emit(uploadingFile);
    };

    xhr.upload.onerror = (e: Event) => {
      uploadingFile.setError();
      this.emitter.emit(uploadingFile);
    };

    xhr.onreadystatechange = () => {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        uploadingFile.onFinished(
            xhr.status,
            xhr.statusText,
            xhr.response
        );
        this.removeFileFromQueue(queueIndex);
        this.emitter.emit(uploadingFile);
      }
    };

    xhr.open(this.method, this.url, true);
    xhr.withCredentials = this.withCredentials;

    if (this.customHeaders) {
      Object.keys(this.customHeaders).forEach((key) => {
        xhr.setRequestHeader(key, this.customHeaders[key]);
      });
    }

    if (this.authToken) {
      xhr.setRequestHeader('Authorization', `${this.authTokenPrefix} ${this.authToken}`);
    }

    xhr.send(form);
  }

  addFilesToQueue(files: File[]): void {
    this.clearQueue();

    files.forEach((file: File, i: number) => {
      if (this.isFile(file) && !this.inQueue(file)) {
        this.queue.push(file);
      }
    });

    if (this.previewUrl) {
      files.forEach(file => this.createFileUrl(file));
    }

    if (this.autoUpload) {
      this.uploadFilesInQueue();
    }
  }

  createFileUrl(file: File) {
    let reader: FileReader = new FileReader();
    reader.addEventListener('load', () => {
        this.previewEmitter.emit(reader.result);
    });
    reader.readAsDataURL(file);
  }

  removeFileFromQueue(i: number): void {
    this.queue.splice(i, 1);
  }

  clearQueue(): void {
    this.queue = [];
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  inQueue(file: any): boolean {
    let fileInQueue = this.queue.filter((f) => { return f === file; });
    return fileInQueue.length ? true : false;
  }

  isFile(file: any): boolean {
    return file !== null && (file instanceof Blob || (file.name && file.size));
  }

  generateRandomIndex(): string {
    return Math.random().toString(36).substring(7);
  }
}
