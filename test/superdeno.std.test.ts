import { Server } from "../deps.ts";
import { describe, it } from "./utils.ts";
import { superdeno } from "../mod.ts";

describe("std: superdeno", () => {
  it("std: superdeno(server): should support `superdeno(server)`", async () => {
    const server = new Server({
      addr: ":0",
      handler() {
        return new Response("hello");
      },
    });

    await superdeno(server)
      .get("/")
      .expect("hello");
  });

  it("std: superdeno(url): should support `superdeno(url)`", async () => {
    const server = new Server({
      addr: ":0",
      handler() {
        return new Response("hello");
      },
    });

    const serverPromise = server.listenAndServe();
    const address = server.addrs[0] as Deno.NetAddr;
    const url = `http://${address.hostname}:${address.port}`;

    await superdeno(url)
      .get("/")
      .expect("hello");

    server.close();
    await serverPromise;
  });
});
