import { white, green, blue } from "@std/colors";
const print = (s: string, colorFn?: (s: string) => string) => {
  const output = colorFn ? colorFn(s) : s;
  Deno.stdout.writeSync(new TextEncoder().encode(output));
};

export let onChunk = (s: string) => {
  print(s, green);
};
export let onReasoningChunk = (s: string) => {
  print(s, white);
};
export let onToolRes = (s: string) => {
  print(s, blue);
};

export function registerAgentCallbacks(
  newOnChunk?: (s: string) => unknown,
  newOnReasoning?: (s: string) => unknown,
  newOnToolRes?: (s: string) => unknown,
) {
  onChunk = newOnChunk ?? onChunk;
  onReasoningChunk = newOnReasoning ?? onReasoningChunk;
  onToolRes = newOnToolRes ?? onToolRes;
}
