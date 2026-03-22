// // src/session/manager.js
// const { execSync } = require("child_process");
// const path  = require("path");
// const crypto = require("crypto");
// const { getDb } = require("../db/client");
// const config = require("../config");

// // Derives a stable session ID from the git root or cwd
// function resolveSessionId(explicitId) {
//   if (explicitId) return explicitId;

//   try {
//     const gitRoot = execSync("git rev-parse --show-toplevel", {
//       cwd: process.cwd(),
//       stdio: "pipe"
//     }).toString().trim();

//     const name = path.basename(gitRoot);
//     const hash = crypto.createHash("sha1").update(gitRoot).digest("hex").slice(0, 6);
//     return `${name}-${hash}`;
//   } catch {
//     const name = path.basename(process.cwd());
//     return `${name}-default`;
//   }
// }

// function getOrCreateSession(sessionId) {
//   const db  = getDb();
//   const now = Date.now();

//   let session = db
//     .prepare("SELECT * FROM sessions WHERE id = ?")
//     .get(sessionId);

//   if (!session) {
//     db.prepare(`
//       INSERT INTO sessions (id, name, created_at, last_active, is_active)
//       VALUES (?, ?, ?, ?, 1)
//     `).run(sessionId, sessionId, now, now);

//     session = db
//       .prepare("SELECT * FROM sessions WHERE id = ?")
//       .get(sessionId);

//     console.error(`[session] created: ${sessionId}`);
//   } else {
//     db.prepare("UPDATE sessions SET last_active = ? WHERE id = ?")
//       .run(now, sessionId);
//   }

//   return session;
// }

// function getRecentTurns(sessionId, limit) {
//   const db = getDb();
//   return db.prepare(`
//     SELECT role, content FROM turns
//     WHERE session_id = ?
//     ORDER BY created_at DESC
//     LIMIT ?
//   `).all(sessionId, limit).reverse(); // oldest first
// }

// function getLatestSnapshot(sessionId) {
//   const db = getDb();
//   return db.prepare(`
//     SELECT * FROM context_snapshots
//     WHERE session_id = ?
//     ORDER BY created_at DESC
//     LIMIT 1
//   `).get(sessionId);
// }

// function getPinnedFacts(sessionId) {
//   const db = getDb();
//   return db.prepare(`
//     SELECT fact FROM pinned_facts
//     WHERE session_id = ?
//     ORDER BY created_at ASC
//   `).all(sessionId);
// }

// function saveTurn(sessionId, role, content) {
//   const db = getDb();
//   db.prepare(`
//     INSERT INTO turns (session_id, role, content, created_at)
//     VALUES (?, ?, ?, ?)
//   `).run(sessionId, role, content, Date.now());
// }

// function saveSnapshot(sessionId, summary, activeTask, turnIndex) {
//   const db = getDb();
//   db.prepare(`
//     INSERT INTO context_snapshots (session_id, summary, active_task, turn_index, created_at)
//     VALUES (?, ?, ?, ?, ?)
//   `).run(sessionId, summary, activeTask ?? null, turnIndex, Date.now());
// }

// function savePinnedFact(sessionId, fact) {
//   const db = getDb();
//   db.prepare(`
//     INSERT INTO pinned_facts (session_id, fact, created_at)
//     VALUES (?, ?, ?)
//   `).run(sessionId, fact, Date.now());
// }

// function getTurnCount(sessionId) {
//   const db = getDb();
//   const row = db.prepare("SELECT COUNT(*) as cnt FROM turns WHERE session_id = ?").get(sessionId);
//   return row.cnt;
// }

// module.exports = {
//   resolveSessionId,
//   getOrCreateSession,
//   getRecentTurns,
//   getLatestSnapshot,
//   getPinnedFacts,
//   saveTurn,
//   saveSnapshot,
//   savePinnedFact,
//   getTurnCount,
// };





// src/session/manager.js
const path = require("path");
const crypto = require("crypto");
const { getDb } = require("../db/client");

// ─────────────────────────────────────────────────────────────────────────────
// resolveSessionId
//
// Priority order:
//   1. Explicit session_id passed by user  → use it directly
//   2. Git root detected                   → derive stable ID from repo name
//   3. Nothing                             → return null (caller must handle)
//
// We NO LONGER fall back to foldername-default because that causes
// all non-git projects to share the same session ID, corrupting context.
// ─────────────────────────────────────────────────────────────────────────────
function resolveSessionId(explicitId) {
  // 1. User explicitly named the session — always use this
  if (explicitId && explicitId.trim() !== "") {
    return slugify(explicitId.trim());
  }

  // 2. Try git root as a stable automatic identifier
  try {
    const { execSync } = require("child_process");
    const gitRoot = execSync("git rev-parse --show-toplevel", {
      cwd: process.cwd(),
      stdio: "pipe"
    }).toString().trim();

    const name = path.basename(gitRoot);
    const hash = crypto.createHash("sha1").update(gitRoot).digest("hex").slice(0, 6);
    return `${slugify(name)}-${hash}`;
  } catch {
    // Not a git repo — return null so the tool can ask the user to provide a name
    return null;
  }
}

// Converts "My Novel Project!" → "my-novel-project"
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ─────────────────────────────────────────────────────────────────────────────
// getOrCreateSession
// ─────────────────────────────────────────────────────────────────────────────
function getOrCreateSession(sessionId) {
  const db = getDb();
  const now = Date.now();

  let session = db
    .prepare("SELECT * FROM sessions WHERE id = ?")
    .get(sessionId);

  if (!session) {
    db.prepare(`
      INSERT INTO sessions (id, name, created_at, last_active, is_active)
      VALUES (?, ?, ?, ?, 1)
    `).run(sessionId, sessionId, now, now);

    session = db
      .prepare("SELECT * FROM sessions WHERE id = ?")
      .get(sessionId);

    console.error(`[session] created: ${sessionId}`);
  } else {
    db.prepare("UPDATE sessions SET last_active = ? WHERE id = ?")
      .run(now, sessionId);
  }

  return session;
}

function getRecentTurns(sessionId, limit) {
  const db = getDb();
  return db.prepare(`
    SELECT role, content FROM turns
    WHERE session_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `).all(sessionId, limit).reverse();
}

function getLatestSnapshot(sessionId) {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM context_snapshots
    WHERE session_id = ?
    ORDER BY created_at DESC
    LIMIT 1
  `).get(sessionId);
}

function getPinnedFacts(sessionId) {
  const db = getDb();
  return db.prepare(`
    SELECT fact FROM pinned_facts
    WHERE session_id = ?
    ORDER BY created_at ASC
  `).all(sessionId);
}

function saveTurn(sessionId, role, content) {
  const db = getDb();
  db.prepare(`
    INSERT INTO turns (session_id, role, content, created_at)
    VALUES (?, ?, ?, ?)
  `).run(sessionId, role, content, Date.now());
}

function saveSnapshot(sessionId, summary, activeTask, turnIndex) {
  const db = getDb();
  db.prepare(`
    INSERT INTO context_snapshots (session_id, summary, active_task, turn_index, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(sessionId, summary, activeTask ?? null, turnIndex, Date.now());
}

function savePinnedFact(sessionId, fact) {
  const db = getDb();
  db.prepare(`
    INSERT INTO pinned_facts (session_id, fact, created_at)
    VALUES (?, ?, ?)
  `).run(sessionId, fact, Date.now());
}

function getTurnCount(sessionId) {
  const db = getDb();
  const row = db.prepare("SELECT COUNT(*) as cnt FROM turns WHERE session_id = ?").get(sessionId);
  return row.cnt;
}

function listSessions() {
  const db = getDb();
  return db.prepare(`
    SELECT id, name, created_at, last_active
    FROM sessions
    WHERE is_active = 1
    ORDER BY last_active DESC
  `).all();
}

module.exports = {
  resolveSessionId,
  getOrCreateSession,
  getRecentTurns,
  getLatestSnapshot,
  getPinnedFacts,
  saveTurn,
  saveSnapshot,
  savePinnedFact,
  getTurnCount,
  listSessions,
};
