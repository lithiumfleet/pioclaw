import { createAgentLoop } from "@src/core/agent.ts";
import { memoryManager } from "@src/llm/memory.ts";
import { stdin as _stdin, stdout as _stdout } from "node:process";
import * as readline from "node:readline";
import { white, green, gray } from "@std/colors";
import { onStream } from "@src/llm/api.ts";

const print = (s: string, colorFn?: (s: string) => string) => {
  const output = colorFn ? colorFn(s) : s;
  Deno.stdout.writeSync(new TextEncoder().encode(output));
};

onStream.on("newReasoningChunk", (s: string) => {
  print(s, gray);
});

onStream.on("newToolRes", (s: string) => {
  print(s, green);
});

onStream.on("newTextChunk", (s: string) => {
  print(s, white);
});

const { start, end, input, events } = createAgentLoop();
events.on("agentEndResp", ask)
const id = memoryManager().newMemory();
const memory = memoryManager().getMemory(id);

const callAgent = (prompt: string) => {
  if (prompt.toLowerCase() === "exit") {
    end();
    return;
  }

  input({
    type: "userreq",
    data: { memory, prompt },
  });
};

const rl = readline.createInterface({
  input: _stdin,
  output: _stdout,
});

function ask() {
  rl.question("> ", (answer) => {
    callAgent(answer);
  });
}

if (import.meta.main) {
  start();
  ask();
}
