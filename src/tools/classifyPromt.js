const { z } = require("zod");
const { classifyPrompt } = require("../services/classifierService");

const classifyPromptTool = {
    name: "classify_prompt",
    description: "Classify user prompt category",

    // inputSchema: {
    //     prompt: z.string()
    // },

    // execute: async ({ prompt }) => {
    //     const category = classifyPrompt(prompt);

    //     return {
    //         category
    //     };
    // }

    inputSchema: {
        type: "object",
        properties: {
            prompt: { type: "string" }
        },
        required: ["prompt"]
    },

    execute: async ({ prompt }) => {
        console.error("Classifying prompt:", prompt);

        const category = await classifyPrompt(prompt);

        return {
            content: [{ type: "text", text: JSON.stringify({ category }, null, 2) }]
        };
    }
};

module.exports = { classifyPromptTool };