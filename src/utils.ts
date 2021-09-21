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

export const isServer = (thing: unknown): thing is ServerLike =>
  thing instanceof Object && thing !== null && "close" in thing;

export const isStdLegacyServer = (thing: unknown): thing is LegacyServerLike =>
  isServer(thing) &&
  "listener" in thing;

export const isStdNativeServer = (thing: unknown): thing is NativeServerLike =>
  isServer(thing) &&
  "addrs" in thing;
