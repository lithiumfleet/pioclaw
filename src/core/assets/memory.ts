import { ToolCall } from "../types.ts";

export const fullContextMemory: (
  | {
      role: "assistant" | "user";
      content: string;
    }
  | {
      role: "assistant";
      content: null;
      tool_calls: ToolCall[];
    }
  | {
      role: "tool";
      tool_call_id: string;
      content: string;
    }
)[] = [];
