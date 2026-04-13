import OpenAI from "openai";
import { fullContextMemory } from "./memory.ts";
import { allTools } from "./tools.ts";

const apiKey = await Deno.readTextFile("../.key").then(text => text.trim());
const openai = new OpenAI({
  apiKey,
  baseURL: "https://api.deepseek.com/v1",
});

export async function sendToLLm() {
  return await openai.chat.completions.create({
    model: "deepseek-reasoner",
    messages: fullContextMemory,
    stream: true,
    tools: allTools,
  });
}
