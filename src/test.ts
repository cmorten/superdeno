/**
 * Port of supertest (https://github.com/visionmedia/supertest) for Deno
 */

import {
  superagent,
  Server,
  STATUS_TEXT,
  assertEquals,
  util,
} from "../deps.ts";
import { Listener } from "./types.ts";
import { close } from "./close.ts";
import { isServer, isListener, isString } from "./utils.ts";
import { XMLHttpRequestSham } from "./xhrSham.js";

(window as any).XMLHttpRequest = XMLHttpRequestSham;

const SuperRequest = (superagent as any).Request;

export class Test extends SuperRequest {
  private _asserts!: any[];
  private _server!: Server;
  public app!: string | Listener | Server;
  public url!: string;

  constructor(
    app: string | Listener | Server,
    method: string,
    path: string,
    host?: string,
    secure: boolean = false,
  ) {
    super(method.toUpperCase(), path);
    this.redirects(0);

    this.app = app;
    this._asserts = [];

    if (isString(app)) {
      this.url = `${app}${path}`;
    } else {
      if (isServer(app)) {
        this._server = app as Server;
      } else if (isListener(app)) {
        secure = false;
        this._server = (app as Listener).listen({ port: 0 });
      } else {
        throw new Error(
          "superdeno is unable to identify or create a valid test server",
        );
      }

      this.url = this.serverAddress(path, host, secure);
    }
  }

  /**
   * Returns a URL, extracted from a server.
   *
   * @param {Listener|Server} app
   * @param {String} path
   * @returns {String} URL address
   * @private
   */
  serverAddress(
    path: string,
    host?: string,
    secure?: boolean,
  ) {
    const address = this._server.listener.addr as Deno.NetAddr;
    const port = address.port;
    const protocol = secure ? "https" : "http";

    return `${protocol}://${(host || "127.0.0.1")}:${port}${path}`;
  }

  /**
   * Expectations:
   *
   *   .expect(200)
   *   .expect(200, fn)
   *   .expect(200, body)
   *   .expect('Some body')
   *   .expect('Some body', fn)
   *   .expect('Content-Type', 'application/json')
   *   .expect('Content-Type', 'application/json', fn)
   *   .expect(fn)
   *
   * @returns {Test} for chaining
   * @public
   */
  expect(a: any, b: any, c: any): this {
    // callback
    if (typeof a === "function") {
      this._asserts.push(a);
      return this;
    }
    if (typeof b === "function") this.end(b);
    if (typeof c === "function") this.end(c);

    // status
    if (typeof a === "number") {
      this._asserts.push(this._assertStatus.bind(this, a));
      // body
      if (typeof b !== "function" && arguments.length > 1) {
        this._asserts.push(this._assertBody.bind(this, b));
      }
      return this;
    }

    // header field
    if (typeof b === "string" || typeof b === "number" || b instanceof RegExp) {
      this._asserts.push(
        this._assertHeader.bind(this, { name: "" + a, value: b }),
      );
      return this;
    }

    // body
    this._asserts.push(this._assertBody.bind(this, a));

    return this;
  }

  /**
   * Defer invoking superagent's `.end()` until
   * the server is listening.
   *
   * @param {Function} fn
   * @returns {Test} for chaining
   * @public
   */
  end(fn: Function): this {
    const self = this;
    const server = this._server;
    const app = this.app;
    const end = SuperRequest.prototype.end;

    end.call(
      this,
      async (err: any, res: any) => {
        return await close(server, app, undefined, async () => {
          for (
            const promise of Object.values(
              (window as any)._xhrSham.promises,
            )
          ) {
            if (promise) {
              try {
                await promise;
                // Handled in the sham, we just want to make sure it's
                // definitely done.
              } catch (_) {}
            }
          }

          self.assert(err, res, fn);
        });
      },
    );

    return this;
  }

  /**
   * Perform assertions and invoke `fn(err, res)`.
   *
   * @param {Error} [resError]
   * @param {Function} res
   * @param {Function} fn
   * @private
   */
  assert(resError: Error, res: any, fn: Function): void {
    let error;

    if (!res && resError) {
      error = resError;
    }

    for (let i = 0; i < this._asserts.length && !error; i += 1) {
      error = this._assertFunction(this._asserts[i], res);
    }

    if (!error && resError) {
      error = resError;
    }

    fn.call(this, error || null, res);
  }

  /**
   * Perform assertions on a response body and return an Error upon failure.
   *
   * @param {Mixed} body
   * @param {Response} res
   * @returns {?Error}
   * @private
   */
  _assertBody = function (body: any, res: any): Error | void {
    const isregexp = body instanceof RegExp;

    // parsed
    if (typeof body === "object" && !isregexp) {
      try {
        assertEquals(body, res.body);
      } catch (err) {
        const a = (util as any).inspect(body);
        const b = (util as any).inspect(res.body);

        return error(
          `expected ${a} response body, got ${b}`,
          body,
          res.body,
        );
      }
    } else if (body !== res.text) {
      // string
      const a = (util as any).inspect(body);
      const b = (util as any).inspect(res.text);

      // regexp
      if (isregexp) {
        if (!body.test(res.text)) {
          return error(
            `expected body ${b} to match ${body}`,
            body,
            res.body,
          );
        }
      } else {
        return error(
          `expected ${a} response body, got ${b}`,
          body,
          res.body,
        );
      }
    }
  };

  /**
   * Perform assertions on a response header and return an Error upon failure.
   *
   * @param {Object} header
   * @param {Response} res
   * @returns {?Error}
   * @private
   */
  _assertHeader(header: any, res: any): Error | void {
    const field = header.name;
    const actual = res.headers[field.toLowerCase()];
    const fieldExpected = header.value;

    if (typeof actual === "undefined") {
      return new Error(`expected "${field}" header field`);
    }

    // This check handles header values that may be a String or single element Array
    if (
      (Array.isArray(actual) && actual.toString() === fieldExpected) ||
      fieldExpected === actual
    ) {
      return;
    }

    if (fieldExpected instanceof RegExp) {
      if (!fieldExpected.test(actual)) {
        return new Error(
          `expected "${field}" matching ${fieldExpected}, got "${actual}"`,
        );
      }
    } else {
      return new Error(
        `expected "${field}" of "${fieldExpected}", got "${actual}"`,
      );
    }
  }

  /**
   * Perform assertions on the response status and return an Error upon failure.
   *
   * @param {Number} status
   * @param {Response} res
   * @returns {?Error}
   * @private
   */
  _assertStatus(status: number, res: any): Error | void {
    if (res.status !== status) {
      const a = STATUS_TEXT.get(status);
      const b = STATUS_TEXT.get(res.status);

      return new Error(`expected ${status} "${a}", got ${res.status} "${b}"`);
    }
  }

  /**
   * Performs an assertion by calling a function and return an Error upon failure.
   *
   * @param {Function} fn
   * @param {Response} res
   * @returns {?Error}
   * @private
   */
  _assertFunction(fn: Function, res: any): Error | void {
    let err;

    try {
      err = fn(res);
    } catch (e) {
      err = e;
    }

    if (err instanceof Error) return err;
  }
}

/**
 * Return an `Error` with `msg` and results properties.
 *
 * @param {String} msg
 * @param {Mixed} expected
 * @param {Mixed} actual
 * @returns {Error}
 * @private
 */
function error(msg: string, expected: any, actual: any): Error {
  const err = new Error(msg);

  (err as any).expected = expected;
  (err as any).actual = actual;
  (err as any).showDiff = true;

  return err;
}
