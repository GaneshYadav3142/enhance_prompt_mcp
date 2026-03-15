const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema")
const { optimizePrompt } = require("../services/promptOptimizer");

// const enhancePromptTool = {
//     name: "enhance_prompt",
//     description: "Enhance a user prompt using prompt architect engine",

//     inputSchema: {
//         prompt: z.string()
//     },

//     execute: async ({ prompt }) => {
//         const result = optimizePrompt(prompt);

//         return {
//             enhanced_prompt: result.enhancedPrompt,
//             category: result.category,
//             strategies: result.strategies
//         };
//     }
// };
// module.exports = { enhancePromptTool };

//import { z } from "zod";
//import { zodToJsonSchema } from "zod-to-json-schema";
//import { optimizePrompt } from "../services/promptOptimizer.js";

// Define the schema with Zod
const EnhancePromptSchema = z.object({
    prompt: z.string().describe("The raw user prompt to enhance")
});

const enhancePromptTool = {
    name: "enhance_prompt",
    description: "Enhance a user prompt using prompt architect engine",

    // FIX 1: inputSchema must be a JSON Schema object
    // inputSchema: zodToJsonSchema(EnhancePromptSchema),

    // // FIX 2: Rename 'execute' to 'handler'
    // handler: async (args) => {
    //     // FIX 3: Validate args and call your service
    //     const { prompt } = EnhancePromptSchema.parse(args);
    //     const result = optimizePrompt(prompt);

    //     // FIX 4: Return the specific MCP 'content' structure
    //     return {
    //         content: [
    //             {
    //                 type: "text",
    //                 text: `Category: ${result.category}\nStrategies: ${result.strategies.join(", ")}\n\nEnhanced Prompt:\n${result.enhancedPrompt}`
    //             }
    //         ]
    //     };
    // }

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