import type {
  ExpressListenerLike,
  LegacyServerLike,
  ListenerLike,
  NativeServerLike,
  ServerLike,
} from "./types.ts";

export const isString = (thing: unknown): thing is string =>
  typeof thing === "string";

export const isListener = (thing: unknown): thing is ListenerLike =>
  thing instanceof Object && thing !== null && "listen" in thing;

export const isExpressListener = (
  thing: unknown,
): thing is ExpressListenerLike =>
  thing instanceof Object && thing !== null && "locals" in thing &&
  "mountpath" in thing && "all" in thing && "engine" in thing &&
  "listen" in thing && "param" in thing && "path" in thing &&
  "render" in thing && "route" in thing && "set" in thing && "use" in thing;

const isCommonServer = (thing: unknown): thing is ServerLike =>
  thing instanceof Object && thing !== null && "close" in thing;

export const isStdLegacyServer = (thing: unknown): thing is LegacyServerLike =>
  isCommonServer(thing) &&
  "listener" in thing;

export const isStdNativeServer = (thing: unknown): thing is NativeServerLike =>
  isCommonServer(thing) &&
  "addrs" in thing;

export const isExpressServer = (thing: unknown): thing is NativeServerLike =>
  isCommonServer(thing) &&
  "listening" in thing &&
  "address" in thing && typeof thing.address === "function";

export const isServer = (thing: unknown): thing is ServerLike =>
  isStdLegacyServer(thing) || isStdNativeServer(thing) ||
  isExpressServer(thing);
