import { createLLMResHandler } from "./createLLMResHandler.ts";
import { createParseStreamHandler } from "./createParseStreamHandler.ts";
import { createToolCallHandler } from "./createToolCallHandler.ts";
import { createUserReqHandler } from "./createUserReqHandler.ts";

// register handlers here
export const dispatcher = {
  userreq: createUserReqHandler(),
  llmstreamres: createLLMResHandler(),
  toolcallreq: createToolCallHandler(),
  parsestreamreq: createParseStreamHandler(),
};

export type Dispatcher = typeof dispatcher;

export type Message = {
  [K in keyof Dispatcher]: {
    type: K;
    data: Parameters<Dispatcher[K]>[0];
  };
}[keyof Dispatcher];

type ExtractMessage<T extends Message["type"]> = Extract<Message, {type:T}>

export type InputAbleMessage = ExtractMessage<"userreq">
