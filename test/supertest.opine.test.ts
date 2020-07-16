import { Opine, OpineTypes, expect } from "./deps.ts";
import { describe, it } from "./utils.ts";
import { superdeno, Test } from "../mod.ts";

const { opine, json } = Opine;

describe("superdeno(url)", () => {
  it("superdeno(url): should support `superdeno(url)`", (done) => {
    const app = opine();

    app.get("/", (req: OpineTypes.Request, res: OpineTypes.Response) => {
      res.send("hello");
    });

    // Temporary workaround for Deno HTTP dispatcher bug.
    // REF: https://github.com/denoland/deno/issues/6616
    setTimeout(() => {
      const server = app.listen();
      const address = server.listener.addr as Deno.NetAddr;
      const url = `http://localhost:${address.port}`;

      superdeno(url)
        .get("/")
        .expect("hello", () => {
          server.close();
          done();
        });
    });
  });

  describe(".end(cb)", () => {
    it("superdeno(url): .end(cb): should set `this` to the test object when calling the `cb` in `.end(cb)`", (
      done,
    ) => {
      const app = opine();

      app.get("/", (req: OpineTypes.Request, res: OpineTypes.Response) => {
        res.send("hello");
      });

      const server = app.listen(0);
      const address = server.listener.addr as Deno.NetAddr;
      const url = `http://localhost:${address.port}`;

      const test = superdeno(url).get("/");

      test.end(function (this: Test, err, res) {
        expect(test).toEqual(this);
        server.close();
        done();
      });
    });
  });
});

describe("superdeno(app)", () => {
  it("superdeno(app): should fire up the app on an ephemeral port", (done) => {
    const app = opine();

    app.get("/", (req: OpineTypes.Request, res: OpineTypes.Response) => {
      res.send("hey");
    });

    superdeno(app)
      .get("/")
      .end((err, res) => {
        expect(res.status).toEqual(200);
        expect(res.text).toEqual("hey");
        done();
      });
  });

  it("superdeno(app): should work with an active server", (done) => {
    const app = opine();

    app.get("/", (req: OpineTypes.Request, res: OpineTypes.Response) => {
      res.send("hey");
    });

    const server = app.listen(4000);

    superdeno(server)
      .get("/")
      .end((err, res) => {
        expect(res.status).toEqual(200);
        expect(res.text).toEqual("hey");
        done();
      });
  });

  it("superdeno(app): should work with remote server", (done) => {
    const app = opine();

    app.get("/", (req: OpineTypes.Request, res: OpineTypes.Response) => {
      res.send("hey");
    });

    const server = app.listen(4001);
    superdeno("http://localhost:4001")
      .get("/")
      .end((err, res) => {
        expect(res.status).toEqual(200);
        expect(res.text).toEqual("hey");
        server.close();
        done();
      });
  });

  // TODO: https test.
  // it("superdeno(app): should work with a https server", (done) => {
  //   const certFile = "test/fixtures/RootCA.pem";
  //   const keyFile = "test/fixtures/RootCA.key";

  //   const app = opine();

  //   app.get("/", (req: OpineTypes.Request, res: OpineTypes.Response) => {
  //     res.send("hey");
  //   });

  //   const server = app.listen(
  //     { port: 4001, certFile, keyFile },
  //   );

  //   superdeno(server, true)
  //     .get("/")
  //     .end((err, res) => {
  //       if (err) return done(err);
  //       expect(res.status).toEqual(200);
  //       expect(res.text).toEqual("hey");
  //       server.close();
  //       done();
  //     });
  // });

  it("superdeno(app): should work with .send() on POST", (done) => {
    const app = opine();

    app.use(json());

    app.post("/", (req: OpineTypes.Request, res: OpineTypes.Response) => {
      res.send(req.parsedBody.name);
    });

    superdeno(app)
      .post("/")
      .send({ name: "john" })
      .expect("john", done);
  });

  it("superdeno(app): should work with .send() on GET given RFCs 7230-7237", (
    done,
  ) => {
    const app = opine();

    app.use(json());

    app.get("/", (req: OpineTypes.Request, res: OpineTypes.Response) => {
      res.send(req.parsedBody.name);
    });

    superdeno(app)
      .get("/")
      .send({ name: "john" })
      .expect("john", done);
  });

  it("superdeno(app): should handle headers correctly", (done) => {
    const app = opine();

    app.get("/", (req: OpineTypes.Request, res: OpineTypes.Response) => {
      res.cookie({ name: "foo", value: "bar" });
      res.cookie({ name: "user", value: "deno" });
      res.set("Set-Cookie", "fizz=buzz");
      res.set("X-Tested-With", "SuperDeno");
      res.type("application/json");
      res.end();
    });

    superdeno(app)
      .get("/")
      .expect(function (res) {
        expect(res.headers).toEqual({
          "content-length": "0",
          "x-powered-by": "Opine",
          "set-cookie": "foo=bar; Path=/, user=deno; Path=/, fizz=buzz",
          "x-tested-with": "SuperDeno",
          "content-type": "application/json; charset=utf-8",
        });
      })
      .expect(200, done);
  });

  it("superdeno(app): should work when unbuffered", (done) => {
    const app = opine();

    app.get("/", (req: OpineTypes.Request, res: OpineTypes.Response) => {
      res.end("Hello");
    });

    superdeno(app)
      .get("/")
      .expect("Hello", done);
  });

  // TODO: redirect tests once implemented in opine
  // it('should default redirects to 0', (done) => {
  //   const app = opine();

  //   app.get('/', (req: OpineTypes.Request, res: OpineTypes.Response) => {
  //     res.redirect('/login');
  //   });

  //   superdeno(app)
  //     .get('/')
  //     .expect(302, done);
  // });

  // TODO: redirect tests once implemented in opine
  // it('should handle redirects', (done) => {
  //   const app = opine();

  //   app.get('/login', (req: OpineTypes.Request, res: OpineTypes.Response) => {
  //     res.end('Login');
  //   });

  //   app.get('/', (req: OpineTypes.Request, res: OpineTypes.Response) => {
  //     res.redirect('/login');
  //   });

  //   superdeno(app)
  //     .get('/')
  //     .redirects(1)
  //     .end((err, res) => {
  //       should.exist(res);
  //       expect(res.status).toEqual(200);
  //       expect(res.text).toEqual('Login');
  //       done();
  //     });
  // });

  // TODO: figure out the equivalent error scenario for Deno setup
  // it('should handle socket errors', (done) => {
  //   const app = opine();

  //   app.get('/', (req: OpineTypes.Request, res: OpineTypes.Response) => {
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
      const app = opine();

      app.get("/", (req: OpineTypes.Request, res: OpineTypes.Response) => {
        res.send("superdeno FTW!");
      });

      superdeno(app)
        .get("/")
        .end(() => {});

      app.on("close", () => {
        done();
      });
    });

    it("superdeno(app): .end(fn): should wait for server to close before invoking fn", (
      done,
    ) => {
      const app = opine();
      let closed = false;

      app.get("/", (req: OpineTypes.Request, res: OpineTypes.Response) => {
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
      const app = opine();
      const test = superdeno(app);

      app.get("/", (req: OpineTypes.Request, res: OpineTypes.Response) => {
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

    it("superdeno(app): .end(fn): should include the response in the error callback", (
      done,
    ) => {
      const app = opine();

      app.get("/", (req: OpineTypes.Request, res: OpineTypes.Response) => {
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

    it("superdeno(app): .end(fn): should set `this` to the test object when calling the error callback", (
      done,
    ) => {
      const app = opine();

      app.get("/", (req: OpineTypes.Request, res: OpineTypes.Response) => {
        res.send("whatever");
      });

      const test = superdeno(app).get("/");

      test.expect(() => {
        throw new Error("Some error");
      }).end(function (this: Test, err, res) {
        expect(err).toBeDefined();
        expect(this).toEqual(test);
        done();
      });
    });

    it("superdeno(app): .end(fn): should handle an undefined Response", async (
      done,
    ) => {
      const app = opine();

      app.get("/", (req: OpineTypes.Request, res: OpineTypes.Response) => {
        setTimeout(async () => {
          try {
            await res.end();
          } catch (_) {}
        }, 20);
      });

      const server = app.listen();
      const address = server.listener.addr as Deno.NetAddr;
      const url = `http://localhost:${address.port}`;

      superdeno(url).get("/").timeout(1)
        .expect(200, (err, res) => {
          expect(err).toBeInstanceOf(Error);
          server.close();
          done();
        });
    });
  });

  describe(".expect(status[, fn])", () => {
    it("superdeno(app): .expect(status[, fn]): should assert the response status", (
      done,
    ) => {
      const app = opine();

      app.get("/", (req: OpineTypes.Request, res: OpineTypes.Response) => {
        res.send("hey");
      });

      superdeno(app)
        .get("/")
        .expect(404)
        .end((err, res) => {
          expect(err.message).toEqual('expected 404 "Not Found", got 200 "OK"');
          done();
        });
    });
  });

  describe(".expect(status)", () => {
    it("superdeno(app): .expect(status): should assert only status", (done) => {
      const app = opine();

      app.get("/", (req: OpineTypes.Request, res: OpineTypes.Response) => {
        res.send("hey");
      });

      superdeno(app)
        .get("/")
        .expect(200)
        .end(done);
    });

    it("superdeno(app): .expect(status): should assert only error status'", (
      done,
    ) => {
      const app = opine();

      app.get("/", (req: OpineTypes.Request, res: OpineTypes.Response) => {
        res.sendStatus(400);
      });

      superdeno(app)
        .get("/")
        .expect(400)
        .end(done);
    });
  });

  describe(".expect(status, body[, fn])", () => {
    it("superdeno(app): .expect(status, body[, fn]): should assert the response body and status", (
      done,
    ) => {
      const app = opine();

      app.get("/", (req: OpineTypes.Request, res: OpineTypes.Response) => {
        res.send("foo");
      });

      superdeno(app)
        .get("/")
        .expect(200, "foo", done);
    });

    it("superdeno(app): .expect(status, body[, fn]): should assert the response body and error status'", (
      done,
    ) => {
      const app = opine();

      app.get("/", (req: OpineTypes.Request, res: OpineTypes.Response) => {
        res.setStatus(400).send("foo");
      });

      superdeno(app)
        .get("/")
        .expect(400, "foo", done);
    });

    describe("when the body argument is an empty string", () => {
      it("superdeno(app): .expect(status, body[, fn]): should not quietly pass on failure", (
        done,
      ) => {
        const app = opine();

        app.get("/", (req: OpineTypes.Request, res: OpineTypes.Response) => {
          res.send("foo");
        });

        superdeno(app)
          .get("/")
          .expect(200, "")
          .end((err, res) => {
            expect(err.message).toEqual("expected '' response body, got 'foo'");
            done();
          });
      });
    });
  });

  describe(".expect(body[, fn])", () => {
    it("superdeno(app): .expect(body[, fn]): should assert the response body", (
      done,
    ) => {
      const app = opine();

      app.set("json spaces", 0);

      app.get("/", (req: OpineTypes.Request, res: OpineTypes.Response) => {
        res.send({ foo: "bar" });
      });

      superdeno(app)
        .get("/")
        .expect("hey")
        .end((err, res) => {
          expect(err.message).toEqual(
            "expected 'hey' response body, got '{\"foo\":\"bar\"}'",
          );
          done();
        });
    });

    it("superdeno(app): .expect(body[, fn]): should assert the status before the body", (
      done,
    ) => {
      const app = opine();

      app.set("json spaces", 0);

      app.get("/", (req: OpineTypes.Request, res: OpineTypes.Response) => {
        res.setStatus(500).send({ message: "something went wrong" });
      });

      superdeno(app)
        .get("/")
        .expect(200)
        .expect("hey")
        .end((err, res) => {
          expect(err.message).toEqual(
            'expected 200 "OK", got 500 "Internal Server Error"',
          );
          done();
        });
    });

    it("superdeno(app): .expect(body[, fn]): should assert the response text", (
      done,
    ) => {
      const app = opine();

      app.set("json spaces", 0);

      app.get("/", (req: OpineTypes.Request, res: OpineTypes.Response) => {
        res.send({ foo: "bar" });
      });

      superdeno(app)
        .get("/")
        .expect('{"foo":"bar"}', done);
    });

    it("superdeno(app): .expect(body[, fn]): should assert the parsed response body", (
      done,
    ) => {
      const app = opine();

      app.set("json spaces", 0);

      app.get("/", (req: OpineTypes.Request, res: OpineTypes.Response) => {
        res.send({ foo: "bar" });
      });

      superdeno(app)
        .get("/")
        .expect({ foo: "baz" })
        .end((err, res) => {
          expect(err.message).toEqual(
            "expected { foo: 'baz' } response body, got { foo: 'bar' }",
          );

          superdeno(app)
            .get("/")
            .expect({ foo: "bar" })
            .end(done);
        });
    });

    it("superdeno(app): .expect(body[, fn]): should test response object types", (
      done,
    ) => {
      const app = opine();
      app.get("/", (req: OpineTypes.Request, res: OpineTypes.Response) => {
        res.setStatus(200).json({ stringValue: "foo", numberValue: 3 });
      });

      superdeno(app)
        .get("/")
        .expect({ stringValue: "foo", numberValue: 3 }, done);
    });

    it("superdeno(app): .expect(body[, fn]): should deep test response object types", (
      done,
    ) => {
      const app = opine();
      app.get("/", (req: OpineTypes.Request, res: OpineTypes.Response) => {
        res.setStatus(200)
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
        .end((err, res) => {
          expect(err.message).toEqual(
            "expected { stringValue: 'foo',\n  numberValue: 3,\n  nestedObject: { innerString: 5 } } response body, got { stringValue: 'foo',\n  numberValue: 3,\n  nestedObject: { innerString: '5' } }",
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

    it("superdeno(app): .expect(body[, fn]): should support regular expressions", (
      done,
    ) => {
      const app = opine();

      app.get("/", (req: OpineTypes.Request, res: OpineTypes.Response) => {
        res.send("foobar");
      });

      superdeno(app)
        .get("/")
        .expect(/^bar/)
        .end((err, res) => {
          expect(err.message).toEqual("expected body 'foobar' to match /^bar/");
          done();
        });
    });

    it("superdeno(app): .expect(body[, fn]): should assert response body multiple times", (
      done,
    ) => {
      const app = opine();

      app.get("/", (req: OpineTypes.Request, res: OpineTypes.Response) => {
        res.send("hey deno");
      });

      superdeno(app)
        .get("/")
        .expect(/deno/)
        .expect("hey")
        .expect("hey deno")
        .end((err, res) => {
          expect(err.message).toEqual(
            "expected 'hey' response body, got 'hey deno'",
          );
          done();
        });
    });

    it("superdeno(app): .expect(body[, fn]): should assert response body multiple times with no exception", (
      done,
    ) => {
      const app = opine();

      app.get("/", (req: OpineTypes.Request, res: OpineTypes.Response) => {
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
    it("superdeno(app): .expect(field, value[, fn]): should assert the header field presence", (
      done,
    ) => {
      const app = opine();

      app.get("/", (req: OpineTypes.Request, res: OpineTypes.Response) => {
        res.send({ foo: "bar" });
      });

      superdeno(app)
        .get("/")
        .expect("Content-Foo", "bar")
        .end((err, res) => {
          expect(err.message).toEqual('expected "Content-Foo" header field');
          done();
        });
    });

    it("superdeno(app): .expect(field, value[, fn]): should assert the header field value", (
      done,
    ) => {
      const app = opine();

      app.get("/", (req: OpineTypes.Request, res: OpineTypes.Response) => {
        res.send({ foo: "bar" });
      });

      superdeno(app)
        .get("/")
        .expect("Content-Type", "text/html")
        .end((err, res) => {
          expect(err.message).toEqual(
            'expected "Content-Type" of "text/html", ' +
              'got "application/json; charset=utf-8"',
          );
          done();
        });
    });

    it("superdeno(app): .expect(field, value[, fn]): should assert multiple fields", (
      done,
    ) => {
      const app = opine();

      app.get("/", (req: OpineTypes.Request, res: OpineTypes.Response) => {
        res.send("hey");
      });

      superdeno(app)
        .get("/")
        .expect("Content-Type", "text/html; charset=utf-8")
        .expect("Content-Length", "3")
        .end(done);
    });

    it("superdeno(app): .expect(field, value[, fn]): should support regular expressions", (
      done,
    ) => {
      const app = opine();

      app.get("/", (req: OpineTypes.Request, res: OpineTypes.Response) => {
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

    it("superdeno(app): .expect(field, value[, fn]): should support numbers", (
      done,
    ) => {
      const app = opine();

      app.get("/", (req: OpineTypes.Request, res: OpineTypes.Response) => {
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
    });

    describe("handling arbitrary expect functions", () => {
      const app = opine();
      app.get("/", (req: OpineTypes.Request, res: OpineTypes.Response) => {
        res.send("hey");
      });

      it("superdeno(app): .expect(field, value[, fn]): reports errors", (
        done,
      ) => {
        superdeno(app).get("/")
          .expect((res) => {
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
            .expect((res) => {
              return "some descriptive error";
            })
            .end((err) => {
              expect(err).toBeNull();
              done();
            });
        },
      );

      it("superdeno(app): .expect(field, value[, fn]): ensures truthy errors returned from asserts are throw to end", (
        done,
      ) => {
        superdeno(app).get("/")
          .expect((res) => {
            return new Error("some descriptive error");
          })
          .end((err) => {
            expect(err.message).toEqual("some descriptive error");
            expect(err).toBeInstanceOf(Error);
            done();
          });
      });

      it("superdeno(app): .expect(field, value[, fn]): doesn't create false negatives", (
        done,
      ) => {
        superdeno(app).get("/")
          .expect((res) => {
          })
          .end(done);
      });

      it("superdeno(app): .expect(field, value[, fn]): handles multiple asserts", (
        done,
      ) => {
        const calls: number[] = [];

        superdeno(app).get("/")
          .expect((res) => {
            calls[0] = 1;
          })
          .expect((res) => {
            calls[1] = 1;
          })
          .expect((res) => {
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

      it("superdeno(app): .expect(field, value[, fn]): plays well with normal assertions - no false positives", (
        done,
      ) => {
        superdeno(app).get("/")
          .expect((res) => {
          })
          .expect("Content-Type", /json/)
          .end((err) => {
            expect(err.message).toMatch(/Content-Type/);
            done();
          });
      });

      it("superdeno(app): .expect(field, value[, fn]): plays well with normal assertions - no false negatives", (
        done,
      ) => {
        superdeno(app).get("/")
          .expect((res) => {
          })
          .expect("Content-Type", /html/)
          .expect((res) => {
          })
          .expect("Content-Type", /text/)
          .end(done);
      });
    });

    describe("handling multiple assertions per field", () => {
      it("superdeno(app): .expect(field, value[, fn]): should work", (done) => {
        const app = opine();
        app.get("/", (req: OpineTypes.Request, res: OpineTypes.Response) => {
          res.send("hey");
        });

        superdeno(app)
          .get("/")
          .expect("Content-Type", /text/)
          .expect("Content-Type", /html/)
          .end(done);
      });

      it("superdeno(app): .expect(field, value[, fn]): should return an error if the first one fails", (
        done,
      ) => {
        const app = opine();
        app.get("/", (req: OpineTypes.Request, res: OpineTypes.Response) => {
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

      it("superdeno(app): .expect(field, value[, fn]): should return an error if a middle one fails", (
        done,
      ) => {
        const app = opine();
        app.get("/", (req: OpineTypes.Request, res: OpineTypes.Response) => {
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

      it("superdeno(app): .expect(field, value[, fn]): should return an error if the last one fails", (
        done,
      ) => {
        const app = opine();
        app.get("/", (req: OpineTypes.Request, res: OpineTypes.Response) => {
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
