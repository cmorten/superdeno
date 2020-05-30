// Type definitions for SuperDeno
// Project: https://github.com/asos-craigmorten/superdeno
// Definitions by: Craig Morten <craig.morten@asos.com>

import { Server, ServerRequest, HTTPOptions, HTTPSOptions } from "../deps.ts";

export interface RequestHandler {
  (req: ServerRequest): void;
}

export interface Listener {
  listen(addr: string | HTTPOptions | HTTPSOptions): Server;
}

export interface supertest {
  (app: string | RequestHandler | Listener | Server): SuperDeno;
}

export interface HTTPError extends Error {
  status: number;
  text: string;
  method: string;
  path: string;
}

export interface XMLHttpRequest {}

export interface SuperDenoResponse {
  accepted: boolean;
  badRequest: boolean;
  body: any;
  charset: string;
  clientError: boolean;
  error: false | HTTPError;
  files: any;
  forbidden: boolean;
  get(header: string): string;
  get(header: "Set-Cookie"): string[];
  header: any;
  info: boolean;
  links: object;
  noContent: boolean;
  notAcceptable: boolean;
  notFound: boolean;
  ok: boolean;
  redirect: boolean;
  serverError: boolean;
  status: number;
  statusType: number;
  text: string;
  type: string;
  unauthorized: boolean;
  xhr: XMLHttpRequest;
  redirects: string[];
}

export interface SuperDenoRequest extends Request {
  cookies: string;
  method: string;
  url: string;

  abort(): void;
  accept(type: string): this;
  attach(
    field: string,
    file: any,
    options?: string | { filename?: string; contentType?: string },
  ): this;
  auth(
    user: string,
    pass: string,
    options?: { type: "basic" | "auto" },
  ): this;
  auth(token: string, options: { type: "bearer" }): this;
  buffer(val?: boolean): this;
  ca(cert: any): this;
  cert(cert: any): this;
  clearTimeout(): this;
  disableTLSCerts(): this;
  end(callback?: CallbackHandler): void;
  field(name: string, val: any): this;
  field(fields: { [fieldName: string]: any }): this;
  get(field: string): string;
  key(cert: any): this;
  ok(callback: (res: Response) => boolean): this;
  on(name: "error", handler: (err: any) => void): this;
  on(name: "progress", handler: (event: any) => void): this;
  on(name: "response", handler: (response: any) => void): this;
  on(name: string, handler: (event: any) => void): this;
  parse(parser: any): this;
  part(): this;
  pfx(
    cert: any | {
      pfx: any;
      passphrase: string;
    },
  ): this;
  query(val: object | string): this;
  redirects(n: number): this;
  responseType(type: string): this;
  retry(count?: number, callback?: CallbackHandler): this;
  send(data?: string | object): this;
  serialize(serializer: any): this;
  set(field: object): this;
  set(field: string, val: string): this;
  set(field: "Cookie", val: string[]): this;
  timeout(ms: number | { deadline?: number; response?: number }): this;
  trustLocalhost(enabled?: boolean): this;
  type(val: string): this;
  unset(field: string): this;
  use(fn: any): this;
  withCredentials(): this;
  write(data: any, encoding?: string): this;
  maxResponseSize(size: number): this;
}

export type CallbackHandler = (err: any, res: Response) => void;

export interface Test extends SuperDenoRequest {
  app?: any;
  url: string;
  serverAddress(app: any, path: string): string;
  expect(status: number, callback?: CallbackHandler): this;
  expect(status: number, body: any, callback?: CallbackHandler): this;
  expect(checker: (res: Response) => any, callback?: CallbackHandler): this;
  expect(body: string, callback?: CallbackHandler): this;
  expect(body: RegExp, callback?: CallbackHandler): this;
  expect(body: Object, callback?: CallbackHandler): this;
  expect(field: string, val: string, callback?: CallbackHandler): this;
  expect(field: string, val: RegExp, callback?: CallbackHandler): this;
  expect(field: string, val: number, callback?: CallbackHandler): this;
  end(callback?: CallbackHandler): this;
}

export interface SuperDeno {
  get(url: string): Test;
  post(url: string): Test;
  put(url: string): Test;
  delete(url: string): Test;
  patch(url: string): Test;
  options(url: string): Test;
  head(url: string): Test;
  checkout(url: string): Test;
  connect(url: string): Test;
  copy(url: string): Test;
  lock(url: string): Test;
  merge(url: string): Test;
  mkactivity(url: string): Test;
  mkcol(url: string): Test;
  move(url: string): Test;
  "m-search": (url: string) => Test;
  notify(url: string): Test;
  propfind(url: string): Test;
  proppatch(url: string): Test;
  purge(url: string): Test;
  report(url: string): Test;
  search(url: string): Test;
  subscribe(url: string): Test;
  trace(url: string): Test;
  unlock(url: string): Test;
  unsubscribe(url: string): Test;
}
