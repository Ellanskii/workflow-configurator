declare module 'systemjs/dist/system.min.js';

declare const System: {
  import(url: string): Promise<unknown>;
};
