import { HTTPOptions, HTTPSOptions } from "../deps.ts";

export interface RequestHandler {
  (
    req: any,
  ): Promise<any> | Promise<void> | any | void;
}

export interface Server {
  close(): void;
  listener: any;
  [Symbol.asyncIterator](): any;
}

export interface Listener {
  listen(addr: string | HTTPOptions | HTTPSOptions): Server;
}
