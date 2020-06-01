import { Server, ServerRequest, HTTPOptions, HTTPSOptions } from "../deps.ts";

export interface RequestHandler {
  (req: ServerRequest): void;
}

export interface Listener {
  listen(addr: string | HTTPOptions | HTTPSOptions): Server;
}
