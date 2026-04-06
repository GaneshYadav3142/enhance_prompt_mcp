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
const dotenv = require("dotenv");
dotenv.config();

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
const { suggestNextCode, explainError, reviewCode } = require("./services/codingAssitant");

const server = new McpServer({
    name: "mcp-prompt-architect",
    version: "2.1.5"
}, {
    capabilities: { tools: {} }
});

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

// ── 1. suggest_next_code ──────────────────────────────────────────────────────
// Returns RAW CODE ONLY — no markdown, no explanation.
// Designed to be used as ghost/inline text in the editor.
// The editor shows this as greyed-out text after the cursor.
server.tool(
    "suggest_next_code",
    "Suggest the next lines of code at cursor position — returns raw code only for ghost text display",
    {
        file_content: z.string().describe("Full content of the current file"),
        cursor_line: z.number().describe("Line number where the cursor is (1-indexed)"),
        language: z.string().describe("Programming language e.g. 'typescript', 'python', 'javascript'"),
        session_id: z.string().optional().describe("Your project name. Auto-detected from git if omitted.")
    },
    async ({ file_content, cursor_line, language, session_id }) => {
        try {
            const sid = session_id ? resolveSessionId(session_id) : resolveSessionId();
            let contextBlock = null;
            if (sid) {
                getOrCreateSession(sid);
                contextBlock = await buildContextBlock(sid);
            }

            const suggestion = await suggestNextCode({
                fileContent: file_content,
                cursorLine: cursor_line,
                language,
                contextBlock
            });

            // Save to session so context knows what code you are writing
            if (sid) {
                saveTurn(sid, "user", `[code suggestion requested at line ${cursor_line} in ${language} file]`);
                saveTurn(sid, "assistant", `[suggested]: ${suggestion.slice(0, 200)}`);
            }

            return {
                content: [{
                    type: "text",
                    // Pure code — no labels, no markdown. Editor renders as ghost text.
                    text: suggestion
                }]
            };
        } catch (err) {
            console.error("[suggest_next_code] error:", err.message);
            return { content: [{ type: "text", text: `Error: ${err.message}` }] };
        }
    }
);

// ── 2. explain_error ──────────────────────────────────────────────────────────
server.tool(
    "explain_error",
    "Explain an error and provide a fix tailored to your project stack",
    {
        error_message: z.string().describe("The full error message or stack trace"),
        file_content: z.string().describe("Content of the file where the error occurred"),
        language: z.string().describe("Programming language e.g. 'typescript', 'python'"),
        session_id: z.string().optional().describe("Your project name. Auto-detected from git if omitted.")
    },
    async ({ error_message, file_content, language, session_id }) => {
        try {
            const sid = session_id ? resolveSessionId(session_id) : resolveSessionId();
            let contextBlock = null;
            if (sid) {
                getOrCreateSession(sid);
                contextBlock = await buildContextBlock(sid);
            }

            const explanation = await explainError({
                errorMessage: error_message,
                fileContent: file_content,
                language,
                contextBlock
            });

            // Save error + fix to session — next time a similar error occurs, context includes this
            if (sid) {
                saveTurn(sid, "user", `[error]: ${error_message.slice(0, 300)}`);
                saveTurn(sid, "assistant", explanation.slice(0, 500));
            }

            return {
                content: [{ type: "text", text: explanation }]
            };
        } catch (err) {
            console.error("[explain_error] error:", err.message);
            return { content: [{ type: "text", text: `Error: ${err.message}` }] };
        }
    }
);

// ── 3. review_code ────────────────────────────────────────────────────────────
server.tool(
    "review_code",
    "Review your code against your project standards and best practices",
    {
        file_content: z.string().describe("The code to review"),
        language: z.string().describe("Programming language e.g. 'typescript', 'python'"),
        session_id: z.string().optional().describe("Your project name. Auto-detected from git if omitted.")
    },
    async ({ file_content, language, session_id }) => {
        try {
            const sid = session_id ? resolveSessionId(session_id) : resolveSessionId();
            let contextBlock = null;
            if (sid) {
                getOrCreateSession(sid);
                contextBlock = await buildContextBlock(sid);
            }

            const review = await reviewCode({ fileContent: file_content, language, contextBlock });

            if (sid) {
                saveTurn(sid, "user", `[code review requested for ${language} file, ${file_content.split("\n").length} lines]`);
                saveTurn(sid, "assistant", review.slice(0, 500));
            }

            return {
                content: [{ type: "text", text: review }]
            };
        } catch (err) {
            console.error("[review_code] error:", err.message);
            return { content: [{ type: "text", text: `Error: ${err.message}` }] };
        }
    }
);




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


        const sid = requireSessionId(session_id);
        if (typeof sid === "object") return sid;
        getOrCreateSession(sid);

        saveTurn(sid, "user", prompt);

        const contextBlock = await buildContextBlock(sid);


        const enrichedPrompt = contextBlock
            ? `${contextBlock}\n\n${prompt}`
            : prompt;


        const result = await optimizePrompt(enrichedPrompt);


        saveTurn(sid, "assistant", result.enhancedPrompt);

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





async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("MCP Prompt Architect v2 running via Stdio");
    console.error(
        `[prompt-architect] Configuration:\n` +
        `  OpenAI key: ${process.env.GEMINI_API_KEY ? `${process.env.GEMINI_API_KEY}` : "notfound"}\n`
    );
}

main().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
});
