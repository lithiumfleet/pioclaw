import { sendToLLm } from "../llm/api.ts";
import { Memory } from "../llm/memory.ts";

export function createUserReqHandler() {
  return async (data: { prompt: string }) => {
    try {
      console.log("user: ", data.prompt);

      Memory.addToMemory({ role: "user", content: data.prompt });

      return {
        type: "parsestreamreq",
        data: {
          stream: await sendToLLm(),
        },
      };
    } catch (error) {
      console.error("Error calling DeepSeek API:", error);
    }
  };
}
