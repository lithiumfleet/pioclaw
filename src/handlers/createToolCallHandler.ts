import { sendToLLm } from "../llm/api.ts";
import { Memory, ToolCall } from "../llm/memory.ts";
import { callTool } from "../llm/tools.ts";

export function createToolCallHandler() {
  return async function toolCallHandler(data: { toolCalls: ToolCall[] }) {
    if (data.toolCalls.length === 0) {
      console.error("No tools to call but got toolcallreq.");
    }

    // 执行工具调用
    const results = [];
    for (const toolCall of data.toolCalls) {
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

      const toolRes = await callTool(func.name, args);

      console.log(
        `[tool call] ${func.name}-${id} result: ${toolRes}`,
      );

      results.push({
        tool_call_id: id,
        role: "tool" as const,
        name: func.name,
        content: toolRes
      });
    }

    // 将工具调用添加到内存中
    Memory.addToMemory({
      role: "assistant",
      tool_calls: data.toolCalls,
    });

    // 将工具执行结果添加到内存
    for (const result of results) {
      Memory.addToMemory({
        role: "tool",
        tool_call_id: result.tool_call_id,
        content: result.content,
      });
    }

    return {
      type: "parsestreamreq",
      data: {
        stream: await sendToLLm(),
      },
    };
  };
}
