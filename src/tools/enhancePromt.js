const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema")
const { optimizePrompt } = require("../services/promptOptimizer");


const enhancePromptTool = {
    name: "enhance_prompt",
    description: "Enhance a user prompt using prompt architect engine",

    inputSchema: {
        // type: "object",
        // properties: {
        //     prompt: { type: "string" }
        // },
        // required: ["prompt"]
        input: z.string().optional()
    },

    execute: async ({ input }) => {
        console.error("Enhancing prompt:", input);

        const result = await optimizePrompt(input);

        // return {
        //     content: [{ type: "text", text: result }]
        // };

        return {
            content: [{
                type: "text",
                text: `Category: ${result.category}\n\nStrategies: ${result.strategies.join(", ")}\n\nOptimized Prompt:\n${result.enhancedPrompt}`
            }]
        };
    }

};









module.exports = { enhancePromptTool };