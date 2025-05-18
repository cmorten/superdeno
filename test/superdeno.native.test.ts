import { describe, it } from "./utils.ts";
import { expect } from "./deps.ts";
import { superdeno } from "../mod.ts";

describe("native: superdeno", () => {
  it("native: superdeno(server): should support `superdeno(server)`", async () => {
    const server = Deno.serve({
      port: 0,
    }, function handler(_req) {
      return new Response("hello");
    });

    await superdeno(server)
      .get("/")
      .expect("hello");
  });

  it("superdeno(server): .expect(field, value[, fn]): should assert multiple fields", async () => {
    const server = Deno.serve({
      port: 0,
    }, function handler(_req) {
      return new Response("hey");
    });

    await superdeno(server)
      .get("/")
      .expect("Content-Type", "text/plain;charset=UTF-8")
      .expect("Content-Length", "3");
  });

  it("superdeno(server): .expect(field, value[, fn]): should support numbers", (done) => {
    const server = Deno.serve({
      port: 0,
    }, function handler(_req) {
      return new Response("hey");
    });

    superdeno(server)
      .get("/")
      .expect("Content-Length", 4)
      .end((err) => {
        expect(err.message).toEqual(
          'expected "Content-Length" of "4", got "3"',
        );
        done();
      });
  });

  it("native: superdeno(url): should support `superdeno(url)`", async () => {
    const server = Deno.serve({
      port: 0,
    }, function handler(_req) {
      return new Response("hello");
    });

    const serverPromise = server.finished;
    const address = server.addr as Deno.NetAddr;
    const url = `http://127.0.0.1:${address.port}`;

    await superdeno(url)
      .get("/")
      .expect("hello");

    server.shutdown();
    await serverPromise;
  });
});
