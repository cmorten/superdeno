import { serve } from "https://deno.land/std@0.106.0/http/server.ts";
import { describe, it } from "./utils.ts";
import { superdeno } from "../mod.ts";

describe("std: superdeno", () => {
  it("std: superdeno(server): should support `superdeno(server)`", async () => {
    const server = serve("127.0.0.1:8080");

    (async () => {
      for await (const request of server) {
        await request.respond({ body: "hello" });
      }
    })();

    await superdeno(server)
      .get("/")
      .expect("hello");
  });

  it("std: superdeno(url): should support `superdeno(url)`", async () => {
    const server = serve(":0");
    const address = server.listener.addr as Deno.NetAddr;
    const url = `http://${address.hostname}:${address.port}`;

    (async () => {
      for await (const request of server) {
        request.respond({ body: "hello" });
      }
    })();

    await superdeno(url)
      .get("/")
      .expect("hello");

    server.close();
  });
});
