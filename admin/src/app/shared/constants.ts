const STORE = require('store');

export const SYMBOLS = {
  ADAPTERS: {
    REST: 'REST'
  },
  USER: 'user',
  ROUTES: {
    LOGIN: '/login',
    ADMIN: '/admin',
    APIS: {
      INDEX: '/admin/apis',
      NEW: '/admin/apis/new'
    },
    CONSUMER: {
      INDEX: '/admin/consumers',
      NEW: '/admin/consumers/new'
    },
    PLUGINS: {
      INDEX: '/admin/plugins',
      SCHEMA: '/admin/plugins/schema'
    }
  },
  UI: 'ui',
  SIDEBAR: 'sidebar',
  HEADER: 'header',
  FOOTER: 'footer',
  TABLE: {
    ENTRIES: [10, 25, 50, 100]
  },
  UPLOADER: 'UPLOAD'
};

export interface PaginateModel {
  pages: number;
  page: number;
  size: number;
  limit: number;
  next: number;
  prev: number;
}

export function paginate(size: number, current: number = 1, limit: number = 10): PaginateModel {
  let pages = Math.ceil(size / limit);

  return <PaginateModel>{
    pages: pages,
    page: current,
    size: size,
    limit: limit,
    next: ((current + 1) <= pages) ? (current + 1) : 0,
    prev: ((current - 1) <= 0) ? 0 : (current - 1)
  };
}

export function makeSymbolPath(symbols: String[]): string {
  return symbols.join('.');
}

export function getLocalStorage(key?: string): any {
  return key ? STORE.get(key) : STORE.getAll();
}

export function uuid() {
  let lut = [];

  for (let i = 0; i < 256; i++) {
    lut[i] = (i < 16 ? '0' : '') + (i).toString(16);
  }
  /* tslint:disable */
  let rdOne = Math.random() * 0xffffffff | 0;
  let rdTwo = Math.random() * 0xffffffff | 0;
  let rdThree = Math.random() * 0xffffffff | 0;
  let rdFour = Math.random() * 0xffffffff | 0;

  return lut[rdOne & 0xff] + lut[rdOne >> 8 & 0xff] +
    lut[rdOne >> 16 & 0xff] + lut[rdOne >> 24 & 0xff] + '-' +
    lut[rdTwo & 0xff] + lut[rdTwo >> 8 & 0xff] + '-' +
    lut[rdTwo >> 16 & 0x0f | 0x40] + lut[rdTwo >> 24 & 0xff] + '-' +
    lut[rdThree & 0x3f | 0x80] + lut[rdThree >> 8 & 0xff] + '-' +
    lut[rdThree >> 16 & 0xff] + lut[rdThree >> 24 & 0xff] +
    lut[rdFour & 0xff] + lut[rdFour >> 8 & 0xff] +
    lut[rdFour >> 16 & 0xff] + lut[rdFour >> 24 & 0xff];
  /* tslint:enable */
}

export function humanizeBytes(bytes: number): string {
  if (bytes === 0) {
    return '0 Byte';
  }

  let k = 1024;
  const sizes: string[] = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  let i: number = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i] + '/s';
}
