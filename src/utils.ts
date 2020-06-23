import { Server } from "../deps.ts";

export const isString = (thing: any): boolean => typeof thing === "string";

export const isListener = (thing: any): boolean => thing?.listen;

export const isServer = (thing: any): boolean => thing instanceof Server;

const isReader = (thing: any): boolean => thing?.read;

export const isResponse = (thing: any): boolean => {
  if (typeof thing !== "object") {
    return false;
  } else if (thing.status && typeof thing.status !== "number") {
    return false;
  } else if (thing.headers && !(thing.headers instanceof Headers)) {
    return false;
  } else if (
    thing.body && !(thing.body instanceof Uint8Array) &&
    !isReader(thing.body) && typeof thing.body !== "string"
  ) {
    return false;
  }

  return true;
};
