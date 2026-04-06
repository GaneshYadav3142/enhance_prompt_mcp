// src/services/codingAssistant.js
// Three focused functions: suggest code, explain error, review code.
// Each uses the session context for project awareness.
// Token-optimised: short system prompts, fast model for suggestion/error, quality for review.


const { GoogleGenerativeAI } = require("@google/generative-ai");
const OpenAI = require("openai");
const config = require("../config");

// ── shared LLM caller ─────────────────────────────────────────────────────────
async function callLLM(systemMsg, userMsg, useQualityModel = false) {
    const model = useQualityModel ? config.qualityModel : config.fastModel;

    if (config.provider === "gemini") {

        const genAI = new GoogleGenerativeAI(config.geminiApiKey);
        const m = genAI.getGenerativeModel({ model });
        const res = await m.generateContent(`${systemMsg}\n\n${userMsg}`);
        return res.response.text().trim();
    }


    const client = new OpenAI({ apiKey: config.openaiApiKey });
    const res = await client.chat.completions.create({
        model,
        max_tokens: useQualityModel ? 1200 : 600,
        temperature: useQualityModel ? 0.3 : 0.2,
        messages: [
            { role: "system", content: systemMsg },
            { role: "user", content: userMsg }
        ]
    });
    return res.choices[0].message.content.trim();
}

// ── extract code up to cursor line ───────────────────────────────────────────
function sliceToLine(fileContent, cursorLine) {
    const lines = fileContent.split("\n");
    // send at most 60 lines before cursor to keep tokens low
    const start = Math.max(0, cursorLine - 60);
    return lines.slice(start, cursorLine).join("\n");
}

// ── 1. suggest_next_code ─────────────────────────────────────────────────────
// Returns ONLY raw code — no explanation, no markdown fences.
// This is what makes it work as ghost/inline text in the editor.
async function suggestNextCode({ fileContent, cursorLine, language, contextBlock }) {
    const codeSlice = sliceToLine(fileContent, cursorLine || 9999);

    const system = `You are a ${language} code completion engine. Output ONLY the next code to insert — no explanation, no markdown, no comments. Ghost text only.`;

    const user = [
        contextBlock ? `Project context:\n${contextBlock}\n` : "",
        `Language: ${language}`,
        `Code so far (last ${codeSlice.split("\n").length} lines):`,
        "```",
        codeSlice,
        "```",
        "\nContinue the code. Output ONLY the next lines to insert."
    ].filter(Boolean).join("\n");

    const raw = await callLLM(system, user, false); // fast model — cheap + quick

    // Strip any accidental markdown fences the model adds
    return raw
        .replace(/^```[\w]*\n?/m, "")
        .replace(/\n?```$/m, "")
        .trim();
}

// ── 2. explain_error ──────────────────────────────────────────────────────────
async function explainError({ errorMessage, fileContent, language, contextBlock }) {
    // Send only 40 lines around the error to save tokens
    const codeSnippet = fileContent.split("\n").slice(0, 40).join("\n");

    const system = `You are a ${language} debugging expert. Give a concise explanation and a specific code fix. Use the project context if provided.`;

    const user = [
        contextBlock ? `Project context:\n${contextBlock}\n` : "",
        `Error:\n${errorMessage}`,
        `\nRelevant code:\n\`\`\`${language}\n${codeSnippet}\n\`\`\``,
        "\nRespond in this format:",
        "## What went wrong",
        "(1-2 sentences)",
        "## Fix",
        "```",
        "(corrected code snippet)",
        "```",
        "## Why",
        "(1 sentence)"
    ].filter(Boolean).join("\n");

    return callLLM(system, user, false); // fast model is fine for error explanation
}

// ── 3. review_code ────────────────────────────────────────────────────────────
async function reviewCode({ fileContent, language, contextBlock }) {
    // Truncate large files — send max 100 lines to keep tokens reasonable
    const lines = fileContent.split("\n");
    const codeToReview = lines.slice(0, 100).join("\n");
    const truncated = lines.length > 100;

    const system = `You are a senior ${language} code reviewer. Review against the project context and best practices. Be specific and actionable. Skip praise unless genuinely notable.`;

    const user = [
        contextBlock ? `Project context:\n${contextBlock}\n` : "",
        `Code to review${truncated ? ` (first 100 of ${lines.length} lines)` : ""}:`,
        `\`\`\`${language}\n${codeToReview}\n\`\`\``,
        "\nProvide a structured review:",
        "## Issues (must fix)",
        "## Suggestions (should consider)",
        "## Positives (only if genuinely good)"
    ].filter(Boolean).join("\n");

    return callLLM(system, user, true); // quality model — review needs depth
}

module.exports = { suggestNextCode, explainError, reviewCode };
