// src/config.js
const path = require("path");
const os   = require("os");
const fs   = require("fs");

const dataDir = path.join(os.homedir(), ".prompt-architect");
fs.mkdirSync(dataDir, { recursive: true }); // auto-create on first run

if (!process.env.OPENAI_API_KEY) {
  console.error("[prompt-architect] ERROR: OPENAI_API_KEY is not set.");
  process.exit(1);
}

const config = {
  openaiApiKey:       process.env.OPENAI_API_KEY,
  dataDir,
  dbPath:             path.join(dataDir, "sessions.db"),
  sessionTtlDays:     Number(process.env.PA_SESSION_TTL_DAYS     ?? 30),
  maxTurnsInContext:  Number(process.env.PA_MAX_TURNS_IN_CONTEXT  ?? 20),
  summaryEveryNTurns: Number(process.env.PA_SUMMARY_EVERY_N_TURNS ?? 5),
  summariserModel:    process.env.PA_SUMMARISER_MODEL ?? "gpt-4o-mini",
  enhancerModel:      process.env.PA_ENHANCER_MODEL  ?? "gpt-4o",
};

module.exports = config;