import { sendToLLm } from "../core/api.ts";
import { fullContextMemory } from "../core/assets/memory.ts";

export function createUserReqHandler() {

  return async (data: { prompt: string }) => {
    try {
      console.log("user: ", data.prompt);
      fullContextMemory.push({ role: "user", content: data.prompt });
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
