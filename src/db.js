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
    role TEXT DEFAULT 'user', -- 'admin', 'user'
    status TEXT DEFAULT 'active', -- 'active', 'pending', 'banned'
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
  )
`);

// Settings Table
db.run(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  )
`);

// Invites Table
db.run(`
  CREATE TABLE IF NOT EXISTS invites (
    code TEXT PRIMARY KEY,
    created_by INTEGER,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    max_uses INTEGER DEFAULT 1,
    used_count INTEGER DEFAULT 0,
    expires_at INTEGER,
    FOREIGN KEY(created_by) REFERENCES users(id)
  )
`);

// Notifications Table
db.run(`
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'system', -- 'system', 'approval', 'account'
    is_read INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    link TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
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
} catch (e) {}

try {
  db.run('ALTER TABLE files ADD COLUMN is_public INTEGER DEFAULT 1');
} catch (e) {}

try {
  db.run('ALTER TABLE files ADD COLUMN tags TEXT');
} catch (e) {}

// Migrate Users table
try {
  db.run("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'");
} catch (e) {}

try {
  db.run("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active'");
} catch (e) {}

try {
  db.run("ALTER TABLE users ADD COLUMN reason TEXT");
} catch (e) {}

// Seed default settings
const defaultSettings = {
  registration_policy: 'open', // open, closed, approval, invite
  allowed_extensions: '.json,.txt,.py,.php,.js,.m3u',
  max_file_size: '204800', // 200KB in bytes
  allowed_tags: 'ds,dr2,cat,php,hipy',
  anonymous_upload: 'false',
  anonymous_preview: 'false',
  anonymous_download: 'false',
  site_copyright: 'Copyright © 2026 Drpy Node House. All Rights Reserved.',
  site_icp: '京ICP备88888888号-1'
};

for (const [key, value] of Object.entries(defaultSettings)) {
  db.run('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', key, value);
}

console.log(`Database connected at ${dbPath}`);

export default db;
