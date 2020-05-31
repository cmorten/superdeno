/**
 * Port of supertest (https://github.com/visionmedia/supertest) for Deno
 */

import { methods, Server, serve } from "../deps.ts";
import { Test } from "./test.ts";
import { close } from "./close.ts";
import { isListener, isServer, isString } from "./utils.ts";
import { RequestHandler, Listener, SuperDeno } from "./types.ts";

export const superdeno = (
  app: string | RequestHandler | Listener | Server,
  secure?: boolean,
): SuperDeno => {
  const obj: Record<string, any> = {};

  let managedServer: Server | undefined;
  if (!isString(app) && !isListener(app) && !isServer(app)) {
    managedServer = serve({ port: 0 });
  }

  methods.forEach((method) => {
    obj[method] = (url: string) => {
      return new Test(
        app as string | Listener | Server,
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
          (app as RequestHandler)(request);
        }
      } catch (err) {
        await close(managedServer as Server, app, err);
      }
    })();
  }

  return obj as SuperDeno;
};
