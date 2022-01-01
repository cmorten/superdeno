// deno-lint-ignore-file no-explicit-any no-empty-interface no-misused-new ban-types no-this-alias
/**
 * Port of supertest (https://github.com/visionmedia/supertest) for Deno.
 *
 * Types adapted from:
 * - https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/superagent/index.d.ts
 * - https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/supertest/index.d.ts
 */

import type { ListenerLike, ServerLike } from "./types.ts";
import { assertEquals, STATUS_TEXT } from "../deps.ts";
import { superagent } from "./superagent.ts";
import { close } from "./close.ts";
import { isListener, isServer, isStdNativeServer, isString } from "./utils.ts";
import { exposeSham } from "./xhrSham.js";

/**
 * Custom expectation checker.
 */
type ExpectChecker = (res: IResponse) => any;

/**
 * The handler function for callbacks within `end` method.
 */
type CallbackHandler = (err: any, res: IResponse) => void;

type Serializer = (obj: any) => string;

type Parser = (str: string) => any;

type MultipartValueSingle =
  | Blob
  | Uint8Array
  | Deno.Reader
  | string
  | boolean
  | number;

type MultipartValue = MultipartValueSingle | MultipartValueSingle[];

type HeaderValue = string | string[];
type Header = { [key: string]: HeaderValue };

/**
 * An HTTP error with additional properties of:
 * - status
 * - text
 * - method
 * - path
 */
interface HTTPError extends Error {
  status: number;
  text: string;
  method: string;
  path: string;
}

interface XMLHttpRequest {}

export interface IResponse {
  accepted: boolean;
  badRequest: boolean;
  body: any;
  charset: string;
  clientError: boolean;
  error: false | HTTPError;
  files: any;
  forbidden: boolean;
  get(header: string): HeaderValue;
  header: Header;
  headers: Header;
  info: boolean;
  links: object;
  noContent: boolean;
  notAcceptable: boolean;
  notFound: boolean;
  ok: boolean;
  redirect: boolean;
  serverError: boolean;
  status: number;
  statusCode: number;
  statusType: number;
  statusText: string;
  text: string;
  type: string;
  unauthorized: boolean;
  xhr: XMLHttpRequest;
  redirects: string[];
}

export interface IRequest extends Promise<IResponse> {
  /**
   * Initialize a new `Request` with the given `method` and `url`.
   *
   * @param {string} method
   * @param {string} url
   */
  new (method: string, url: string): IRequest;

  agent(agent?: any): this;

  cookies: string;
  method: string;
  url: string;

  abort(): void;
  accept(type: string): this;
  attach(
    field: string,
    file: MultipartValueSingle,
    options?: string | { filename?: string; contentType?: string },
  ): this;
  auth(user: string, pass: string, options?: { type: "basic" | "auto" }): this;
  auth(token: string, options: { type: "bearer" }): this;
  buffer(val?: boolean): this;
  ca(cert: any | any[]): this;
  cert(cert: any | any[]): this;
  clearTimeout(): this;
  disableTLSCerts(): this;
  end(callback?: CallbackHandler): void;
  field(name: string, val: MultipartValue): this;
  field(fields: { [fieldName: string]: MultipartValue }): this;
  get(field: string): string;
  http2(enable?: boolean): this;
  key(cert: any | any[]): this;
  ok(callback: (res: IResponse) => boolean): this;
  on(name: "error", handler: (err: any) => void): this;
  on(name: "progress", handler: (event: ProgressEvent) => void): this;
  on(name: "response", handler: (response: IResponse) => void): this;
  on(name: string, handler: (event: any) => void): this;
  parse(parser: Parser): this;
  part(): this;
  pfx(
    cert: any | any[] | {
      pfx: string | any;
      passphrase: string;
    },
  ): this;
  pipe(stream: any, options?: object): any;
  query(val: object | string): this;
  redirects(n: number): this;
  responseType(type: string): this;
  retry(count?: number, callback?: CallbackHandler): this;
  send(data?: string | object): this;
  serialize(serializer: Serializer): this;
  set(field: object): this;
  set(field: string, val: string): this;
  set(field: "Cookie", val: string[]): this;
  timeout(ms: number | { deadline?: number; response?: number }): this;
  trustLocalhost(enabled?: boolean): this;
  type(val: string): this;
  unset(field: string): this;
  use(fn: Plugin): this;
  withCredentials(): this;
  write(data: string | any, encoding?: string): boolean;
  maxResponseSize(size: number): this;
}

type Plugin = (req: IRequest) => void;

/**
 * Allow us to hang off our internal xhr sham promises without
 * exposing the internals to the consumer.
 */
const SHAM_SYMBOL = Symbol("SHAM_SYMBOL");
exposeSham(SHAM_SYMBOL);

/**
 * Ensures all promises within the xhr sham have completed.
 *
 * @private
 */
async function completeXhrPromises() {
  for (
    const promise of Object.values(
      (window as any)[SHAM_SYMBOL].promises,
    )
  ) {
    if (promise) {
      try {
        await promise;
      } catch (_) {
        // swallow
      }
    }
  }
}

/**
 * The superagent Request class.
 */
const SuperRequest: IRequest = (superagent as any).Request;

/**
 * The SuperDeno Test object extends the methods provided by superagent to provide
 * a high-level abstraction for testing HTTP, while still allowing you to drop down
 * to the lower-level API provided by superagent.
 */
export class Test extends SuperRequest {
  #asserts!: any[];
  #redirects: number;
  #redirectList: string[];
  #server!: ServerLike;

  public app: string | ListenerLike | ServerLike;
  public url: string;

  constructor(
    app: string | ListenerLike | ServerLike,
    method: string,
    path: string,
    host?: string,
    secure: boolean = false,
  ) {
    super(method.toUpperCase(), path);
    this.redirects(0);
    this.#redirects = 0;
    this.#redirectList = [];

    this.app = app;
    this.#asserts = [];

    if (isString(app)) {
      this.url = `${app}${path}`;
    } else {
      if (isStdNativeServer(app)) {
        const listenAndServePromise = app.listenAndServe().catch((err) =>
          close(app, app, err)
        );

        this.#server = {
          async close() {
            try {
              app.close();
              await listenAndServePromise;
            } catch {
              // swallow error
            }
          },
          addrs: app.addrs,
          async listenAndServe() {},
        };
      } else if (isServer(app)) {
        this.#server = app as ServerLike;
      } else if (isListener(app)) {
        secure = false;
        this.#server = (app as ListenerLike).listen(":0");
      } else {
        throw new Error(
          "superdeno is unable to identify or create a valid test server",
        );
      }

      this.url = this.#serverAddress(path, host, secure);
    }
  }

  /**
   * Returns a URL, extracted from a server.
   *
   * @param {string} path
   * @param {?string} host
   * @param {?boolean} secure
   *
   * @returns {string} URL address
   * @private
   */
  #serverAddress = (
    path: string,
    host?: string,
    secure?: boolean,
  ) => {
    const address =
      ("addrs" in this.#server
        ? this.#server.addrs[0]
        : this.#server.listener.addr) as Deno.NetAddr;
    const port = address.port;
    const protocol = secure ? "https" : "http";

    return `${protocol}://${(host || "127.0.0.1")}:${port}${path}`;
  };

  /**
   * Expectations:
   *
   *   .expect(fn)
   *
   * @param {ExpectChecker} callback
   *
   * @returns {Test} for chaining
   * @public
   */
  expect(callback: ExpectChecker): this;
  /**
   * Expectations:
   *
   *   .expect(200)
   *   .expect(200, fn)
   *
   * @param {number} status
   * @param {?CallbackHandler} callback
   *
   * @returns {Test} for chaining
   * @public
   */
  expect(status: number, callback?: CallbackHandler): this;
  /**
   * Expectations:
   *
   *   .expect(200, body)
   *   .expect(200, body, fn)
   *
   * @param {number} status
   * @param {any} body
   * @param {?CallbackHandler} callback
   *
   * @returns {Test} for chaining
   * @public
   */
  expect(status: number, body: any, callback?: CallbackHandler): this;
  /**
   * Expectations:
   *
   *   .expect('Some body')
   *   .expect(/Some body/i)
   *   .expect('Some body', fn)
   *
   * @param {string|RegExp|Object} body
   * @param {?CallbackHandler} callback
   *
   * @returns {Test} for chaining
   * @public
   */
  expect(body: string | RegExp | Object, callback?: CallbackHandler): this;
  /**
   * Expectations:
   *
   *   .expect('Content-Type', 'application/json')
   *   .expect('Content-Type', /application/g', fn)
   *
   * @param {string} field
   * @param {string|RegExp|Object} value
   * @param {?CallbackHandler} callback
   *
   * @returns {Test} for chaining
   * @public
   */
  expect(
    field: string,
    value: string | RegExp | number,
    callback?: CallbackHandler,
  ): this;
  expect(a: any, b?: any, c?: any): this {
    // callback
    if (typeof a === "function") {
      this.#asserts.push(a);
      return this;
    }
    if (typeof b === "function") this.end(b);
    if (typeof c === "function") this.end(c);

    // status
    if (typeof a === "number") {
      this.#asserts.push(this.#assertStatus.bind(this, a));
      // body
      if (typeof b !== "function" && arguments.length > 1) {
        this.#asserts.push(this.#assertBody.bind(this, b));
      }
      return this;
    }

    // header field
    if (typeof b === "string" || typeof b === "number" || b instanceof RegExp) {
      this.#asserts.push(
        this.#assertHeader.bind(this, { name: "" + a, value: b }),
      );
      return this;
    }

    // body
    this.#asserts.push(this.#assertBody.bind(this, a));

    return this;
  }

  #redirect = (res: IResponse, callback?: CallbackHandler): this => {
    const url = res.headers.location as string;

    if (!url) {
      close(this.#server, this.app, undefined, async () => {
        await completeXhrPromises();
        callback?.(new Error("No location header for redirect"), res);
      });

      return this;
    }

    const parsedUrl = new URL(url, this.url);
    const changesOrigin = parsedUrl.host !== new URL(this.url).host;

    let headers = (this as any)._header;

    // implementation of 302 following defacto standard
    if (res.statusCode === 301 || res.statusCode === 302) {
      // strip Content-* related fields in case of POST etc.
      headers = cleanHeader(headers, changesOrigin);

      // force GET
      this.method = this.method === "HEAD" ? "HEAD" : "GET";

      // clear data
      (this as any)._data = null;
    }

    // 303 is always GET
    if (res.statusCode === 303) {
      // strip Content-* related fields in case of POST etc.
      headers = cleanHeader(headers, changesOrigin);

      // force method
      this.method = "GET";

      // clear data
      (this as any)._data = null;
    }

    // 307 preserves method
    // 308 preserves method
    delete headers.host;

    delete (this as any)._formData;

    initHeaders(this);

    (this as any)._endCalled = false;
    this.url = parsedUrl.href;
    (this as any).qs = {};
    (this as any)._query = [];
    this.set(headers);
    (this as any).emit("redirect", res);
    this.#redirectList.push(this.url);

    this.end(callback);

    return this;
  };

  /**
   * Defer invoking superagent's `.end()` until
   * the server is listening.
   *
   * @param {CallbackHandler} fn
   *
   * @returns {Test} for chaining
   * @public
   */
  end(callback?: CallbackHandler): this {
    const self = this;
    const end = SuperRequest.prototype.end;

    end.call(
      self,
      function (err: any, res: any) {
        // Before we close, ensure that we have handled all
        // requested redirects
        const redirect = isRedirect(res?.statusCode);
        const max: number = (self as any)._maxRedirects;

        if (redirect && self.#redirects++ !== max) {
          return self.#redirect(res, callback);
        }

        return close(self.#server, self.app, undefined, async () => {
          await completeXhrPromises();

          // REF: https://github.com/denoland/deno/blob/987716798fb3bddc9abc7e12c25a043447be5280/ext/timers/01_timers.js#L353
          await new Promise((resolve) => setTimeout(resolve, 20));

          self.#assert(err, res, callback);
        });
      },
    );

    return this;
  }

  /**
   * Perform assertions and invoke `fn(err, res)`.
   *
   * @param {HTTPError} [resError]
   * @param {IResponse} res
   * @param {Function} fn
   * @private
   */
  #assert = (resError: HTTPError, res: IResponse, fn?: Function): void => {
    let error;

    if (!res && resError) {
      error = resError;
    }

    // asserts
    for (let i = 0; i < this.#asserts.length && !error; i += 1) {
      error = this.#assertFunction(this.#asserts[i], res);
    }

    // set unexpected superagent error if no other error has occurred.
    if (
      !error && resError instanceof Error &&
      (!res || (resError as any).status !== res.status)
    ) {
      error = resError;
    }

    if (fn) fn.call(this, error || null, res);
  };

  /**
   * Perform assertions on a response body and return an Error upon failure.
   *
   * @param {any} body
   * @param {IResponse} res
   *
   * @returns {?Error}
   * @private
   */
  #assertBody = function (body: any, res: IResponse): Error | void {
    const isRegExp = body instanceof RegExp;

    // parsed
    if (typeof body === "object" && !isRegExp) {
      try {
        assertEquals(body, res.body);
      } catch (_) {
        const a = Deno.inspect(body);
        const b = Deno.inspect(res.body);

        return error(
          `expected ${a} response body, got ${b}`,
          body,
          res.body,
        );
      }
    } else if (body !== res.text) {
      // string
      const a = Deno.inspect(body);
      const b = Deno.inspect(res.text);

      // regexp
      if (isRegExp) {
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
   * @param {any} header
   * @param {IResponse} res
   *
   * @returns {?Error}
   * @private
   */
  #assertHeader = (
    header: { name: string; value: string | number | RegExp },
    res: IResponse,
  ): Error | void => {
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
      if (!fieldExpected.test(actual as string)) {
        return new Error(
          `expected "${field}" matching ${fieldExpected}, got "${actual}"`,
        );
      }
    } else {
      return new Error(
        `expected "${field}" of "${fieldExpected}", got "${actual}"`,
      );
    }
  };

  /**
   * Perform assertions on the response status and return an Error upon failure.
   *
   * @param {number} status
   * @param {IResponse} res
   *
   * @returns {?Error}
   * @private
   */
  #assertStatus = (status: number, res: IResponse): Error | void => {
    if (res.status !== status) {
      const a = STATUS_TEXT.get(status);
      const b = STATUS_TEXT.get(res.status);

      return new Error(`expected ${status} "${a}", got ${res.status} "${b}"`);
    }
  };

  /**
   * Performs an assertion by calling a function and return an Error upon failure.
   *
   * @param {Function} fn
   * @param {IResponse} res
   *
   * @returns {?Error}
   * @private
   */
  #assertFunction = (fn: Function, res: IResponse): Error | void => {
    let err;

    try {
      err = fn(res);
    } catch (e) {
      err = e;
    }

    if (err instanceof Error) return err;
  };
}

/**
 * Return an `Error` with `msg` and results properties.
 *
 * @param {string} msg
 * @param {any} expected
 * @param {any} actual
 *
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

/**
 * Check if we should follow the redirect `code`.
 *
 * @param {number} code
 *
 * @returns {boolean}
 * @private
 */
function isRedirect(code = 0) {
  return [301, 302, 303, 305, 307, 308].includes(code);
}

/**
 * Strip content related fields from `header`.
 *
 * @param {object} header
 *
 * @returns {object} header
 * @private
 */
function cleanHeader(header: Header, changesOrigin: boolean) {
  delete header["content-type"];
  delete header["content-length"];
  delete header["transfer-encoding"];
  delete header.host;

  if (changesOrigin) {
    delete header.authorization;
    delete header.cookie;
  }

  return header;
}

/**
 * Initialize internal header tracking properties on a request instance.
 *
 * @param {object} req the instance
 * @private
 */
function initHeaders(req: any) {
  req._header = {};
  req.header = {};
}
