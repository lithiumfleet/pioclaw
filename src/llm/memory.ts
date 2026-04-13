export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

type MessageRecord =
  | {
      role: "user";
      content: string;
    }
  | {
      role: "assistant";
      reasoning_content?: string;
      content?: string;
      tool_calls?: ToolCall[];
    }
  | {
      role: "tool";
      tool_call_id: string;
      content: string;
    };

const fullContextMemory: MessageRecord[] = [];

export class Memory {
  static addToMemory(record: MessageRecord) {
    fullContextMemory.push(record);
  }

  static dumpToMessages() {
    return fullContextMemory;
  }
}
