import { Ako } from "./deps.ts";
import { describe, it } from "./utils.ts";
import { superdeno } from "../mod.ts";

const { Application } = Ako;

describe("Ako: .expect(status, body[, fn])", () => {
  it("Ako: superdeno(Server): .expect(status, body[, fn]): should assert the response body and error status", async () => {
    const app = new Application();

    app.use((ctx) => {
      ctx.body = "Hello Deno!";

      ctx.throw(418, "boom");
    });

    await superdeno(app.listen())
      .get("/")
      .expect(418)
      .expect("Content-Length", "4")
      .expect("Content-Type", "text/plain; charset=utf-8")
      .expect(418, "boom");
  });
});
