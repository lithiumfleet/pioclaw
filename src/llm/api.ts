import OpenAI from "openai";
import { Memory, ToolCall } from "./memory.ts";
import { allTools } from "./tools.ts";
import _mitt from "mitt";
const mitt = _mitt as unknown as typeof _mitt.default;

const apiKey = Deno.env.get("API_KEY");
const openai = new OpenAI({
  apiKey,
  baseURL: "https://api.deepseek.com/v1",
});

export async function sendToLLm(memory: Memory) {
  return await openai.chat.completions.create({
    model: "deepseek-reasoner",
    messages: memory.dumpToMessages(),
    stream: true,
    tools: allTools,
  });
}

type EventMap = {
  newTextChunk: string;
  newReasoningChunk: string;
  newToolRes: string;
};

export const onStream = mitt<EventMap>();

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

export async function readStream(stream: AsyncIterable<DeepSeekChunk>) {
  let fullText = "";
  let fullReasoningText = "";
  const toolCalls: ToolCall[] = [];

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta;
    const content = delta?.content || "";
    const reasoningContent = delta?.reasoning_content || "";

    if (content) {
      fullText += content;
      onStream.emit("newTextChunk", content);
    }

    if (reasoningContent) {
      fullReasoningText += reasoningContent;
      onStream.emit("newReasoningChunk", reasoningContent);
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
  if (toolCalls.length !== 0) {
    onStream.emit("newToolRes", JSON.stringify(toolCalls));
  }
  return { toolCalls, fullText, fullReasoningText };
}
