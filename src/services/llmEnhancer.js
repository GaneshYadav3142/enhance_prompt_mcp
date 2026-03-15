// services/llmEnhancer.js
const OpenAI = require("openai");

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // uses OPENAI_API_KEY from env
});

async function enhanceWithLLM(userPrompt, category, strategies) {

    const systemPrompt = `You are an expert prompt engineer.
Your job is to rewrite and enhance user prompts to make them clearer, 
more specific, and more effective for AI models.

Guidelines:
- Understand the user's intent deeply
- Add relevant context, constraints, and output format instructions
- Apply the appropriate tone and structure for the category
- Do NOT execute the prompt — only enhance it
- Return only the enhanced prompt text, nothing else`;

    const userMessage = `
Enhance the following prompt.

Category: ${category}
Strategies to apply: ${strategies.join(", ")}

Original Prompt:
"""
${userPrompt}
"""

Return only the enhanced version of the prompt.`;

    const response = await client.chat.completions.create({
        model: "gpt-4o",
        max_tokens: 1000,
        temperature: 0.4,
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
        ],
    });

    return response.choices[0].message.content.trim();
}

module.exports = { enhanceWithLLM };