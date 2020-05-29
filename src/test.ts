import { ServerRequest } from "../deps.ts";

export class Test extends ServerRequest {
  constructor(app: any, method: string, path: string, host?: string) {
    super();
    console.log(method, path, host);
  }
}
