#!/usr/bin/env node

const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { z } = require("zod");
dotenv = require("dotenv");

// Import your tools (ensure these paths are correct relative to server.js)
const { enhancePromptTool } = require("./tools/enhancePromt");
const { classifyPromptTool } = require("./tools/classifyPromt");
const { optimizePromptTool } = require("./tools/optimizePromt");
//require("dotenv").config(); // Load environment variables from .env file
const { enhanceWithContextTool } = require("./tools/enhanceWithContext"); // new
const { recordTurnTool }         = require("./tools/recordTurn");          // new
const { pinFactTool }            = require("./tools/pinFact");             // new
const server = new McpServer({
    name: "mcp-prompt-architect",
    version: "1.0.0"
}, {
    capabilities: {
        tools: {}
    }
});

const registerTool = (tool) => {
    server.tool(
        tool.name,
        tool.description,
        tool.inputSchema,
        tool.execute
    );
};

registerTool(enhancePromptTool);
registerTool(classifyPromptTool);
registerTool(optimizePromptTool);

registerTool(enhanceWithContextTool);
registerTool(recordTurnTool);
registerTool(pinFactTool);
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("MCP Prompt Architect running via Stdio");
}

main().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
});