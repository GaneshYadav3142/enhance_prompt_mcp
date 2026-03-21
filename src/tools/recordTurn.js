// src/tools/recordTurn.js
const { resolveSessionId, getOrCreateSession, saveTurn } = require("../session/manager");

const recordTurnTool = {
  name: "record_turn",
  description: "Record a conversation turn (user prompt + LLM response) to build session context",

  inputSchema: {
    type: "object",
    properties: {
      user_message:      { type: "string", description: "What the user sent" },
      assistant_message: { type: "string", description: "What the LLM responded" },
      session_id:        { type: "string", description: "Optional. Auto-detected if omitted." }
    },
    required: ["user_message", "assistant_message"]
  },

  execute: async ({ user_message, assistant_message, session_id }) => {
    const sid = resolveSessionId(session_id);
    getOrCreateSession(sid);
    saveTurn(sid, "user",      user_message);
    saveTurn(sid, "assistant", assistant_message);

    return {
      content: [{
        type: "text",
        text: `Turn recorded for session "${sid}".`
      }]
    };
  }
};

module.exports = { recordTurnTool };