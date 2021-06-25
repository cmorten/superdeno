// deno-lint-ignore-file no-explicit-any
import { superagent as _superagent } from "../deps.ts";
import { XMLHttpRequestSham } from "./xhrSham.js";

function getXHR() {
  return new XMLHttpRequestSham();
}

(_superagent as any).getXHR = getXHR;

export const superagent = _superagent;
