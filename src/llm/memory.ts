import { randomUUID } from "node:crypto";

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

export interface Memory {
  addToMemory(record: MessageRecord): void;
  dumpToMessages(): MessageRecord[];
}

const memoryIdMap = new Map<string, Memory>();

export function memoryManager() {
  return {
    newMemory(): string {
      const uuid = randomUUID();
      memoryIdMap.set(uuid, new MemoryImpl());
      return uuid;
    },
    getMemory(id: string): Memory {
      if (!memoryIdMap.has(id)) {
        console.error(`Can not find memory by id: ${id}. Return a new one...`);
        const newId = this.newMemory();
        return this.getMemory(newId);
      }
      return memoryIdMap.get(id)!;
    },
  };
}

class MemoryImpl implements Memory {
  private fullContextMemory: MessageRecord[] = [];
  addToMemory(record: MessageRecord) {
    this.fullContextMemory.push(record);
  }
  dumpToMessages() {
    return this.fullContextMemory;
  }
}
