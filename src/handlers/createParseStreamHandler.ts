import { OpenAI } from "openai/client.mjs";
import { Memory, ToolCall } from "@src/llm/memory.ts";
import {
  onChunk,
  onReasoningChunk,
  onToolRes,
} from "@src/handlers/callbacks.ts";

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
// 扩展 OpenAI 的类型定义
interface DeepSeekDelta
  extends OpenAI.Chat.Completions.ChatCompletionChunk.Choice.Delta {
  reasoning_content?: string | null;
}

interface DeepSeekChunk extends OpenAI.Chat.Completions.ChatCompletionChunk {
  choices: (Omit<
    OpenAI.Chat.Completions.ChatCompletionChunk.Choice,
    "delta"
  > & {
    delta: DeepSeekDelta;
  })[];
}

async function readStream(stream: AsyncIterable<DeepSeekChunk>) {
  let fullText = "";
  let fullReasoningText = "";
  const toolCalls: ToolCall[] = [];

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta;
    const content = delta?.content || "";
    const reasoningContent = delta?.reasoning_content || "";

    if (content) {
      fullText += content;
      if (onChunk) {
        onChunk(content);
      }
    }

    if (reasoningContent) {
      fullReasoningText += reasoningContent;
      if (onReasoningChunk) {
        onReasoningChunk(reasoningContent);
      }
    }

    const toolCallDeltas = delta?.tool_calls;
    if (toolCallDeltas) {
      for (const toolCallDelta of toolCallDeltas) {
        const index = toolCallDelta.index || 0;
        if (!toolCalls[index]) {
          toolCalls[index] = {
            id: toolCallDelta.id || "",
            type: "function" as const,
            function: {
              name: toolCallDelta.function?.name || "",
              arguments: toolCallDelta.function?.arguments || "",
            },
          };
        } else {
          if (toolCallDelta.function?.name) {
            toolCalls[index].function.name = toolCallDelta.function.name;
          }
          if (toolCallDelta.function?.arguments) {
            toolCalls[index].function.arguments +=
              toolCallDelta.function.arguments;
          }
          if (toolCallDelta.id) {
            toolCalls[index].id = toolCallDelta.id;
          }
        }
      }
    }
  }
  if (onToolRes && toolCalls.length !== 0) {
    onToolRes(JSON.stringify(toolCalls));
  }
  return { toolCalls, fullText, fullReasoningText };
}
