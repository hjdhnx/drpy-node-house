import { Database } from 'bun:sqlite';
import path from 'path';
import fs from 'fs';
import config from './config.js';

// Ensure data directory exists
if (!fs.existsSync(config.paths.data)) {
  fs.mkdirSync(config.paths.data, { recursive: true });
}

const dbPath = path.join(config.paths.data, config.db.filename);
const db = new Database(dbPath);

// Initialize tables
// Users Table
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
  )
`);

// Files Table (Add user_id and is_public if not exists)
// SQLite ALTER TABLE limitations: cannot add multiple columns or check IF NOT EXISTS easily in one go.
// But for simplicity in dev, we can create if not exists, and alter if missing.
db.run(`
  CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cid TEXT NOT NULL,
    filename TEXT NOT NULL,
    mimetype TEXT,
    size INTEGER,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    user_id INTEGER,
    is_public INTEGER DEFAULT 1,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )
`);

// Check if columns exist (migration for existing DB)
try {
  db.run('ALTER TABLE files ADD COLUMN user_id INTEGER REFERENCES users(id)');
} catch (e) {
  // Column likely exists
}

try {
  db.run('ALTER TABLE files ADD COLUMN is_public INTEGER DEFAULT 1');
} catch (e) {
  // Column likely exists
}

console.log(`Database connected at ${dbPath}`);

export default db;
