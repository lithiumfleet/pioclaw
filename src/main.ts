import { createAgentLoop } from "./core/agent.ts";
import { dispatcher } from "./handlers/dispatcher.ts";

if (import.meta.main) {
  const { start, end, input } = createAgentLoop(dispatcher);
  start();
  input({
    type: "userreq",
    data: { prompt: "说明C:\Users\PotassiumPC\Desktop\pioclaw\pdfs下数电实验报告中异步十进制计数器是怎么实现的" },
  });
  setTimeout(() => {
    end();
  }, 2147483647);
}
