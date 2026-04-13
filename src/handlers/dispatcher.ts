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
