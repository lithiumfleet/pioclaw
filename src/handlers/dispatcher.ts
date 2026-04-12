import { createLLMResHandler } from "./createLLMResHandler.ts";
import { createUserReqHandler } from "./createUserReqHandler.ts";


// register handlers here
export const dispatcher = {
  userreq: createUserReqHandler(),
  llmstreamres: createLLMResHandler(),
};
