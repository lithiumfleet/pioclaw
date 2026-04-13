import OpenAI from "openai";
import { Memory } from "./memory.ts";
import { allTools } from "./tools.ts";

const apiKey = Deno.env.get("API_KEY");
const openai = new OpenAI({
  apiKey,
  baseURL: "https://api.deepseek.com/v1",
});

export async function sendToLLm(memory: Memory) {
  return await openai.chat.completions.create({
    model: "deepseek-reasoner",
    messages: memory.dumpToMessages(),
    stream: true,
    tools: allTools,
  });
}
