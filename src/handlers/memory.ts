export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

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
