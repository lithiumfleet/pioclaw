import { Memory } from "@src/llm/memory.ts";

export function createLLMResHandler() {
  return (data: { fullText: string; fullReasoningText: string , memory: Memory}) => {
    data.memory.addToMemory({
      role: "assistant",
      content: data.fullText,
      reasoning_content: data.fullReasoningText,
    });
  };
}
