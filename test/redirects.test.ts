// deno-lint-ignore-file no-explicit-any

import { expect, Opine } from "./deps.ts";
import { describe, it } from "./utils.ts";
import { superdeno } from "../mod.ts";

const { opine, json, urlencoded } = Opine;
let promises: Promise<any>[] = [];

const allPromises = async () => {
  for (const promise of promises) {
    try {
      await promise;
    } catch (_) {
      // swallow
    }
  }
  promises = [];
};

const setup = () => {
  const app = opine();

  app.use(json());
  app.use(urlencoded({ extended: true }));

  app.use((req, res, next) => {
    res.set("Cache-Control", "no-cache, no-store");
    next();
  });

  app.post("/movie", (req, res) => {
    res.redirect("/movies/all/0");
  });

  app.get("/", (req, res) => {
    res.set("QUERY", JSON.stringify(req.query));
    res.redirect("/movies");
  });

  app.get("/movies", (req, res) => {
    res.set("QUERY", JSON.stringify(req.query));
    res.redirect("/movies/all");
  });

  app.get("/movies/all", (req, res) => {
    res.set("QUERY", JSON.stringify(req.query));
    res.redirect("/movies/all/0");
  });

  app.get("/movies/all/0", (req, res) => {
    res.set("QUERY", JSON.stringify(req.query));
    res.setStatus(200).send("first movie page");
  });

  app.get("/movies/random", (req, res) => {
    res.redirect("/movie/4");
  });

  app.get("/movie/4", (req, res) => {
    promises.push(
      new Promise((resolve) =>
        setTimeout(async () => {
          try {
            await res.end("not-so-random movie");
          } catch (e) {}
          resolve(true);
        }, 250)
      ),
    );
  });

  app.get("/cookie-redirect", (req, res) => {
    res.set("Set-Cookie", "replaced=yes");
    res.append("Set-Cookie", "from-redir=1");
    res.redirect(303, "/show-cookies");
  });

  app.get("/show-cookies", (req, res) => {
    res.set("content-type", "text/plain");
    res.send(req.headers.get("cookie"));
  });

  app.put("/redirect-303", (req, res) => {
    res.redirect(303, "/reply-method");
  });

  app.put("/redirect-307", (req, res) => {
    res.redirect(307, "/reply-method");
  });

  app.put("/redirect-308", (req, res) => {
    res.redirect(308, "/reply-method");
  });

  app.all("/reply-method", (req, res) => {
    res.send(`method=${req.method.toLowerCase()}`);
  });

  app.get("/smudgie", (req, res) => {
    res.send("smudgie");
  });

  app.get("/relative", (req, res) => {
    res.redirect("smudgie");
  });

  app.get("/relative/sub", (req, res) => {
    res.redirect("../smudgie");
  });

  app.get("/header", (req, res) => {
    res.redirect("/header/2");
  });

  app.post("/header", (req, res) => {
    res.redirect("/header/2");
  });

  app.get("/header/2", (req, res) => {
    res.send(Object.fromEntries(req.headers.entries()));
  });

  app.get("/bad-redirect", async (req, res) => {
    try {
      await res.setStatus(307).end();
    } catch (_) {
      // swallow
    }
  });

  const called: any = {};

  app.get("/error/redirect/:id", (req, res) => {
    const { id } = req.params;
    if (!called[id]) {
      called[id] = true;
      res.setStatus(500).send("boom");
    } else {
      res.redirect("/movies");
      delete called[id];
    }
  });

  return app;
};

describe("request", function () {
  describe("on redirect", () => {
    it("should not follow by default", async () => {
      const redirects: string[] = [];

      const app = setup();

      await superdeno(app)
        .get("/")
        .on("redirect", (res) => {
          redirects.push(res.headers.location);
        })
        .then((res) => {
          expect(redirects).toEqual([]);
          expect(res.status).toEqual(302);
        });
    });

    it("should follow when redirects are set", (done) => {
      const redirects: string[] = [];

      const app = setup();

      superdeno(app)
        .head("/")
        .redirects(10)
        .on("redirect", (res) => {
          redirects.push(res.headers.location);
        })
        .end((err, res) => {
          try {
            const arr = [];
            arr.push("/movies");
            arr.push("/movies/all");
            arr.push("/movies/all/0");
            expect(redirects).toEqual(arr);
            expect(res.text).toBeFalsy();
            done();
          } catch (e) {
            done(e);
          }
        });
    });

    describe("when set to follow all redirects (e.g. `.redirects(-1)`)", () => {
      it("should retain header fields", (done) => {
        const app = setup();

        superdeno(app)
          .get("/header")
          .set("X-Foo", "bar")
          .redirects(-1)
          .end((err, res) => {
            try {
              expect(res.body).toBeDefined();
              expect(res.body["x-foo"]).toEqual("bar");
              done();
            } catch (e) {
              done(e);
            }
          });
      });

      it("should preserve timeout across redirects", (done) => {
        const app = setup();

        superdeno(app)
          .get("/movies/random")
          .redirects(-1)
          .timeout(100)
          .end(async (err, res) => {
            await allPromises();

            try {
              expect(err).toBeInstanceOf(Error);
              expect(err.timeout).toEqual(100);
              done();
            } catch (e) {
              done(e);
            }
          });
      });

      it("should successfully redirect after retry on error", (done) => {
        const id = Math.random() * 1000000 * Date.now();

        const app = setup();

        superdeno(app)
          .get(`/error/redirect/${id}`)
          .redirects(-1)
          .retry(2)
          .end((err, res) => {
            expect(res.ok).toBeTruthy();
            expect(res.text).toEqual("first movie page");
            done();
          });
      });

      it("should not merge cookies", (done) => {
        const app = setup();

        superdeno(app)
          .get("/cookie-redirect")
          .set("Cookie", "orig=1; replaced=not")
          .redirects(-1)
          .end((err, res) => {
            try {
              expect(err).toBeNull();
              expect(res.text).toMatch(/orig=1/);
              expect(res.text).toMatch(/replaced=not/);
              expect(res.text).not.toMatch(/replaced=yes/);
              expect(res.text).not.toMatch(/from-redir=1/);
              done();
            } catch (e) {
              done(e);
            }
          });
      });

      it("should follow Location", (done) => {
        const redirects: string[] = [];

        const app = setup();

        superdeno(app)
          .get("/")
          .redirects(-1)
          .on("redirect", (res) => {
            redirects.push(res.headers.location);
          })
          .end((err, res) => {
            try {
              const arr = ["/movies", "/movies/all", "/movies/all/0"];
              expect(redirects).toEqual(arr);
              expect(res.text).toEqual("first movie page");
              done();
            } catch (e) {
              done(e);
            }
          });
      });

      it("should remove Content-* fields", (done) => {
        const app = setup();

        superdeno(app)
          .post("/header")
          .redirects(-1)
          .type("txt")
          .set("X-Foo", "bar")
          .set("X-Bar", "baz")
          .send("hey")
          .end((err, res) => {
            try {
              expect(res.body).not.toBeNull();
              expect(res.body["x-foo"]).toEqual("bar");
              expect(res.body["x-bar"]).toEqual("baz");
              expect(res.body["content-type"]).toBeUndefined();
              expect(res.body["content-length"]).toBeUndefined();
              expect(res.body["transfer-encoding"]).toBeUndefined();
              done();
            } catch (e) {
              done(e);
            }
          });
      });

      it("should not resend query parameters", (done) => {
        const redirects: string[] = [];
        const query: string[] = [];

        const app = setup();

        superdeno(app)
          .get("/?foo=bar")
          .redirects(-1)
          .on("redirect", (res) => {
            query.push(res.headers.query);
            redirects.push(res.headers.location);
          })
          .end((err, res) => {
            try {
              const arr = [];
              arr.push("/movies");
              arr.push("/movies/all");
              arr.push("/movies/all/0");
              expect(redirects).toEqual(arr);
              expect(res.text).toEqual("first movie page");
              expect(query).toEqual(['{"foo":"bar"}', "{}", "{}"]);
              expect(res.headers.query).toEqual("{}");
              done();
            } catch (e) {
              done(e);
            }
          });
      });

      it("should handle no location header", (done) => {
        const app = setup();

        superdeno(app)
          .get("/bad-redirect")
          .redirects(-1)
          .end((err, res) => {
            try {
              expect(err.message).toEqual("No location header for redirect");
              done();
            } catch (e) {
              done(e);
            }
          });
      });

      describe("when relative", () => {
        it("should redirect to a sibling path", (done) => {
          const redirects: string[] = [];

          const app = setup();

          superdeno(app)
            .get("/relative")
            .redirects(-1)
            .on("redirect", (res) => {
              redirects.push(res.headers.location);
            })
            .end((err, res) => {
              try {
                expect(redirects).toEqual(["smudgie"]);
                expect(res.text).toEqual("smudgie");
                done();
              } catch (e) {
                done(e);
              }
            });
        });

        it("should redirect to a parent path", (done) => {
          const redirects: string[] = [];

          const app = setup();

          superdeno(app)
            .get("/relative/sub")
            .redirects(-1)
            .on("redirect", (res) => {
              redirects.push(res.headers.location);
            })
            .end((err, res) => {
              try {
                expect(redirects).toEqual(["../smudgie"]);
                expect(res.text).toEqual("smudgie");
                done();
              } catch (err_) {
                done(err_);
              }
            });
        });
      });
    });
  });

  describe("req.redirects(n)", () => {
    it("should alter the default number of redirects to follow", (done) => {
      const redirects: string[] = [];

      const app = setup();

      superdeno(app)
        .get("/")
        .redirects(2)
        .on("redirect", (res) => {
          redirects.push(res.headers.location);
        })
        .end((err, res) => {
          try {
            const arr = [];
            expect(res.redirect).toBeDefined();
            arr.push("/movies");
            arr.push("/movies/all");
            expect(redirects).toEqual(arr);
            expect(res.statusText).toMatch(/Moved Temporarily|Found/);
            done();
          } catch (e) {
            done(e);
          }
        });
    });
  });

  describe("on POST", () => {
    it("should redirect as GET", async () => {
      const redirects: string[] = [];

      const app = setup();

      return await superdeno(app)
        .post("/movie")
        .send({ name: "Smudgie" })
        .redirects(2)
        .on("redirect", (res) => {
          redirects.push(res.headers.location);
        })
        .then((res) => {
          expect(redirects).toEqual(["/movies/all/0"]);
          expect(res.text).toEqual("first movie page");
        });
    });

    it("using multipart/form-data should redirect as GET", async () => {
      const redirects: string[] = [];

      const app = setup();

      return await superdeno(app)
        .post("/movie")
        .type("form")
        .field("name", "Smudgie")
        .redirects(2)
        .on("redirect", (res) => {
          redirects.push(res.headers.location);
        })
        .then((res) => {
          expect(redirects).toEqual(["/movies/all/0"]);
          expect(res.text).toEqual("first movie page");
        });
    });
  });

  describe("on 303", () => {
    it("should redirect with same method", (done) => {
      const app = setup();

      superdeno(app)
        .put("/redirect-303")
        .send({ msg: "hello" })
        .redirects(1)
        .on("redirect", (res) => {
          expect(res.headers.location).toEqual("/reply-method");
        })
        .end((err, res) => {
          if (err) {
            done(err);

            return;
          }

          expect(res.text).toEqual("method=get");
          done();
        });
    });
  });

  describe("on 307", () => {
    it("should redirect with same method", (done) => {
      const app = setup();

      superdeno(app)
        .put("/redirect-307")
        .send({ msg: "hello" })
        .redirects(1)
        .on("redirect", (res) => {
          expect(res.headers.location).toEqual("/reply-method");
        })
        .end((err, res) => {
          if (err) {
            done(err);

            return;
          }

          expect(res.text).toEqual("method=put");
          done();
        });
    });
  });

  describe("on 308", () => {
    it("should redirect with same method", (done) => {
      const app = setup();

      superdeno(app)
        .put("/redirect-308")
        .send({ msg: "hello" })
        .redirects(1)
        .on("redirect", (res) => {
          expect(res.headers.location).toEqual("/reply-method");
        })
        .end((err, res) => {
          if (err) {
            done(err);
            return;
          }

          expect(res.text).toEqual("method=put");
          done();
        });
    });
  });
});
