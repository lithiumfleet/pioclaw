import type { Message, Dispatcher } from "./types.ts";

interface MessageQueue {
  enque(msg: Message): void;
  get isRunning(): boolean;
  run(dispatcher: Dispatcher): void;
  stop(): void;
}

export class MessageQueueImpl implements MessageQueue {
  private queue: Message[] = [];
  private running: boolean = false;
  get isRunning() {
    return this.running;
  }
  private signal: { resolve: () => void; promise: Promise<void> } | null = null;
  private abortController = new AbortController();

  private waitForMessages() {
    if (this.signal) return this.signal.promise;
    let resolve!: () => void;
    const promise = new Promise<void>((res) => {
      resolve = res;
    });
    this.signal = { promise, resolve };
    return promise;
  }

  enque = (msg: Message): void => {
    this.queue.push(msg);
    if (this.signal) {
      this.signal.resolve();
      this.signal = null;
    }
  };

  async run(dispatcher: Dispatcher): Promise<void> {
    if (this.running) return;
    this.running = true;

    while (!this.abortController.signal.aborted) {
      if (this.queue.length === 0) {
        await this.waitForMessages();
      }

      if (this.abortController.signal.aborted) break;

      const msg = this.queue.shift()!;
      const handler = dispatcher[msg.type] as (
        data: typeof msg.data,
      ) => Promise<Message | Message[] | void>;

      if (handler) {
        try {
          const res = await handler(msg.data);
          if (res) {
            const messages = Array.isArray(res) ? res : [res];
            messages.forEach((m) => this.enque(m));
          }
        } catch (err) {
          console.error(`Error processing message ${msg.type}:`, err);
        }
      }
    }
    this.running = false;
  }

  stop(): void {
    this.abortController.abort();
    this.signal?.resolve();
  }
}
