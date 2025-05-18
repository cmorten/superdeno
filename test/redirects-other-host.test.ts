import { getFreePort } from "../deps.ts";
import type { ServerLike } from "../src/types.ts";
import { expect, express } from "./deps.ts";
import { describe, it, random } from "./utils.ts";
import { superdeno } from "../mod.ts";
import type { AddressInfo } from "node:net";

let server: ServerLike;
let address: AddressInfo;
let base: string;

let server2: ServerLike;
let address2: AddressInfo;
let base2: string;

const setup = async () => {
  const app = express();
  const app2 = express();

  app.use((_req, res, next) => {
    res.set("Host", base);
    next();
  });
  app.all("/test-301", (_req, res) => {
    res.redirect(301, `${base2}/`);
  });
  app.all("/test-302", (_req, res) => {
    res.redirect(302, `${base2}/`);
  });
  app.all("/test-303", (_req, res) => {
    res.redirect(303, `${base2}/`);
  });
  app.all("/test-307", (_req, res) => {
    res.redirect(307, `${base2}/`);
  });
  app.all("/test-308", (_req, res) => {
    res.redirect(308, `${base2}/`);
  });

  app2.use((_req, res, next) => {
    res.set("Host", base2);
    next();
  });
  app2.all("/", (req, res) => {
    res.send(req.method);
  });

  let resolveServerListenPromise: () => void;
  const serverListenPromise = new Promise<void>((resolve) => {
    resolveServerListenPromise = resolve;
  });
  const freePort = await getFreePort(random(1024, 49151));
  server = app.listen(freePort, () => resolveServerListenPromise());
  address = server.address();
  base = `http://localhost:${address.port}`;

  let resolveServer2ListenPromise: () => void;
  const server2ListenPromise = new Promise<void>((resolve) => {
    resolveServer2ListenPromise = resolve;
  });
  const freePort2 = await getFreePort(random(1024, 49151));
  server2 = app2.listen(freePort2, () => resolveServer2ListenPromise());
  address2 = server2.address();
  base2 = `http://localhost:${address2.port}`;

  await Promise.allSettled([serverListenPromise, server2ListenPromise]);
};

const teardown = () => {
  server?.close?.();
  server2?.close?.();
};

describe("request.get", () => {
  describe("on 301 redirect", () => {
    it("request.get: on 301 redirect: should follow Location with a GET request", async (done) => {
      await setup();

      superdeno(base)
        .get("/test-301")
        .redirects(1)
        .end((_err, res) => {
          expect(res.header.host).toEqual(base2);
          expect(res.status).toEqual(200);
          expect(res.text).toEqual("GET");
          teardown();
          done();
        });
    });
  });

  describe("on 302 redirect", () => {
    it("request.get: on 302 redirect: should follow Location with a GET request", async (done) => {
      await setup();

      superdeno(base)
        .get("/test-302")
        .redirects(1)
        .end((_err, res) => {
          expect(res.header.host).toEqual(base2);
          expect(res.status).toEqual(200);
          expect(res.text).toEqual("GET");
          teardown();
          done();
        });
    });
  });

  describe("on 303 redirect", () => {
    it("request.get: on 303 redirect: should follow Location with a GET request", async (done) => {
      await setup();

      superdeno(base)
        .get("/test-303")
        .redirects(1)
        .end((_err, res) => {
          expect(res.header.host).toEqual(base2);
          expect(res.status).toEqual(200);
          expect(res.text).toEqual("GET");
          teardown();
          done();
        });
    });
  });

  describe("on 307 redirect", () => {
    it("request.get: on 307 redirect: should follow Location with a GET request", async (done) => {
      await setup();

      superdeno(base)
        .get("/test-307")
        .redirects(1)
        .end((_err, res) => {
          expect(res.header.host).toEqual(base2);
          expect(res.status).toEqual(200);
          expect(res.text).toEqual("GET");
          teardown();
          done();
        });
    });
  });

  describe("on 308 redirect", () => {
    it("request.get: on 308 redirect: should follow Location with a GET request", async (done) => {
      await setup();

      superdeno(base)
        .get("/test-308")
        .redirects(1)
        .end((_err, res) => {
          expect(res.header.host).toEqual(base2);
          expect(res.status).toEqual(200);
          expect(res.text).toEqual("GET");
          teardown();
          done();
        });
    });
  });
});

describe("request.post", () => {
  describe("on 301 redirect", () => {
    it("request.post: on 301 redirect: should follow Location with a GET request", async (done) => {
      await setup();

      superdeno(base)
        .post("/test-301")
        .redirects(1)
        .end((_err, res) => {
          expect(res.header.host).toEqual(base2);
          expect(res.status).toEqual(200);
          expect(res.text).toEqual("GET");
          teardown();
          done();
        });
    });

    describe("on 302 redirect", () => {
      it("request.post: on 302 redirect: should follow Location with a GET request", async (done) => {
        await setup();

        superdeno(base)
          .post("/test-302")
          .redirects(1)
          .end((_err, res) => {
            expect(res.header.host).toEqual(base2);
            expect(res.status).toEqual(200);
            expect(res.text).toEqual("GET");
            teardown();
            done();
          });
      });
    });

    describe("on 303 redirect", () => {
      it("request.post: on 303 redirect: should follow Location with a GET request", async (done) => {
        await setup();

        superdeno(base)
          .post("/test-303")
          .redirects(1)
          .end((_err, res) => {
            expect(res.header.host).toEqual(base2);
            expect(res.status).toEqual(200);
            expect(res.text).toEqual("GET");
            teardown();
            done();
          });
      });
    });

    describe("on 307 redirect", () => {
      it("request.post: on 307 redirect: should follow Location with a POST request", async (done) => {
        await setup();

        superdeno(base)
          .post("/test-307")
          .redirects(1)
          .end((_err, res) => {
            expect(res.header.host).toEqual(base2);
            expect(res.status).toEqual(200);
            expect(res.text).toEqual("POST");
            teardown();
            done();
          });
      });
    });

    describe("on 308 redirect", () => {
      it("request.post: on 308 redirect: should follow Location with a POST request", async (done) => {
        await setup();

        superdeno(base)
          .post("/test-308")
          .redirects(1)
          .end((_err, res) => {
            expect(res.header.host).toEqual(base2);
            expect(res.status).toEqual(200);
            expect(res.text).toEqual("POST");
            teardown();
            done();
          });
      });
    });
  });
});
