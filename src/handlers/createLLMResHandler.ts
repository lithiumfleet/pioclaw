import { OpenAI } from "openai/client.mjs";
import { fullContextMemory, ToolCall } from "./memory.ts";
import { callTool } from "./tools.ts";
import { sendToLLm } from "./api.ts";

export function createLLMResHandler() {
  return LLMStreamResHandler((s: string) => {
    Deno.stdout.writeSync(new TextEncoder().encode(s));
  });
}

function LLMStreamResHandler(onChunk?: (chunk: string) => unknown) {
  return async (data: {
    stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;
  }) => {
    try {
      const { toolCalls, fullText } = await readStream(data.stream, onChunk);

      // 如果没有工具调用，正常处理文本响应
      if (toolCalls.length == 0) {
        fullContextMemory.push({ role: "assistant", content: fullText });
        return;
      }

      console.log("LLM requested tool calls:", toolCalls);
      // 将工具调用添加到内存中
      fullContextMemory.push({
        role: "assistant",
        content: null,
        tool_calls: toolCalls,
      });

      // 执行工具调用
      const results = [];
      for (const toolCall of toolCalls) {
        const { id, type, function: func } = toolCall;

        if (type !== "function") {
          console.warn(`Unsupported tool call type: ${type}`);
          continue;
        }

        console.log(`Calling tool: ${func.name} with args:`, func.arguments);

        let args;
        try {
          args = JSON.parse(func.arguments);
        } catch (_e) {
          console.error(
            `Failed to parse arguments for tool ${func.name}:`,
            func.arguments,
          );
          args = {};
        }

        const result = await callTool(func.name, args);

        results.push({
          tool_call_id: id,
          role: "tool" as const,
          name: func.name,
          content: typeof result === "string" ? result : JSON.stringify(result),
        });
      }

      // 将工具执行结果添加到内存
      for (const result of results) {
        fullContextMemory.push({
          role: "tool",
          tool_call_id: result.tool_call_id,
          content: result.content,
        });
      }

      const res = await sendToLLm();
      return {
        type: "llmstreamres",
        data: {
          stream: res,
        },
      };
    } catch (error) {
      console.error("Error processing stream:", error);
    }
  };
}
// 扩展 OpenAI 的类型定义
interface DeepSeekDelta extends OpenAI.Chat.Completions.ChatCompletionChunk.Choice.Delta {
  reasoning_content?: string | null;
}

interface DeepSeekChunk extends OpenAI.Chat.Completions.ChatCompletionChunk {
  choices: (Omit<OpenAI.Chat.Completions.ChatCompletionChunk.Choice, 'delta'> & {
    delta: DeepSeekDelta;
  })[];
}

async function readStream(
  stream: AsyncIterable<DeepSeekChunk>,
  onChunk?: (chunk: string) => unknown,
) {
  let fullText = "";
  let fullReasoningText = ""

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
  return { toolCalls, fullText };
}
