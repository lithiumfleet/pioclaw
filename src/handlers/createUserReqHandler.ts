import { sendToLLm } from "@src/llm/api.ts";
import { Memory } from "@src/llm/memory.ts";

export function createUserReqHandler() {
  return async (data: { prompt: string, memory: Memory }) => {
    try {
      console.log("user: ", data.prompt);

      data.memory.addToMemory({ role: "user", content: data.prompt });

      return {
        type: "parsestreamreq",
        data: {
          stream: await sendToLLm(data.memory),
          memory: data.memory
        },
      };
    } catch (error) {
      console.error("Error calling DeepSeek API:", error);
    }
  };
}
