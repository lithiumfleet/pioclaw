import { dispatcher } from "../handlers/dispatcher.ts";

export type Dispatcher = typeof dispatcher;

export type Message = {
  [K in keyof Dispatcher]: {
    type: K;
    data: Parameters<Dispatcher[K]>[0];
  };
}[keyof Dispatcher];

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};