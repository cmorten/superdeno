import { Oak } from "./deps.ts";
import { describe, it } from "./utils.ts";
import {
  assertStrictEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.113.0/testing/asserts.ts";
import { superdeno } from "../mod.ts";

const setupOak = () => {
  const app = new Oak.Application();
  const router = new Oak.Router();

  router.post("/", (ctx) => {
    const headers = ctx.request.headers;
    const body = ctx.request.body();

    assertStringIncludes(
      headers.get("content-type") ?? "",
      "multipart/form-data; boundary=",
    );
    assertStrictEquals(body.type, "form-data");

    ctx.response.status = 200;
  });

  app.use(router.allowedMethods());
  app.use(router.routes());

  return app;
};

// const setupOpine = () => {
//   const app = Opine.opine();

//   app.post("/", (req, res) => {
//     assertStringIncludes(
//       req.headers.get("content-type") ?? "",
//       "multipart/form-data; boundary=",
//     );

//     res.send("done");
//   });

//   return app;
// };

describe("post multipart/form-data", () => {
  it("should work with oak", async () => {
    const app = setupOak();

    await superdeno(app.handle.bind(app))
      .post("/")
      .field("form_key", "form_value")
      .attach("file_key", "path_to_file", "filename")
      .expect(200);
  });

  // it("should work with opine", async () => {
  //   const app = setupOpine();

  //   await superdeno(app)
  //     .post("/")
  //     .field("form_key", "form_value")
  //     .attach("file_key", "path_to_file", "filename")
  //     .expect(200);
  // });
});
