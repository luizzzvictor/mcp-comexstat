import { ComexstatMCP } from "./ComexstatMCP";

const mcp = new ComexstatMCP({
  version: "1.0.0",
  description:
    "MCP server for accessing Brazilian foreign trade statistics via Comexstat API",
});

/**
 * Main entry point for the Comexstat MCP server
 * This starts the MCP server and handles the communication protocol
 */
async function main() {
  try {
    // Note: console.log statements removed to avoid interfering with MCP JSON-RPC protocol
    // All stdout must be valid JSON for MCP communication
    await mcp.start();
  } catch (error) {
    // stderr is safe to use for error logging in MCP servers
    console.error("Error starting Comexstat MCP server:", error);
    process.exit(1);
  }
}

// Start the server
main();
