declare module '*.png';
declare module '*.svg';
declare module '*.jpg';

declare namespace NodeJS {
  interface Global {
    Buffer: any;
    process: any;
  }
}