// src/tools/pinFact.js
const { resolveSessionId, getOrCreateSession, savePinnedFact } = require("../session/manager");

const pinFactTool = {
  name: "pin_fact",
  description: "Pin an important fact to remember across the entire project session",

  inputSchema: {
    type: "object",
    properties: {
      fact:       { type: "string", description: "The fact to remember" },
      session_id: { type: "string", description: "Optional. Auto-detected if omitted." }
    },
    required: ["fact"]
  },

  execute: async ({ fact, session_id }) => {
    const sid = resolveSessionId(session_id);
    getOrCreateSession(sid);
    savePinnedFact(sid, fact);

    return {
      content: [{
        type: "text",
        text: `Fact pinned to session "${sid}": "${fact}"`
      }]
    };
  }
};

module.exports = { pinFactTool };