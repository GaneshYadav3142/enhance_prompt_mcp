#!/usr/bin/env node

// const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
// const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
// const { z } = require("zod");
// dotenv = require("dotenv");

// // Import your tools (ensure these paths are correct relative to server.js)
// const { enhancePromptTool } = require("./tools/enhancePromt");
// const { classifyPromptTool } = require("./tools/classifyPromt");
// const { optimizePromptTool } = require("./tools/optimizePromt");
// //require("dotenv").config(); // Load environment variables from .env file
// const { enhanceWithContextTool } = require("./tools/enhanceWithContext"); // new
// const { recordTurnTool } = require("./tools/recordTurn");          // new
// const { pinFactTool } = require("./tools/pinFact");             // new
// const server = new McpServer({
//     name: "mcp-prompt-architect",
//     version: "1.0.0"
// }, {
//     capabilities: {
//         tools: {}
//     }
// });

// const registerTool = (tool) => {
//     server.tool(
//         tool.name,
//         tool.description,
//         tool.inputSchema,
//         tool.execute
//     );
// };

// registerTool(enhancePromptTool);
// registerTool(classifyPromptTool);
// registerTool(optimizePromptTool);

// registerTool(enhanceWithContextTool);
// registerTool(recordTurnTool);
// registerTool(pinFactTool);
// async function main() {
//     const transport = new StdioServerTransport();
//     await server.connect(transport);
//     console.error("MCP Prompt Architect running via Stdio");
// }

// main().catch((error) => {
//     console.error("Server error:", error);
//     process.exit(1);
// });






const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { z } = require("zod");

const { optimizePrompt } = require("./services/promptOptimizer");
const { classifyPrompt } = require("./services/classifierService");
const { buildContextBlock } = require("./services/contextBuilder");
const {
    resolveSessionId,
    getOrCreateSession,
    saveTurn,
    savePinnedFact,
    listSessions
} = require("./session/manager");

const server = new McpServer({
    name: "mcp-prompt-architect",
    version: "2.0.0"
}, {
    capabilities: { tools: {} }
});

// ── helper ────────────────────────────────────────────────────────────────────
function requireSessionId(session_id) {
    const sid = resolveSessionId(session_id);
    if (!sid) {
        return {
            content: [{
                type: "text",
                text: [
                    "No session name provided and no git repository detected.",
                    "",
                    "Please provide a session_id that names your project. For example:",
                    '  session_id: "my-novel"',
                    '  session_id: "work-api-project"',
                    '  session_id: "recipe-app"',
                    "",
                    "Use the same name every time for the same project.",
                    "Your context will build up automatically from there."
                ].join("\n")
            }]
        };
    }
    return sid;
}

// ── V1: enhance_prompt (no context, quick one-off) ────────────────────────────
server.tool(
    "enhance_prompt",
    "Enhance a user prompt using prompt architect engine",
    {
        input: z.string().describe("The raw user prompt to enhance")
    },
    async ({ input }) => {
        const result = await optimizePrompt(input);
        return {
            content: [{
                type: "text",
                text: `Category: ${result.category}\n\nStrategies: ${result.strategies.join(", ")}\n\nOptimized Prompt:\n${result.enhancedPrompt}`
            }]
        };
    }
);

// ── V1: classify_prompt (kept, not actively used) ─────────────────────────────
server.tool(
    "classify_prompt",
    "Classify user prompt category",
    {
        prompt: z.string().describe("The prompt to classify")
    },
    async ({ prompt }) => {
        const category = classifyPrompt(prompt);
        return {
            content: [{ type: "text", text: JSON.stringify({ category }, null, 2) }]
        };
    }
);

// ── V1: optimize_prompt (kept, not actively used) ─────────────────────────────
server.tool(
    "optimize_prompt",
    "Fully optimize user prompt using templates and strategies",
    {
        prompt: z.string().describe("The prompt to optimize")
    },
    async ({ prompt }) => {
        const result = await optimizePrompt(prompt);
        return {
            content: [{
                type: "text",
                text: JSON.stringify({
                    category: result.category,
                    strategies: result.strategies,
                    optimized_prompt: result.enhancedPrompt
                }, null, 2)
            }]
        };
    }
);

// ── V2: enhance_prompt_with_context (THE main tool — does everything) ─────────
//
// What happens inside every single call:
//   1. Resolve session ID (from input or git root)
//   2. Auto-save user prompt to DB           ← no manual record_turn needed
//   3. Read all context built up so far
//   4. Enrich prompt with context block
//   5. Enhance via OpenAI
//   6. Auto-save enhanced result to DB       ← next call will have this as context
//   7. Return enhanced prompt to user
//
// The user only ever calls THIS tool. Context grows silently in the background.
server.tool(
    "enhance_prompt_with_context",
    "Enhance your prompt using the full context of your ongoing project conversation",
    {
        prompt: z.string().describe("The raw prompt you want to enhance"),
        session_id: z.string().optional().describe(
            "Your project name e.g. 'my-novel' or 'work-api'. Use the same name every time. Auto-detected if you are in a git repo."
        )
    },
    async ({ prompt, session_id }) => {

        // 1. Resolve session
        const sid = requireSessionId(session_id);
        if (typeof sid === "object") return sid;
        getOrCreateSession(sid);

        // 2. Auto-save user prompt — happens silently, user does nothing
        saveTurn(sid, "user", prompt);

        // 3. Read all context built from previous turns
        const contextBlock = await buildContextBlock(sid);

        // 4. Enrich prompt with context
        const enrichedPrompt = contextBlock
            ? `${contextBlock}\n\n${prompt}`
            : prompt;

        // 5. Enhance via OpenAI
        const result = await optimizePrompt(enrichedPrompt);

        // 6. Auto-save enhanced result — becomes context for next call
        saveTurn(sid, "assistant", result.enhancedPrompt);

        // 7. Return to user
        return {
            content: [{
                type: "text",
                text: [
                    `Session: ${sid}`,
                    contextBlock
                        ? `\nContext applied:\n${contextBlock}`
                        : "\nNo context yet — this is your first turn. Context will grow automatically from here.",
                    `\n\nCategory: ${result.category}`,
                    `Strategies: ${result.strategies.join(", ")}`,
                    `\nEnhanced Prompt:\n${result.enhancedPrompt}`
                ].join("\n")
            }]
        };
    }
);

// ── V2: pin_fact (intentional — user explicitly locks something in) ────────────
server.tool(
    "pin_fact",
    "Pin an important fact to always include in your project context",
    {
        fact: z.string().describe("The fact to remember e.g. 'Using React 18 and TypeScript'"),
        session_id: z.string().optional().describe(
            "Your project name. Must match the name used in enhance_prompt_with_context."
        )
    },
    async ({ fact, session_id }) => {
        const sid = requireSessionId(session_id);
        if (typeof sid === "object") return sid;

        getOrCreateSession(sid);
        savePinnedFact(sid, fact);

        return {
            content: [{
                type: "text",
                text: `Fact pinned to session "${sid}": "${fact}"\n\nThis will now appear in every enhanced prompt for this project.`
            }]
        };
    }
);

// ── V2: list_sessions (utility — see all your projects) ───────────────────────
server.tool(
    "list_sessions",
    "List all your saved project sessions",
    {},
    async () => {
        const sessions = listSessions();
        if (sessions.length === 0) {
            return {
                content: [{
                    type: "text",
                    text: "No sessions yet. Call enhance_prompt_with_context with a session_id to start one."
                }]
            };
        }
        const lines = sessions.map(s => {
            const last = new Date(s.last_active).toLocaleDateString();
            return `• ${s.id}   (last active: ${last})`;
        });
        return {
            content: [{
                type: "text",
                text: `Your project sessions:\n\n${lines.join("\n")}`
            }]
        };
    }
);

// ── start ─────────────────────────────────────────────────────────────────────
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("MCP Prompt Architect v2 running via Stdio");
}

main().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
});
