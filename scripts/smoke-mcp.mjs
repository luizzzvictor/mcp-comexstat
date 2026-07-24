import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const requiredTools = [
  "healthCheck",
  "getLastUpdate",
  "getAvailableYears",
  "queryData",
  "getCountries",
];

const transport = new StdioClientTransport({
  command: process.execPath,
  args: ["dist/index.js"],
  stderr: "pipe",
});
transport.stderr?.on("data", (chunk) => process.stderr.write(chunk));

const client = new Client({
  name: "mcp-comexstat-smoke-test",
  version: "1.0.0",
});

try {
  await client.connect(transport);
  const { tools } = await client.listTools();
  const toolNames = tools.map((tool) => tool.name);
  const missingTools = requiredTools.filter((name) => !toolNames.includes(name));

  if (missingTools.length > 0) {
    throw new Error(`Missing MCP tools: ${missingTools.join(", ")}`);
  }

  console.log(
    JSON.stringify({
      status: "ok",
      toolCount: tools.length,
      requiredTools,
    })
  );
} finally {
  await client.close();
}
