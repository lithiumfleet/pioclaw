import { createAgentLoop } from "./core/agent.ts";
import { dispatcher } from "./handlers/dispatcher.ts";

if (import.meta.main) {
  const { start, end, input } = createAgentLoop(dispatcher);
  start();
  input({
    type: "userreq",
    data: { prompt: "尝试用powershell执行一些正确和错误的命令, 让我看到agent tool call有没有问题, 告诉我你能不能看到控制台的输出,尤其是错误时的报错信息能不能看到" },
  });
  setTimeout(() => {
    end();
  }, 2147483647);
}
