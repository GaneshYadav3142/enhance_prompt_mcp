// src/tools/enhanceWithContext.js
const { z } = require("zod");

const { optimizePrompt } = require("../services/promptOptimizer");
const { buildContextBlock } = require("../services/contextBuilder");
const { resolveSessionId, getOrCreateSession } = require("../session/manager");

const enhanceWithContextTool = {
  name: "enhance_prompt_with_context",
  description: "Enhance a prompt using full project context from your ongoing session",

  inputSchema: {
    // type: "object",
    //  properties: {
    //   prompt: { type: "string", description: "The raw prompt to enhance" },
    //   session_id: { type: "string", description: "Optional. Auto-detected from your project if omitted." }
    // },
    // required: ["prompt"]
    prompt: z.string().describe("The raw prompt to enhance"),
    session_id: z.string().optional().describe("Auto-detected from git root if omitted")
  },

  execute: async ({ prompt, session_id }) => {
    const sid = resolveSessionId(session_id);
    getOrCreateSession(sid);

    const contextBlock = await buildContextBlock(sid);
    const enrichedPrompt = contextBlock
      ? `${contextBlock}\n\n${prompt}`
      : prompt;

    const result = await optimizePrompt(enrichedPrompt);

    return {
      content: [{
        type: "text",
        text: [
          `Session: ${sid}`,
          contextBlock ? `\nContext applied:\n${contextBlock}` : "\nNo context yet — first turn.",
          `\n\nCategory: ${result.category}`,
          `Strategies: ${result.strategies.join(", ")}`,
          `\nEnhanced Prompt:\n${result.enhancedPrompt}`
        ].join("\n")
      }]
    };
  }
};

module.exports = { enhanceWithContextTool };