import { Oak, expect } from "./deps.ts";
import { HTTPOptions, HTTPSOptions } from "../deps.ts";
import { describe, it } from "./utils.ts";
import { superdeno, Test } from "../mod.ts";

const { Application, Router } = Oak;

const bootstrapOakServerTest = async (
  { configureApp, listenOpts, assertionsDelegate, done }: {
    configureApp: (
      { app, router }: { app: Oak.Application; router: Oak.Router },
    ) => void;
    assertionsDelegate: (
      { app, url, controller, done }: {
        app: Oak.Application;
        url: string;
        controller: AbortController;
        done: () => void;
      },
    ) => void;
    listenOpts: HTTPOptions | HTTPSOptions;
    done: () => void;
  },
) => {
  const router = new Router();
  const app = new Application();

  configureApp({ app, router });

  app.use(router.routes());
  app.use(router.allowedMethods());

  const controller = new AbortController();
  const { signal } = controller;

  app.addEventListener("listen", ({ hostname, port, secure }: any) => {
    const protocol = secure ? "https" : "http";
    const url = `${protocol}://${hostname}:${port}`;

    assertionsDelegate({ app, url, controller, done });
  });

  await app.listen({ ...listenOpts, signal });
};

describe("Oak: superdeno(url)", () => {
  it("Oak: superdeno(url): should support open `superdeno(url)` format for web frameworks such as Oak", async (
    done,
  ) => {
    await bootstrapOakServerTest({
      configureApp: ({ router }) => {
        router.get("/", (ctx: Oak.RouterContext) => {
          ctx.response.body = "hello";
        });
      },
      listenOpts: { port: 0 },
      assertionsDelegate: ({ url, controller, done }) =>
        superdeno(url)
          .get("/")
          .expect("hello", () => {
            controller.abort();
            done();
          }),
      done,
    });
  });

  describe(".end(cb)", () => {
    it("Oak: superdeno(url): .end(cb): should set `this` to the test object when calling the `cb` in `.end(cb)`", async (
      done,
    ) => {
      await bootstrapOakServerTest({
        configureApp: ({ router }) => {
          router.get("/", (ctx: Oak.RouterContext) => {
            ctx.response.body = "hello";
          });
        },
        listenOpts: { port: 0 },
        assertionsDelegate: ({ url, controller, done }) => {
          const test = superdeno(url).get("/");

          test.end(function (this: Test) {
            expect(test).toEqual(this);
            controller.abort();
            done();
          });
        },
        done,
      });
    });
  });
});

describe("Oak: superdeno(app.handle)", () => {
  it("Oak: superdeno(app.handle): should support `superdeno(app.handle)` for web frameworks such as Oak", async () => {
    const router = new Router();
    const app = new Application();

    router.get("/", (ctx: Oak.RouterContext) => {
      ctx.response.body = "Hello Deno!";
    });

    app.use(router.routes());
    app.use(router.allowedMethods());

    /**
     * Note that we have to bind `app` to the function otherwise `app.handle`
     * doesn't maintain `this` from the `app`.
     */
    await superdeno(app.handle.bind(app))
      .get("/")
      .expect("Hello Deno!");
  });
});
