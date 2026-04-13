import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

interface ServerConfig {
  command: string;
  args: string[];
}

interface MCPTool {
  name: string;
  description?: string;
  inputSchema: any;
}

interface DeepSeekTool {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters: any;
  };
}

export let allTools: DeepSeekTool[] = [];
const clients: Record<string, Client> = {};

export async function callTool(
  toolName: string,
  args: unknown,
): Promise<string> {
  for (const [_serverName, client] of Object.entries(clients)) {
    const { tools } = await client.listTools();
    // @ts-ignore:
    if (tools.some((t) => t.name === toolName)) {
      const result = await client.callTool({
        name: toolName,
        arguments: args,
      });
      return typeof result === "string" ? result : JSON.stringify(result);
    }
  }
  return `Tool "${toolName}" not found in any MCP server`;
}

async function initServers() {
  const mcpJsonPath = Deno.env.get("MCPS_PATH")!;
  const mcpsText = await Deno.readTextFile(mcpJsonPath);
  const mcpsConfig = JSON.parse(mcpsText);
  const serverConfigs: Record<string, ServerConfig> = mcpsConfig.servers;
  for (const [name, config] of Object.entries(serverConfigs)) {
    console.log(`connecting MCP Server: ${name}...`);

    const transport = new StdioClientTransport({
      command: config.command,
      args: config.args,
    });

    const client = new Client(
      { name: `agent-${name}`, version: "1.0.0" },
      { capabilities: {} },
    );

    try {
      await client.connect(transport);
      clients[name] = client;
    } catch (err) {
      console.error(`${name} connection error:`, err);
    }
  }

  let mcpTools: MCPTool[] = [];
  for (const [_name, client] of Object.entries(clients)) {
    const tools = await client.listTools();
    mcpTools = mcpTools.concat(tools.tools);
  }
  allTools = convertMCPToDeepSeek(mcpTools);
}

function convertMCPToDeepSeek(mcpTools: MCPTool[]): DeepSeekTool[] {
  return mcpTools.map((tool) => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema,
    },
  }));
}

await initServers();
