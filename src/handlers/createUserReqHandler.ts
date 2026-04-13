import { sendToLLm } from "../llm/api.ts";
import { Memory } from "../llm/memory.ts";

export function createUserReqHandler() {

  return async (data: { prompt: string }) => {
    try {
      console.log("user: ", data.prompt);
      Memory.addToMemory({ role: "user", content: data.prompt });
      const res = await sendToLLm();
      return {
        type: "llmstreamres",
        data: {
          stream: res,
        },
      };
    } catch (error) {
      console.error("Error calling DeepSeek API:", error);
    }
  };
}
