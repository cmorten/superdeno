export {
  serve,
  HTTPSOptions,
  HTTPOptions,
  Server,
  Response,
} from "https://deno.land/std@0.66.0/http/server.ts";
export { STATUS_TEXT } from "https://deno.land/std@0.66.0/http/http_status.ts";
export { assertEquals } from "https://deno.land/std@0.66.0/testing/asserts.ts";
export { methods } from "https://deno.land/x/opine@0.21.2/src/methods.ts";
export { mergeDescriptors } from "https://deno.land/x/opine@0.21.2/src/utils/mergeDescriptors.ts";
// TODO: import these as production modules
export { default as util } from "https://dev.jspm.io/npm:util@0.12.3";
export { default as superagent } from "https://dev.jspm.io/npm:superagent@5.3.1";
