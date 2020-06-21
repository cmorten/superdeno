import { Server, HTTPOptions, HTTPSOptions } from "../deps.ts";

export interface RequestHandler {
  (req: any): void;
}

export interface Listener {
  listen(addr: string | HTTPOptions | HTTPSOptions): Server;
}
