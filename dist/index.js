"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ComexstatMCP_1 = require("./ComexstatMCP");
const mcp = new ComexstatMCP_1.ComexstatMCP({
    version: "1.0.0",
    description: "MCP server for accessing Brazilian foreign trade statistics via Comexstat API",
});
/**
 * Main entry point for the Comexstat MCP server
 * This starts the MCP server and handles the communication protocol
 */
async function main() {
    try {
        console.log("Starting Comexstat MCP server...");
        await mcp.start();
        console.log("Comexstat MCP server is running");
    }
    catch (error) {
        console.error("Error starting Comexstat MCP server:", error);
        process.exit(1);
    }
}
// Start the server
main();
