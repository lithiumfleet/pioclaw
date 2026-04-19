import { dispatcher, Message } from "@src/handlers/dispatcher.ts";
import { MessageQueueImpl } from "./queue.ts";
import _mitt from "mitt";
const mitt = _mitt as unknown as typeof _mitt.default;

export function createAgentLoop() {
  const msgQue = new MessageQueueImpl();
  const events = mitt<{agentEndResp: undefined}>()
  msgQue.events.on("finish", (msg) => {
    if (msg.type === "llmstreamres") {
      events.emit("agentEndResp")
    }
  })

  const start = () => {
    if (!msgQue.isRunning) {
      void msgQue.run(dispatcher);
    }
  };

  const end = () => {
    if (msgQue.isRunning) {
      msgQue.stop();
    }
  };

  const input = (msg: Message) => {
    msgQue.enque(msg);
  };

  return { start, end, input, events }; 
}
