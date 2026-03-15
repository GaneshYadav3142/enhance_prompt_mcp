const { z } = require("zod");
const { optimizePrompt } = require("../services/promptOptimizer");

const optimizePromptTool = {
    name: "optimize_prompt",
    description: "Fully optimize user prompt using templates and strategies",

    inputSchema: {
        type: "object",
        properties: {
            prompt: { type: "string" }
        },
        required: ["prompt"]
    },

    execute: async ({ prompt }) => {
        console.error("Received prompt for optimization:", prompt); // console.error not log!

        const result = await optimizePrompt(prompt);

        console.error("Optimization result:", result);

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        category: result.category,
                        strategies: result.strategies,
                        optimized_prompt: result.enhancedPrompt
                    }, null, 2)
                }
            ]
        };
    }

};

module.exports = { optimizePromptTool };