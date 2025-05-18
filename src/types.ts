// deno-lint-ignore-file no-explicit-any

export interface RequestHandlerLike {
  (
    req: any,
    ...args: any[]
  ): Promise<any> | Promise<void> | any | void;
}

export interface LegacyServerLike {
  listener: Deno.Listener;
  close(): void;
}

export interface LegacyNativeServerLike {
  readonly addrs: Deno.Addr[];
  listenAndServe(): Promise<void>;
  close(): void;
}

export interface NativeServerLike {
  readonly addr: Deno.Addr;
  readonly finished: Promise<void>;
  shutdown(): Promise<void>;
  unref(): void;
}

export interface ExpressServerLike {
  address(): any;
  listening: boolean;
  close(): void;
  once(eventName: string, listener: () => void): void;
}

export type ServerLike =
  | LegacyServerLike
  | LegacyNativeServerLike
  | ExpressServerLike;

export interface ListenerLike {
  listen(addr: string): ServerLike;
}

export interface ExpressListenerLike {
  listen(port: number, callback: () => void): ServerLike;
}
