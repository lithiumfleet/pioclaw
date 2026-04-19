import { OpenAI } from "openai/client.mjs";
import { Memory } from "@src/llm/memory.ts";
import { readStream } from "@src/llm/api.ts";

export function createParseStreamHandler() {
  return async (data: {
    stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;
    memory: Memory;
  }) => {
    const { toolCalls, fullText, fullReasoningText } = await readStream(
      data.stream,
    );

    if (toolCalls.length === 0) {
      return {
        type: "llmstreamres",
        data: {
          fullText,
          fullReasoningText,
          memory: data.memory,
        },
      };
    } else {
      return {
        type: "toolcallreq",
        data: {
          toolCalls,
          memory: data.memory,
        },
      };
    }
  };
}
