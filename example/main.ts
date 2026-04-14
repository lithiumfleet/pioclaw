import { createAgentLoop } from "@src/core/agent.ts";
import { memoryManager } from "@src/llm/memory.ts";
import { stdin as _stdin, stdout as _stdout } from "node:process";
import * as readline from "node:readline";

const { start, end, input } = createAgentLoop();
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
  rl.question("How can I help you? (type 'exit' to quit)\n> ", (answer) => {
    callAgent(answer);
  });
}

if (import.meta.main) {
  start();
  ask();
}
