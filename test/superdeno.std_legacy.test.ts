import { serve } from "https://deno.land/std@0.113.0/http/server_legacy.ts";
import { describe, it } from "./utils.ts";
import { superdeno } from "../mod.ts";

describe("std: superdeno", () => {
  it("std: superdeno(server): should support `superdeno(server)`", async () => {
    const server = serve("127.0.0.1:0");

    const requestLoopPromise = (async () => {
      for await (const request of server) {
        await request.respond({ body: "hello" });
        break;
      }
    })();

    await superdeno(server)
      .get("/")
      .expect("hello");

    await requestLoopPromise;
  });

  it("std: superdeno(url): should support `superdeno(url)`", async () => {
    const server = serve("127.0.0.1:0");
    const address = server.listener.addr as Deno.NetAddr;
    const url = `http://${address.hostname}:${address.port}`;

    const requestLoopPromise = (async () => {
      for await (const request of server) {
        request.respond({ body: "hello" });
        break;
      }
    })();

    await superdeno(url)
      .get("/")
      .expect("hello");

    server.close();
    await requestLoopPromise;
  });
});
