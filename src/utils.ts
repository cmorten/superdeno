import type {
  LegacyServerLike,
  ListenerLike,
  NativeServerLike,
  ServerLike,
} from "./types.ts";

export const isString = (thing: unknown): thing is string =>
  typeof thing === "string";

export const isListener = (thing: unknown): thing is ListenerLike =>
  thing instanceof Object && thing !== null && "listen" in thing;

const isCommonServer = (thing: unknown): thing is ServerLike =>
  thing instanceof Object && thing !== null && "close" in thing;

export const isStdLegacyServer = (thing: unknown): thing is LegacyServerLike =>
  isCommonServer(thing) &&
  "listener" in thing;

export const isStdNativeServer = (thing: unknown): thing is NativeServerLike =>
  isCommonServer(thing) &&
  "addrs" in thing;

export const isServer = (thing: unknown): thing is ServerLike =>
  isStdLegacyServer(thing) || isStdNativeServer(thing);
