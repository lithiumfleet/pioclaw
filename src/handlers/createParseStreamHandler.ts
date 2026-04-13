import { OpenAI } from "openai/client.mjs";
import { Memory, ToolCall } from "@src/llm/memory.ts";

export function createParseStreamHandler() {
  return parseStreamHandler((s: string) => {
    Deno.stdout.writeSync(new TextEncoder().encode(s));
  });
}

function parseStreamHandler(onChunk?: (chunk: string) => unknown) {
  return async (data: {
    stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;
    memory: Memory;
  }) => {
    const { toolCalls, fullText, fullReasoningText } = await readStream(
      data.stream,
      onChunk,
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

async function readStream(
  stream: AsyncIterable<DeepSeekChunk>,
  onChunk?: (chunk: string) => unknown,
) {
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
      if (onChunk) {
        onChunk(reasoningContent);
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
  return { toolCalls, fullText, fullReasoningText };
}
