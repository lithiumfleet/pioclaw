import { sendToLLm } from "@src/llm/api.ts";
import { Memory } from "@src/llm/memory.ts";

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
