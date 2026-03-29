// // src/config.js
// const path = require("path");
// const os = require("os");
// const fs = require("fs");

// const dataDir = path.join(os.homedir(), ".prompt-architect");
// fs.mkdirSync(dataDir, { recursive: true });

// if (!process.env.OPENAI_API_KEY) {
//   console.error("[prompt-architect] ERROR: OPENAI_API_KEY is not set.");
//   process.exit(1);
// }

// const config = {
//   openaiApiKey: process.env.OPENAI_API_KEY,
//   dataDir,
//   dbPath: path.join(dataDir, "sessions.db"),
//   sessionTtlDays: Number(process.env.PA_SESSION_TTL_DAYS ?? 30),
//   maxTurnsInContext: Number(process.env.PA_MAX_TURNS_IN_CONTEXT ?? 20),
//   summaryEveryNTurns: Number(process.env.PA_SUMMARY_EVERY_N_TURNS ?? 5),
//   summariserModel: process.env.PA_SUMMARISER_MODEL ?? "gpt-4o-mini",
//   enhancerModel: process.env.PA_ENHANCER_MODEL ?? "gpt-4o",
// };

// module.exports = config;

const path = require("path");
const os = require("os");
const fs = require("fs");

const dataDir = path.join(os.homedir(), ".prompt-architect");
fs.mkdirSync(dataDir, { recursive: true });

const hasOpenAI = !!process.env.OPENAI_API_KEY;
const hasGemini = !!process.env.GEMINI_API_KEY;

if (!hasOpenAI && !hasGemini) {
  console.error(
    "[prompt-architect] ERROR: No API key found.\n" +
    "Set OPENAI_API_KEY or GEMINI_API_KEY (or both) in your MCP config env block.\n" +
    "If both are set, OpenAI is used by default."
  );
  process.exit(1);
}


const provider = hasOpenAI ? "openai" : "gemini";

const config = {
  // Keys
  openaiApiKey: process.env.OPENAI_API_KEY ?? null,
  geminiApiKey: process.env.GEMINI_API_KEY ?? null,

  // Active provider
  provider,

  // Storage
  dataDir,
  dbPath: path.join(dataDir, "sessions.db"),

  // Session settings
  sessionTtlDays: Number(process.env.PA_SESSION_TTL_DAYS ?? 30),
  maxTurnsInContext: Number(process.env.PA_MAX_TURNS_IN_CONTEXT ?? 20),
  summaryEveryNTurns: Number(process.env.PA_SUMMARY_EVERY_N_TURNS ?? 5),

  // Models — auto-select based on provider if not explicitly set
  summariserModel: process.env.PA_SUMMARISER_MODEL ??
    (hasOpenAI ? "gpt-4o-mini" : "gemini-1.5-flash"),

  enhancerModel: process.env.PA_ENHANCER_MODEL ??
    (hasOpenAI ? "gpt-4o" : "gemini-1.5-pro"),
};

console.error(
  `[prompt-architect] provider: ${provider} | ` +
  `enhancer: ${config.enhancerModel} | ` +
  `summariser: ${config.summariserModel}`
);

module.exports = config;
