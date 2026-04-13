import { createAgentLoop } from "./core/agent.ts";
import { dispatcher } from "./handlers/dispatcher.ts";

if (import.meta.main) {
  const { start, end, input } = createAgentLoop(dispatcher);
  start();
  input({
    type: "userreq",
    data: { prompt: "Desktop/pioclaw下的实验报告是老师给的参考报告, 告诉我如果需要写这样一份报告我需要做哪些实验" },
  });
  setTimeout(() => {
    end();
  }, 2147483647);
}
