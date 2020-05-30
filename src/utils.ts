import { Server } from "../deps.ts";

export const isString = (thing: any): boolean => typeof thing === "string";

export const isListener = (thing: any): boolean => thing?.listen;

export const isServer = (thing: any): boolean => thing instanceof Server;
