// deno-lint-ignore-file no-this-alias
const decoder = new TextDecoder("utf-8");

let SHAM_SYMBOL = Symbol("SHAM_SYMBOL");

function setupSham(symbol) {
  window[symbol] = window[symbol] || {};
  window[symbol].idSequence = 0;
  window[symbol].promises = {};
}

setupSham(SHAM_SYMBOL);

export const exposeSham = (symbol) => {
  SHAM_SYMBOL = symbol;
  setupSham(SHAM_SYMBOL);
};

/**
 * A polyfill for XMLHttpRequest.
 *
 * Indeed, not ideal that we are polyfilling something that
 * we want to disappear with a newer technology. We need to
 * port superagent before can do anything about that though.
 */
export class XMLHttpRequestSham {
  constructor() {
    this.id = (++window[SHAM_SYMBOL].idSequence).toString(36);
    this.origin = null;
    this.onreadystatechange = () => {};
    this.readyState = 0;
    this.responseText = null;
    this.responseType = null;
    this.response = null;
    this.status = null;
    this.statusCode = null;
    this.statusText = null;
    this.aborted = false;
    this.options = {
      requestHeaders: {},
    };
    this.controller = new AbortController();
  }

  open(method, url, async, username, password) {
    if (async === false) throw "only asynchronous behavior is supported";

    const resolvedUrl = this.resolveUrl(url);
    this.origin = this.getOrigin(resolvedUrl);
    this.options.method = method;
    this.options.url = url;
    this.options.username = username;
    this.options.password = password;
  }

  async send(body) {
    const self = this;
    self.options.requestBody = body;

    try {
      await self.xhrSend(self.options, function (state) {
        return self.xhrReceive(state);
      });
    } catch (err) {
      const message = err.message;
      err.responseText = message;
      err.responseType = "text";
      err.response = err;
      err.body = message;
      err.status = 0;
      err.statusCode = 0;
      err.statusText = message;
      err.readyState = 4;
      self.xhrReceive(err);
    }
  }

  abort() {
    this.aborted = true;
    this.controller.abort();
  }

  setRequestHeader(name, value) {
    const lc = name.toLowerCase();
    this.options.requestHeaders[lc] = value;
  }

  getAllResponseHeaders() {}

  getResponseHeader() {}

  xhrReceive(state) {
    const responseHeaders = state.responseHeaders
      ? this.parseHeaders(state.responseHeaders)
      : {};

    this.readyState = state.readyState;
    this.status = state.status;
    this.statusCode = state.statusCode;
    this.statusText = state.statusText;
    this.response = state.response;
    this.responseType = state.responseType;
    this.responseText = state.responseText;

    this.getAllResponseHeaders = function () {
      return state.responseHeaders;
    };

    this.getResponseHeader = function (name) {
      const lc = name.toLowerCase();
      if (!(lc in responseHeaders)) return undefined;
      return responseHeaders[lc];
    };

    this.onreadystatechange.call(this);
  }

  getOrigin(url) {
    const match = /^(?:\w+\:)?(?:\/\/)([^\/]*)/.exec(url);
    if (!match) throw "invalid url";

    return match[0];
  }

  parseHeaders(headers) {
    let headerIndex, headerName, parsedHeaders;
    let match;

    if (!headers) return {};

    if (typeof headers === "string") {
      headers = headers.split(/\r\n/);
    }

    if (Object.prototype.toString.apply(headers) === "[object Array]") {
      parsedHeaders = {};

      for (headerIndex = headers.length - 1; headerIndex >= 0; headerIndex--) {
        match = /^(.+?)\:\s*(.+)$/.exec(headers[headerIndex]);
        if (match) {
          parsedHeaders[match[1]] = parsedHeaders[match[1]]
            ? [parsedHeaders[match[1]], match[2]].flat(1)
            : match[2];
        }
      }

      headers = parsedHeaders;
      parsedHeaders = null;
    }

    if (typeof headers === "object") {
      parsedHeaders = {};

      for (headerName in headers) {
        parsedHeaders[headerName.toLowerCase()] = parsedHeaders[
            headerName.toLowerCase()
          ]
          ? [parsedHeaders[headerName.toLowerCase()], headers[headerName]].flat(
            1,
          )
          : headers[headerName];
      }

      headers = parsedHeaders;
      parsedHeaders = null;
    }

    return headers;
  }

  resolveUrl(url) {
    return url;
  }

  async xhrSend(options, onStateChange) {
    const self = this;
    const xhr = {};

    xhr.getAllResponseHeaders = function () {
      if (this.headers) {
        let headerStr = "";
        Array.from(new Set(this.headers.keys())).forEach((field) => {
          const value = this.headers.get(field);

          headerStr = headerStr
            ? `${headerStr}\r\n${field}: ${value}`
            : `${field}: ${value}`;
        });

        return headerStr;
      }

      return "";
    };

    xhr.setRequestHeader = function (name, value) {
      const lc = name.toLowerCase();
      options.requestHeaders[lc] = value;
    };

    xhr.onreadystatechange = function () {
      const xhrResponse = this;

      // At the moment, xhr.onreadystatechange() is _always_ called
      // in this implementation. TBC whether this is accurate.
      // To prevent a memory leak we clean up our promise from the
      // cache now that it _must_ be resolved.
      delete window[SHAM_SYMBOL].promises[self.id];

      xhrResponse.responseHeaders = xhrResponse.getAllResponseHeaders();
      onStateChange(xhrResponse);
    };

    xhr.setAbortedResponse = function () {
      // TODO: this needs work.
      //
      // REF: https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest#Properties

      this.readyState = 0;
      this.body = "";
      this.response = "";
      this.responseText = "";
      this.responseType = "";
      this.responseURL = null;
      this.responseXML = null;
      this.status = 0;
      this.statusCode = 0;
      this.statusText = "aborted";
    };

    xhr.setErrorResponse = function (error) {
      const errorMessage = this.message ?? error.message;

      // TODO: this needs work.
      //
      // REF: https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest#Properties

      this.readyState = 4;
      this.body = errorMessage;
      this.response = errorMessage;
      this.responseText = errorMessage;
      this.responseType = "text";
      this.responseURL = null;
      this.responseXML = null;
      this.status = 0;
      this.statusCode = 0;
      this.statusText = errorMessage;
    };

    let headers;
    if (options.requestHeaders) {
      headers = this.parseHeaders(options.requestHeaders);

      for (const headerName in headers) {
        xhr.setRequestHeader(headerName, headers[headerName]);
      }
    }

    let response = {};
    let parsedResponse = "";
    let isJson = false;

    if (this.aborted) {
      // If aborted before even start the fetch then don't bother making
      // the request at all.
      xhr.setAbortedResponse();

      return xhr.onreadystatechange();
    } else {
      try {
        const body = typeof options.requestBody === "object" &&
            !(options.requestBody instanceof FormData) &&
            options.requestBody !== null
          ? JSON.stringify(options.requestBody)
          : options.requestBody;

        // We set the fetch promise into a polyfill promise cache
        // so that superdeno can await these promises before ending.
        // Not doing such results in Deno test complaining of unhandled
        // async operations.
        window[SHAM_SYMBOL].promises[self.id] = fetch(options.url, {
          method: options.method,
          headers: options.requestHeaders,
          body,
          signal: this.controller.signal,
          mode: "cors",
          // Deviations from the fetch spec (https://fetch.spec.whatwg.org/)
          // allow us to implement redirect logic into superdeno
          // via the `manual` redirect setting, which returns a
          // `basic` response instead of a `opaqueredirect` one.
          // REF:
          // - https://github.com/denoland/deno/pull/8353
          // - https://deno.land/manual/runtime/web_platform_apis#spec-deviations
          redirect: "manual",
        });

        // Wait on the response, and then read the buffer.
        response = await window[SHAM_SYMBOL].promises[self.id];

        // Manually transfer over properties, getPropertyDescriptors / prototype access now
        // restricted in Deno. REF: https://github.com/denoland/deno/releases/tag/v1.9.0
        xhr.headers = response.headers;
        xhr.ok = response.ok;
        xhr.redirected = response.redirected;
        xhr.url = response.url;

        // A naive approach to handle the response body. We should really
        // interrogate contentType etc.
        const buf = await response.arrayBuffer();
        parsedResponse = buf === null ? null : decoder.decode(buf);

        // See if the response is JSON.
        try {
          JSON.parse(parsedResponse);
          isJson = true;
        } catch (_) {
          // swallow
        }

        // For when should have already aborted, but our sham implementation
        // isn't quite up to scratch.
        if (this.aborted) {
          xhr.setAbortedResponse();

          return xhr.onreadystatechange();
        }
      } catch (error) {
        // Error because it aborted
        if (this.aborted) {
          xhr.setAbortedResponse();
        } else {
          // Or genuine error
          xhr.setErrorResponse(error);
        }

        return xhr.onreadystatechange();
      }
    }

    // TODO: this needs work.
    //
    // REF: https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest#Properties

    xhr.readyState = 4;
    xhr.body = parsedResponse;
    xhr.response = parsedResponse;
    xhr.responseText = parsedResponse;
    xhr.responseType = isJson ? "" : "text";
    xhr.responseURL = response.url;
    xhr.responseXML = null;
    xhr.status = response.status;
    xhr.statusCode = response.status;
    xhr.statusText = response.statusText;

    xhr.onreadystatechange();
  }
}
