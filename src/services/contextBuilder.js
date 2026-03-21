// src/services/contextBuilder.js
const OpenAI = require("openai");
const config = require("../config");
const session = require("../session/manager");

const client = new OpenAI({ apiKey: config.openaiApiKey });

// Builds the [Project context] block prepended to every enhanced prompt
async function buildContextBlock(sessionId) {
  const turns    = session.getRecentTurns(sessionId, config.maxTurnsInContext);
  const snapshot = session.getLatestSnapshot(sessionId);
  const facts    = session.getPinnedFacts(sessionId);
  const turnCount = session.getTurnCount(sessionId);

  // Decide if we need a fresh summary
  const lastSummaryAt = snapshot?.turn_index ?? 0;
  const needsNewSummary =
    turns.length > 0 &&
    (turnCount - lastSummaryAt) >= config.summaryEveryNTurns;

  let summary    = snapshot?.summary    ?? null;
  let activeTask = snapshot?.active_task ?? null;

  if (needsNewSummary) {
    const result = await generateSummary(turns, snapshot);
    summary    = result.summary;
    activeTask = result.activeTask;
    session.saveSnapshot(sessionId, summary, activeTask, turnCount);
  }

  // Compose the context block
  const parts = ["[Project context]"];

  if (summary)    parts.push(`History: ${summary}`);
  if (activeTask) parts.push(`Current task: ${activeTask}`);

  if (facts.length > 0) {
    parts.push("Pinned facts:");
    facts.forEach(f => parts.push(`  - ${f.fact}`));
  }

  if (parts.length === 1) return null; // no context yet — first turn

  return parts.join("\n");
}

async function generateSummary(turns, previousSnapshot) {
  const history = turns
    .map(t => `${t.role.toUpperCase()}: ${t.content}`)
    .join("\n\n");

  const prevSummary = previousSnapshot?.summary
    ? `Previous summary: ${previousSnapshot.summary}\n\n`
    : "";

  const response = await client.chat.completions.create({
    model: config.summariserModel,
    max_tokens: 300,
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content: `You are a project context tracker. Given a conversation, extract:
1. A 2-3 sentence summary of the project and what has been discussed
2. The current active task (one sentence)

Respond in this exact JSON format:
{"summary": "...", "activeTask": "..."}`
      },
      {
        role: "user",
        content: `${prevSummary}Recent conversation:\n${history}`
      }
    ]
  });

  try {
    const raw = response.choices[0].message.content.trim();
    const clean = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return { summary: "Context available but could not be parsed.", activeTask: null };
  }
}

module.exports = { buildContextBlock };