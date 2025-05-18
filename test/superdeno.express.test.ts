import { getFreePort } from "../deps.ts";
import { expect, express } from "./deps.ts";
import { describe, it, random } from "./utils.ts";
import { superdeno, Test } from "../mod.ts";
import type { AddressInfo } from "node:net";

const { json } = express;

describe("superdeno(url)", () => {
  it("superdeno(url): should support `superdeno(url)`", async (done) => {
    const app = express();

    app.get("/", (_req, res) => {
      res.send("hello");
    });

    const freePort = await getFreePort(random(1024, 49151));
    const server = app.listen(freePort);
    const address = server.address();
    const url = `http://localhost:${(address as AddressInfo).port}`;

    superdeno(url)
      .get("/")
      .expect("hello", () => {
        server.close();
        done();
      });
  });

  describe(".end(cb)", () => {
    it("superdeno(url): .end(cb): should set `this` to the test object when calling the `cb` in `.end(cb)`", async (done) => {
      const app = express();

      app.get("/", (_req, res) => {
        res.send("hello");
      });

      const freePort = await getFreePort(random(1024, 49151));
      const server = app.listen(freePort);
      const address = server.address();
      const url = `http://localhost:${(address as AddressInfo).port}`;

      const test = superdeno(url).get("/");

      test.end(function (this: Test, _err, _res) {
        expect(test).toEqual(this);
        server.close();
        done();
      });
    });
  });
});

describe("superdeno(app)", () => {
  it("superdeno(app): should fire up the app on an ephemeral port", (done) => {
    const app = express();

    app.get("/", (_req, res) => {
      res.send("hey");
    });

    superdeno(app)
      .get("/")
      .end((_err, res) => {
        expect(res.status).toEqual(200);
        expect(res.text).toEqual("hey");
        done();
      });
  });

  it("superdeno(app): should work with an active server", async (done) => {
    const app = express();

    app.get("/", (_req, res) => {
      res.send("hey");
    });

    const freePort = await getFreePort(random(1024, 49151));
    const server = app.listen(freePort);

    superdeno(server)
      .get("/")
      .end((_err, res) => {
        expect(res.status).toEqual(200);
        expect(res.text).toEqual("hey");
        done();
      });
  });

  it("superdeno(app): should work with remote server", async (done) => {
    const app = express();

    app.get("/", (_req, res) => {
      res.send("hey");
    });

    const freePort = await getFreePort(random(1024, 49151));
    const server = app.listen(freePort);

    superdeno(`http://localhost:${freePort}`)
      .get("/")
      .end((err, res) => {
        if (err) throw err;
        expect(res.status).toEqual(200);
        expect(res.text).toEqual("hey");
        server.close();
        done();
      });
  });

  it("superdeno(app): should work with .send() on POST", (done) => {
    const app = express();

    app.use(json());

    app.post("/", (req, res) => {
      res.send(req.body.name);
    });

    superdeno(app)
      .post("/")
      .send({ name: "john" })
      .expect("john", done);
  });

  it("superdeno(app): should handle headers correctly", (done) => {
    const app = express();

    app.get("/", (_req, res) => {
      res.cookie("foo", "bar");
      res.cookie("user", "deno");
      res.append("Set-Cookie", "fizz=buzz");
      res.set("X-Tested-With", "SuperDeno");
      res.type("application/json");
      res.send();
    });

    superdeno(app)
      .get("/")
      .expect("content-length", "0")
      .expect("content-type", "application/json; charset=utf-8")
      .expect("set-cookie", "foo=bar; Path=/, user=deno; Path=/, fizz=buzz")
      .expect("x-powered-by", "Express")
      .expect("x-tested-with", "SuperDeno")
      .expect(200, done);
  });

  it("superdeno(app): should work when unbuffered", (done) => {
    const app = express();

    app.get("/", (_req, res) => {
      res.send("Hello");
    });

    superdeno(app)
      .get("/")
      .expect("Hello", done);
  });

  it("superdeno(app): should default redirects to 0", (done) => {
    const app = express();

    app.get("/", (_req, res) => {
      res.redirect("/login");
    });

    superdeno(app)
      .get("/")
      .expect(302, done);
  });

  it("superdeno(app): promise form: should default redirects to 0", async () => {
    const app = express();

    app.get("/", (_req, res) => {
      res.redirect("/login");
    });

    await superdeno(app)
      .get("/")
      .expect(302);
  });

  it(
    "superdeno(app): .redirects(n): should handle intermediate redirects",
    (done) => {
      const app = express();

      app.get("/login", (_req, res) => {
        res.send("Login");
      });

      app.get("/redirect", (_req, res) => {
        res.redirect("/login");
      });

      app.get("/", (_req, res) => {
        res.redirect("/redirect");
      });

      superdeno(app)
        .get("/")
        .redirects(1)
        .expect(302, done);
    },
  );

  it("superdeno(app): .redirects(n): promise form: should handle intermediate redirects", async () => {
    const app = express();

    app.get("/login", (_req, res) => {
      res.send("Login");
    });

    app.get("/redirect", (_req, res) => {
      res.redirect("/login");
    });

    app.get("/", (_req, res) => {
      res.redirect("/redirect");
    });

    await superdeno(app)
      .get("/")
      .redirects(1)
      .expect(302);
  });

  it("superdeno(app): .redirects(n): should handle full redirects", (done) => {
    const app = express();

    app.get("/login", (_req, res) => {
      res.send("Login");
    });

    app.get("/redirect", (_req, res) => {
      res.redirect("/login");
    });

    app.get("/", (_req, res) => {
      res.redirect("/redirect");
    });

    superdeno(app)
      .get("/")
      .redirects(2)
      .end((_err, res) => {
        expect(res).toBeDefined();
        expect(res.status).toEqual(200);
        expect(res.text).toEqual("Login");
        done();
      });
  });

  it("superdeno(app): .redirects(n): promise form: should handle full redirects", async () => {
    const app = express();

    app.get("/login", (_req, res) => {
      res.send("Login");
    });

    app.get("/redirect", (_req, res) => {
      res.redirect("/login");
    });

    app.get("/", (_req, res) => {
      res.redirect("/redirect");
    });

    const res = await superdeno(app)
      .get("/")
      .redirects(2);

    expect(res).toBeDefined();
    expect(res.status).toEqual(200);
    expect(res.text).toEqual("Login");
  });

  // TODO: figure out the equivalent error scenario for Deno setup
  // it('should handle socket errors', (done) => {
  //   const app = express();

  //   app.get('/', (req, res) => {
  //     res.destroy();
  //   });

  //   superdeno(app)
  //     .get('/')
  //     .end((err) => {
  //       expect(err).toBeDefined();
  //       done();
  //     });
  // });

  describe(".end(fn)", () => {
    it("superdeno(app): .end(fn): should close server", (done) => {
      const app = express();

      app.get("/", (_req, res) => {
        res.send("superdeno FTW!");
      });

      let doneCount = 0;

      superdeno(app)
        .get("/")
        .end(() => {
          doneCount++;

          if (doneCount === 2) {
            done();
          }
        });

      app.on("close", () => {
        doneCount++;

        if (doneCount === 2) {
          done();
        }
      });
    });

    it("superdeno(app): .end(fn): should wait for server to close before invoking fn", (done) => {
      const app = express();
      let closed = false;

      app.get("/", (_req, res) => {
        res.send("superdeno FTW!");
      });

      superdeno(app)
        .get("/")
        .end(() => {
          expect(closed).toBeTruthy();
          done();
        });

      app.on("close", () => {
        closed = true;
      });
    });

    it("superdeno(app): .end(fn): should support nested requests", (done) => {
      const app = express();
      const test = superdeno(app);

      app.get("/", (_req, res) => {
        res.send("superdeno FTW!");
      });

      test
        .get("/")
        .end(() => {
          test
            .get("/")
            .end((err, res) => {
              expect(err).toBeNull();
              expect(res.status).toEqual(200);
              expect(res.text).toEqual("superdeno FTW!");
              done();
            });
        });
    });

    it("superdeno(app): .end(fn): should include the response in the error callback", (done) => {
      const app = express();

      app.get("/", (_req, res) => {
        res.send("whatever");
      });

      superdeno(app)
        .get("/")
        .expect(() => {
          throw new Error("Some error");
        })
        .end((err, res) => {
          expect(err).toBeDefined();
          expect(res).toBeDefined();
          // Duck-typing response, just in case.
          expect(res.status).toEqual(200);
          done();
        });
    });

    it("superdeno(app): .end(fn): should set `this` to the test object when calling the error callback", (done) => {
      const app = express();

      app.get("/", (_req, res) => {
        res.send("whatever");
      });

      const test = superdeno(app).get("/");

      test.expect(() => {
        throw new Error("Some error");
      }).end(function (this: Test, err, _res) {
        expect(err).toBeDefined();
        expect(this).toEqual(test);
        done();
      });
    });

    it("superdeno(app): .end(fn): should handle an undefined Response", (done) => {
      const app = express();

      let timeoutPromise: Promise<unknown>;

      app.get("/", async (_req, res) => {
        timeoutPromise = new Promise((resolve) => {
          setTimeout(async () => {
            try {
              await res.send();
            } catch (_) {
              // swallow
            }

            resolve(true);
          }, 20);
        });

        await timeoutPromise;
      });

      const server = app.listen();
      const address = server.address();
      const url = `http://localhost:${(address as AddressInfo).port}`;

      superdeno(url).get("/").timeout(1)
        .expect(200, async (err, _res) => {
          expect(err).toBeInstanceOf(Error);
          server.close();
          await timeoutPromise;
          done();
        });
    });
  });

  describe(".expect(status[, fn])", () => {
    it("superdeno(app): .expect(status[, fn]): should assert the response status", (done) => {
      const app = express();

      app.get("/", (_req, res) => {
        res.send("hey");
      });

      superdeno(app)
        .get("/")
        .expect(404)
        .end((err, _res) => {
          expect(err.message).toEqual('expected 404 "Not Found", got 200 "OK"');
          done();
        });
    });
  });

  describe(".expect(status)", () => {
    it("superdeno(app): .expect(status): should assert only status", (done) => {
      const app = express();

      app.get("/", (_req, res) => {
        res.send("hey");
      });

      superdeno(app)
        .get("/")
        .expect(200)
        .end(done);
    });

    it("superdeno(app): .expect(status): should assert only error status'", (done) => {
      const app = express();

      app.get("/", (_req, res) => {
        res.sendStatus(400);
      });

      superdeno(app)
        .get("/")
        .expect(400)
        .end(done);
    });
  });

  describe(".expect(status, body[, fn])", () => {
    it("superdeno(app): .expect(status, body[, fn]): should assert the response body and status", (done) => {
      const app = express();

      app.get("/", (_req, res) => {
        res.send("foo");
      });

      superdeno(app)
        .get("/")
        .expect(200, "foo", done);
    });

    it("superdeno(app): .expect(status, body[, fn]): should assert the response body and error status'", (done) => {
      const app = express();

      app.get("/", (_req, res) => {
        res.status(400).send("foo");
      });

      superdeno(app)
        .get("/")
        .expect(400, "foo", done);
    });

    describe("when the body argument is an empty string", () => {
      it("superdeno(app): .expect(status, body[, fn]): should not quietly pass on failure", (done) => {
        const app = express();

        app.get("/", (_req, res) => {
          res.send("foo");
        });

        superdeno(app)
          .get("/")
          .expect(200, "")
          .end((err, _res) => {
            expect(err.message).toEqual('expected "" response body, got "foo"');
            done();
          });
      });
    });
  });

  describe(".expect(body[, fn])", () => {
    it("superdeno(app): .expect(body[, fn]): should assert the response body", (done) => {
      const app = express();

      app.set("json spaces", 0);

      app.get("/", (_req, res) => {
        res.send({ foo: "bar" });
      });

      superdeno(app)
        .get("/")
        .expect("hey")
        .end((err, _res) => {
          expect(err.message).toEqual(
            'expected "hey" response body, got \'{"foo":"bar"}\'',
          );
          done();
        });
    });

    it("superdeno(app): .expect(body[, fn]): should assert the status before the body", (done) => {
      const app = express();

      app.set("json spaces", 0);

      app.get("/", (_req, res) => {
        res.status(500).send({ message: "something went wrong" });
      });

      superdeno(app)
        .get("/")
        .expect(200)
        .expect("hey")
        .end((err, _res) => {
          expect(err.message).toEqual(
            'expected 200 "OK", got 500 "Internal Server Error"',
          );
          done();
        });
    });

    it("superdeno(app): .expect(body[, fn]): should assert the response text", (done) => {
      const app = express();

      app.set("json spaces", 0);

      app.get("/", (_req, res) => {
        res.send({ foo: "bar" });
      });

      superdeno(app)
        .get("/")
        .expect('{"foo":"bar"}', done);
    });

    it("superdeno(app): .expect(body[, fn]): should assert the parsed response body", (done) => {
      const app = express();

      app.set("json spaces", 0);

      app.get("/", (_req, res) => {
        res.send({ foo: "bar" });
      });

      superdeno(app)
        .get("/")
        .expect({ foo: "baz" })
        .end((err, _res) => {
          expect(err.message).toEqual(
            'expected { foo: "baz" } response body, got { foo: "bar" }',
          );

          superdeno(app)
            .get("/")
            .expect({ foo: "bar" })
            .end(done);
        });
    });

    it("superdeno(app): .expect(body[, fn]): should test response object types", (done) => {
      const app = express();
      app.get("/", (_req, res) => {
        res.status(200).json({ stringValue: "foo", numberValue: 3 });
      });

      superdeno(app)
        .get("/")
        .expect({ stringValue: "foo", numberValue: 3 }, done);
    });

    it("superdeno(app): .expect(body[, fn]): should deep test response object types", (done) => {
      const app = express();
      app.get("/", (_req, res) => {
        res.status(200)
          .json(
            {
              stringValue: "foo",
              numberValue: 3,
              nestedObject: { innerString: "5" },
            },
          );
      });

      superdeno(app)
        .get("/")
        .expect(
          {
            stringValue: "foo",
            numberValue: 3,
            nestedObject: { innerString: 5 },
          },
        )
        .end((err, _res) => {
          expect(err.message).toEqual(
            'expected {\n  stringValue: "foo",\n  numberValue: 3,\n  nestedObject: { innerString: 5 }\n} response body, got {\n  stringValue: "foo",\n  numberValue: 3,\n  nestedObject: { innerString: "5" }\n}',
          ); // eslint-disable-line max-len

          superdeno(app)
            .get("/")
            .expect(
              {
                stringValue: "foo",
                numberValue: 3,
                nestedObject: { innerString: "5" },
              },
            )
            .end(done);
        });
    });

    it("superdeno(app): .expect(body[, fn]): should support regular expressions", (done) => {
      const app = express();

      app.get("/", (_req, res) => {
        res.send("foobar");
      });

      superdeno(app)
        .get("/")
        .expect(/^bar/)
        .end((err, _res) => {
          expect(err.message).toEqual('expected body "foobar" to match /^bar/');
          done();
        });
    });

    it("superdeno(app): .expect(body[, fn]): should assert response body multiple times", (done) => {
      const app = express();

      app.get("/", (_req, res) => {
        res.send("hey deno");
      });

      superdeno(app)
        .get("/")
        .expect(/deno/)
        .expect("hey")
        .expect("hey deno")
        .end((err, _res) => {
          expect(err.message).toEqual(
            'expected "hey" response body, got "hey deno"',
          );
          done();
        });
    });

    it("superdeno(app): .expect(body[, fn]): should assert response body multiple times with no exception", (done) => {
      const app = express();

      app.get("/", (_req, res) => {
        res.send("hey deno");
      });

      superdeno(app)
        .get("/")
        .expect(/deno/)
        .expect(/^hey/)
        .expect("hey deno", done);
    });
  });

  describe(".expect(field, value[, fn])", () => {
    it("superdeno(app): .expect(field, value[, fn]): should assert the header field presence", (done) => {
      const app = express();

      app.get("/", (_req, res) => {
        res.send({ foo: "bar" });
      });

      superdeno(app)
        .get("/")
        .expect("Content-Foo", "bar")
        .end((err, _res) => {
          expect(err.message).toEqual('expected "Content-Foo" header field');
          done();
        });
    });

    it("superdeno(app): .expect(field, value[, fn]): should assert the header field value", (done) => {
      const app = express();

      app.get("/", (_req, res) => {
        res.send({ foo: "bar" });
      });

      superdeno(app)
        .get("/")
        .expect("Content-Type", "text/html")
        .end((err, _res) => {
          expect(err.message).toEqual(
            'expected "Content-Type" of "text/html", ' +
              'got "application/json; charset=utf-8"',
          );
          done();
        });
    });

    it(
      "superdeno(app): .expect(field, value[, fn]): should assert multiple fields",
      (done) => {
        const app = express();

        app.get("/", (_req, res) => {
          res.send("hey");
        });

        superdeno(app)
          .get("/")
          .expect("Content-Type", "text/html; charset=utf-8")
          .expect("Content-Length", "3")
          .end(done);
      },
      // TODO: Content-Length header is getting lost somewhere in the Deno node:http polyfill
      { ignore: true },
    );

    it("superdeno(app): .expect(field, value[, fn]): should support regular expressions", (done) => {
      const app = express();

      app.get("/", (_req, res) => {
        res.send("hey");
      });

      superdeno(app)
        .get("/")
        .expect("Content-Type", /^application/)
        .end((err) => {
          expect(err.message).toEqual(
            'expected "Content-Type" matching /^application/, ' +
              'got "text/html; charset=utf-8"',
          );
          done();
        });
    });

    it(
      "superdeno(app): .expect(field, value[, fn]): should support numbers",
      (done) => {
        const app = express();

        app.get("/", (_req, res) => {
          res.send("hey");
        });

        superdeno(app)
          .get("/")
          .expect("Content-Length", 4)
          .end((err) => {
            expect(err.message).toEqual(
              'expected "Content-Length" of "4", got "3"',
            );
            done();
          });
      },
      // TODO: Content-Length header is getting lost somewhere in the Deno node:http polyfill
      { ignore: true },
    );

    describe("handling arbitrary expect functions", () => {
      const app = express();
      app.get("/", (_req, res) => {
        res.send("hey");
      });

      it("superdeno(app): .expect(field, value[, fn]): reports errors", (done) => {
        superdeno(app).get("/")
          .expect((_res) => {
            throw new Error("failed");
          })
          .end((err) => {
            expect(err.message).toEqual("failed");
            done();
          });
      });

      it(
        "superdeno(app): .expect(field, value[, fn]): ensures truthy non-errors returned from asserts are not promoted to errors",
        (done) => {
          superdeno(app).get("/")
            .expect((_res) => {
              return "some descriptive error";
            })
            .end((err) => {
              expect(err).toBeNull();
              done();
            });
        },
      );

      it("superdeno(app): .expect(field, value[, fn]): ensures truthy errors returned from asserts are throw to end", (done) => {
        superdeno(app).get("/")
          .expect((_res) => {
            return new Error("some descriptive error");
          })
          .end((err) => {
            expect(err.message).toEqual("some descriptive error");
            expect(err).toBeInstanceOf(Error);
            done();
          });
      });

      it("superdeno(app): .expect(field, value[, fn]): doesn't create false negatives", (done) => {
        superdeno(app).get("/")
          .expect((_res) => {
          })
          .end(done);
      });

      it("superdeno(app): .expect(field, value[, fn]): handles multiple asserts", (done) => {
        const calls: number[] = [];

        superdeno(app).get("/")
          .expect((_res) => {
            calls[0] = 1;
          })
          .expect((_res) => {
            calls[1] = 1;
          })
          .expect((_res) => {
            calls[2] = 1;
          })
          .end(() => {
            const callCount = [0, 1, 2].reduce((count, i) => {
              return count + calls[i];
            }, 0);
            expect(callCount).toEqual(3);
            done();
          });
      });

      it("superdeno(app): .expect(field, value[, fn]): plays well with normal assertions - no false positives", (done) => {
        superdeno(app).get("/")
          .expect((_res) => {
          })
          .expect("Content-Type", /json/)
          .end((err) => {
            expect(err.message).toMatch(/Content-Type/);
            done();
          });
      });

      it("superdeno(app): .expect(field, value[, fn]): plays well with normal assertions - no false negatives", (done) => {
        superdeno(app).get("/")
          .expect((_res) => {
          })
          .expect("Content-Type", /html/)
          .expect((_res) => {
          })
          .expect("Content-Type", /text/)
          .end(done);
      });
    });

    describe("handling multiple assertions per field", () => {
      it("superdeno(app): .expect(field, value[, fn]): should work", (done) => {
        const app = express();
        app.get("/", (_req, res) => {
          res.send("hey");
        });

        superdeno(app)
          .get("/")
          .expect("Content-Type", /text/)
          .expect("Content-Type", /html/)
          .end(done);
      });

      it("superdeno(app): .expect(field, value[, fn]): should return an error if the first one fails", (done) => {
        const app = express();
        app.get("/", (_req, res) => {
          res.send("hey");
        });

        superdeno(app)
          .get("/")
          .expect("Content-Type", /bloop/)
          .expect("Content-Type", /html/)
          .end((err) => {
            expect(err.message).toEqual(
              'expected "Content-Type" matching /bloop/, ' +
                'got "text/html; charset=utf-8"',
            );
            done();
          });
      });

      it("superdeno(app): .expect(field, value[, fn]): should return an error if a middle one fails", (done) => {
        const app = express();
        app.get("/", (_req, res) => {
          res.send("hey");
        });

        superdeno(app)
          .get("/")
          .expect("Content-Type", /text/)
          .expect("Content-Type", /bloop/)
          .expect("Content-Type", /html/)
          .end((err) => {
            expect(err.message).toEqual(
              'expected "Content-Type" matching /bloop/, ' +
                'got "text/html; charset=utf-8"',
            );
            done();
          });
      });

      it("superdeno(app): .expect(field, value[, fn]): should return an error if the last one fails", (done) => {
        const app = express();
        app.get("/", (_req, res) => {
          res.send("hey");
        });

        superdeno(app)
          .get("/")
          .expect("Content-Type", /text/)
          .expect("Content-Type", /html/)
          .expect("Content-Type", /bloop/)
          .end((err) => {
            expect(err.message).toEqual(
              'expected "Content-Type" matching /bloop/, ' +
                'got "text/html; charset=utf-8"',
            );
            done();
          });
      });
    });
  });
});
