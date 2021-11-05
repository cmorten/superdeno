import type { ServerLike } from "../src/types.ts";
import { expect, Opine } from "./deps.ts";
import { describe, it } from "./utils.ts";
import { superdeno } from "../mod.ts";

const { opine } = Opine;

let server: ServerLike;
let address: Deno.NetAddr;
let base: string;

let server2: ServerLike;
let address2: Deno.NetAddr;
let base2: string;

const setup = () => {
  const app = opine();
  const app2 = opine();

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

  server = app.listen();
  address = server.listener.addr as Deno.NetAddr;
  base = `http://localhost:${address.port}`;

  server2 = app2.listen();
  address2 = server2.listener.addr as Deno.NetAddr;
  base2 = `http://localhost:${address2.port}`;
};

const teardown = () => {
  server?.close?.();
  server2?.close?.();
};

describe("request.get", () => {
  describe("on 301 redirect", () => {
    it("request.get: on 301 redirect: should follow Location with a GET request", (done) => {
      setup();

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
    it("request.get: on 302 redirect: should follow Location with a GET request", (done) => {
      setup();

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
    it("request.get: on 303 redirect: should follow Location with a GET request", (done) => {
      setup();

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
    it("request.get: on 307 redirect: should follow Location with a GET request", (done) => {
      setup();

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
    it("request.get: on 308 redirect: should follow Location with a GET request", (done) => {
      setup();

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
    it("request.post: on 301 redirect: should follow Location with a GET request", (done) => {
      setup();

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
      it("request.post: on 302 redirect: should follow Location with a GET request", (done) => {
        setup();

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
      it("request.post: on 303 redirect: should follow Location with a GET request", (done) => {
        setup();

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
      it("request.post: on 307 redirect: should follow Location with a POST request", (done) => {
        setup();

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
      it("request.post: on 308 redirect: should follow Location with a POST request", (done) => {
        setup();

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
