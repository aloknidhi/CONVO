// db.js - SQLite database setup for CONVO chat application
// Uses sql.js (pure JavaScript SQLite via WebAssembly) - no native compilation required.
// Handles schema initialization and connection management with file persistence.

const path = require('path');
const fs = require('fs');
const SQL = require('sql.js');

// Ensure the data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Database file path
const DB_PATH = path.join(dataDir, 'convo.db');

// sql.js instance and database handle (initialized asynchronously)
let sql = null;
let db = null;

/**
 * Load existing database file or return null for a fresh database.
 * @returns {Uint8Array|null}
 */
function loadDbFile() {
  try {
    if (fs.existsSync(DB_PATH)) {
      return fs.readFileSync(DB_PATH);
    }
  } catch (_) {
    // ignore read errors, start fresh
  }
  return null;
}

/**
 * Persist the in-memory database to disk after writes.
 */
function persist() {
  try {
    const data = db.export();
    fs.writeFileSync(DB_PATH, data);
  } catch (err) {
    console.error('Failed to persist database:', err.message);
  }
}

/**
 * Get the last inserted row ID from the database.
 */
function lastInsertRowid() {
  try {
    const stmt = db.prepare('SELECT last_insert_rowid() AS lastID');
    let id = null;
    if (stmt.step()) {
      id = stmt.getAsObject().lastID;
    }
    stmt.free();
    return id;
  } catch (_) {
    return null;
  }
}

/**
 * Initialize sql.js and the database schema.
 * Creates tables if they don't exist:
 *   users         - user accounts
 *   conversations - chat rooms (direct or group)
 *   members       - conversation participants
 *   messages      - chat messages
 */
async function initSchema() {
  try {
    sql = await SQL(); // initialize sql.js with WebAssembly binary

    const existingData = loadDbFile();
    db = new sql.Database(existingData);

    const queries = [
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Conversations table (direct or group)
      `CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        is_group INTEGER DEFAULT 0,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Members table - many-to-many between users and conversations
      `CREATE TABLE IF NOT EXISTS members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(conversation_id, user_id)
      )`,

      // Messages table
      `CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id INTEGER NOT NULL,
        sender_id INTEGER NOT NULL,
        body TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        read_at DATETIME
      )`,
    ];

    queries.forEach((sqlStr) => {
      db.run(sqlStr);
    });

    console.log('Connected to sql.js database at', DB_PATH);
    console.log('Database schema initialized');
  } catch (err) {
    console.error('Database initialization error:', err.message);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Callback-style wrappers matching the interface used by route files
// (db.run, db.get, db.all with (sql, params, callback))
// ---------------------------------------------------------------------------

function run(sqlStr, params = [], callback) {
  try {
    db.run(sqlStr, params);
    persist(); // save to disk after every write
    // sql.js run() returns the db object, not {changes, lastInsertId}.
    // Query last_insert_rowid() so routes using `this.lastID` work.
    const resultWithLastID = { lastID: lastInsertRowid(), changes: 1 };
    if (callback) callback.call(resultWithLastID, null, resultWithLastID);
  } catch (err) {
    if (callback) callback(err);
  }
}

function get(sqlStr, params = [], callback) {
  try {
    const stmt = db.prepare(sqlStr);
    stmt.bind(params);
    let row = null;
    if (stmt.step()) {
      // getAsObject() returns { column: value } keyed by column name
      row = stmt.getAsObject();
    }
    stmt.free();
    if (callback) callback(null, row);
  } catch (err) {
    if (callback) callback(err);
  }
}

function all(sqlStr, params = [], callback) {
  try {
    const stmt = db.prepare(sqlStr);
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    if (callback) callback(null, rows);
  } catch (err) {
    if (callback) callback(err);
  }
}

// Expose a db-shaped object with run/get/all and the init function
module.exports = {
  db: { run, get, all },
  initSchema,
};
