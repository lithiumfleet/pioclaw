import { createAgentLoop } from "./core/agent.ts";
import { dispatcher } from "./handlers/dispatcher.ts";

if (import.meta.main) {
  const { start, end, input } = createAgentLoop(dispatcher);
  start();
  input({
    type: "userreq",
    data: { prompt: "我的推特账号一年没登陆被当成bot冻结了, 帮我写一份中英双语申请, 简明扼要" },
  });
  setTimeout(() => {
    end();
  }, 2147483647);
}
