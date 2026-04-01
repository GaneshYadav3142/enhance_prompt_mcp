
const OpenAI = require("openai");
const { GoogleGenerativeAI } = require("@google/generative-ai");
// // services/llmEnhancer.js
// const OpenAI = require("openai");
// // Load environment variables from .env file
// //  if (process.env.NODE_ENV !== "production") {
// //   require("dotenv").config({ quiet: true });
// // }

// const client = new OpenAI({
//     apiKey: process.env.OPENAI_API_KEY, // uses OPENAI_API_KEY from env
// });

// async function enhanceWithLLM(userPrompt, category, strategies) {

//     const systemPrompt = `You are an expert prompt engineer.
// Your job is to rewrite and enhance user prompts to make them clearer, 
// more specific, and more effective for AI models.

// Guidelines:
// - Understand the user's intent deeply
// - Add relevant context, constraints, and output format instructions
// - Apply the appropriate tone and structure for the category
// - Do NOT execute the prompt — only enhance it
// - Return only the enhanced prompt text, nothing else`;

//     const userMessage = `
// Enhance the following prompt.

// Category: ${category}
// Strategies to apply: ${strategies.join(", ")}

// Original Prompt:
// """
// ${userPrompt}
// """

// Return only the enhanced version of the prompt.`;

//     const response = await client.chat.completions.create({
//         model: "gpt-4o",
//         max_tokens: 1000,
//         temperature: 0.4,
//         messages: [
//             { role: "system", content: systemPrompt },
//             { role: "user", content: userMessage },
//         ],
//     });

//     return response.choices[0].message.content.trim();
// }

// module.exports = { enhanceWithLLM };

// src/services/llmEnhancer.js
// Supports OpenAI and Google Gemini.
// Provider is selected automatically based on which key is set in config.
// If both keys are set, OpenAI is used.

const config = require("../config");

// ── shared prompt builders ────────────────────────────────────────────────────
function buildSystemPrompt() {
    return `You are an expert prompt engineer.
Your job is to rewrite and enhance user prompts to make them clearer,
more specific, and more effective for AI models.

Guidelines:
- Understand the user's intent deeply
- Add relevant context, constraints, and output format instructions
- Apply the appropriate tone and structure for the category
- Do NOT execute the prompt — only enhance it
- Return only the enhanced prompt text, nothing else`;
}

function buildUserMessage(userPrompt, category, strategies) {
    return `Enhance the following prompt.

Category: ${category}
Strategies to apply: ${strategies.join(", ")}

Original Prompt:
"""
${userPrompt}
"""

Return only the enhanced version of the prompt.`;
}

// ── OpenAI ────────────────────────────────────────────────────────────────────
async function enhanceWithOpenAI(userPrompt, category, strategies) {

    const client = new OpenAI({ apiKey: config.openaiApiKey });

    const response = await client.chat.completions.create({
        model: config.enhancerModel,
        max_tokens: 1000,
        temperature: 0.4,
        messages: [
            { role: "system", content: buildSystemPrompt() },
            { role: "user", content: buildUserMessage(userPrompt, category, strategies) }
        ]
    });

    return response.choices[0].message.content.trim();
}

// ── Gemini ────────────────────────────────────────────────────────────────────
async function enhanceWithGemini(userPrompt, category, strategies) {
    const genAI = new GoogleGenerativeAI(config.geminiApiKey);
    const model = genAI.getGenerativeModel({ model: config.enhancerModel });

    const fullPrompt = buildSystemPrompt() + "\n\n" +
        buildUserMessage(userPrompt, category, strategies);

    const result = await model.generateContent(fullPrompt);
    return result.response.text().trim();
}

// ── main export ───────────────────────────────────────────────────────────────
async function enhanceWithLLM(userPrompt, category, strategies) {
    if (config.provider === "gemini") {
        return enhanceWithGemini(userPrompt, category, strategies);
    }
    return enhanceWithOpenAI(userPrompt, category, strategies);
}

module.exports = { enhanceWithLLM };
