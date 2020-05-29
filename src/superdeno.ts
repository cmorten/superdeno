import { methods } from "../deps.ts";
import { Test } from "./test.ts";

export const superdeno = (app: any) => {
  const obj: Record<string, any> = {};

  if (typeof app === "function") {}

  methods.forEach((method) => {
    obj[method] = (url: string) => {
      return new Test(app, method, url);
    };
  });
};
