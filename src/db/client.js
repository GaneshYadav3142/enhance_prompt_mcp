// src/db/client.js
const Database  = require("better-sqlite3");
const config    = require("../config");
const { runMigrations } = require("./migrations");

let _db = null;

function getDb() {
  if (_db) return _db;
  _db = new Database(config.dbPath);
  _db.pragma("journal_mode = WAL"); // safe for concurrent reads
  _db.pragma("foreign_keys = ON");
  runMigrations(_db);
  return _db;
}

module.exports = { getDb };