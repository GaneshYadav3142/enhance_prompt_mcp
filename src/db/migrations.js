// src/db/migrations.js
const MIGRATIONS = [
  {
    version: 1,
    sql: `
      CREATE TABLE IF NOT EXISTS sessions (
        id          TEXT    PRIMARY KEY,
        name        TEXT,
        project_root TEXT,
        stack       TEXT,
        created_at  INTEGER NOT NULL,
        last_active INTEGER NOT NULL,
        is_active   INTEGER NOT NULL DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS turns (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id  TEXT    NOT NULL REFERENCES sessions(id),
        role        TEXT    NOT NULL,
        content     TEXT    NOT NULL,
        created_at  INTEGER NOT NULL,
        token_count INTEGER
      );

      CREATE TABLE IF NOT EXISTS context_snapshots (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id  TEXT    NOT NULL REFERENCES sessions(id),
        summary     TEXT    NOT NULL,
        active_task TEXT,
        turn_index  INTEGER NOT NULL,
        created_at  INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS pinned_facts (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id  TEXT    NOT NULL REFERENCES sessions(id),
        fact        TEXT    NOT NULL,
        created_at  INTEGER NOT NULL
      );
    `
  }
];

function runMigrations(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      version INTEGER PRIMARY KEY
    )
  `);

  for (const m of MIGRATIONS) {
    const already = db
      .prepare("SELECT 1 FROM _migrations WHERE version = ?")
      .get(m.version);

    if (!already) {
      db.exec(m.sql);
      db.prepare("INSERT INTO _migrations VALUES (?)").run(m.version);
      console.error(`[db] migration v${m.version} applied`);
    }
  }
}

module.exports = { runMigrations };