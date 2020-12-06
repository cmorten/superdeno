/**
 * Port of supertest (https://github.com/visionmedia/supertest) for Deno
 */

import { methods, Response, serve } from "../deps.ts";
import { Test } from "./test.ts";
import { close } from "./close.ts";
import { isListener, isResponse, isServer, isString } from "./utils.ts";
import type { Listener, RequestHandler, Server } from "./types.ts";

/**
 * Provides methods for making requests to the configured server using the passed
 * `url` string, and returning a new `Test`.
 */
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
  "m-search"(url: string): Test;
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

/**
 * Takes a a url string, [`http.Server`](https://doc.deno.land/https/deno.land/std/http/mod.ts#Server),
 * a request handling function, or an object that implements an `app.listen()` method (which mirrors
 * the [`http.serve`](https://doc.deno.land/https/deno.land/std/http/mod.ts#serve) interface).
 * 
 * Accepts an optional second argument of `secure` to determine whether connections should be over _HTTPS_
 * (`true`) or _HTTP_ (`false`)
 * 
 * If SuperDeno identifies that a server is not already listening for connections, then one is bound to
 * an ephemeral port for you so there is no need to keep track of ports.
 * 
 * @param {string|RequestHandler|Listener|Server} app 
 * @param {?boolean} secure 
 * 
 * @returns {SuperDeno}
 * @public
 */
export function superdeno(
  app: string | RequestHandler | Listener | Server,
  secure?: boolean,
): SuperDeno {
  const obj: Record<string, any> = {};

  let managedServer: Server | undefined;
  if (!isString(app) && !isListener(app) && !isServer(app)) {
    managedServer = serve({ port: 0 }) as Server;
  }

  methods.forEach((method) => {
    obj[method] = (url: string) => {
      return new Test(
        managedServer || app as string | Listener | Server,
        method,
        url,
        undefined,
        secure,
      );
    };
  });

  if (isServer(managedServer)) {
    (async () => {
      try {
        for await (const request of managedServer as Server) {
          const response = await (app as RequestHandler)(request);

          if (isResponse(response)) {
            await request.respond(response as Response);
          }
        }
      } catch (err) {
        await close(managedServer as Server, app, err);
      }
    })();
  }

  return obj as SuperDeno;
}
