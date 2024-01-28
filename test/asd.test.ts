import { superdeno } from "../mod.ts";
// @deno-types="npm:@types/express@^4.17"
import express from "npm:express@4.18.2";
import { expect } from "https://deno.land/x/expect@v0.4.0/mod.ts";

Deno.test("it should support regular expressions", async () => {
  const app = express();

  app.get("/", (_req, res) => {
    res.send("Hello Deno!");
  });

  await superdeno(app)
    .get("/")
    .expect("Content-Type", /^application/)
    .catch((err) => {
      expect(err.message).toEqual(
        'expected "Content-Type" matching /^application/, got "text/html; charset=utf-8"',
      );
    });
});
