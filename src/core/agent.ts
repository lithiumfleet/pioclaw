import { Message, Dispatcher } from "./types.ts";
import { MessageQueueImpl } from "./queue.ts";

export function createAgentLoop(dispatcher: Dispatcher) {
  const msgQue = new MessageQueueImpl();

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

  return { start, end, input };
}
