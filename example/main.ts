import { createAgentLoop } from "@src/core/agent.ts";
import { memoryManager } from "@src/llm/memory.ts";

if (import.meta.main) {
  const id = memoryManager().newMemory();
  const { start, end, input } = createAgentLoop();
  start();
  input({
    type: "userreq",
    data: {
      memory: memoryManager().getMemory(id),
      prompt:
        "尝试用powershell完成一个任务以检查agent tool call有没有问题, 告诉我你能不能看到控制台的输出,尤其是错误时的报错信息能不能看到(需要显式验证). 任务: 在desktop/pioclaw/data下找pdf, 并告诉我它的内容.",
    },
  });
  setTimeout(() => {
    end();
  }, 2147483647);
}
