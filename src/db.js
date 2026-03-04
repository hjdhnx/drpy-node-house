import { Database } from 'bun:sqlite';
import path from 'path';
import fs from 'fs';
import config, { DEFAULT_SETTINGS } from './config.js';

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
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    notify_on_reply INTEGER DEFAULT 1,
    notify_on_comment INTEGER DEFAULT 1
  )
`);

try {
  db.run("ALTER TABLE users ADD COLUMN notify_on_reply INTEGER DEFAULT 1");
  db.run("ALTER TABLE users ADD COLUMN notify_on_comment INTEGER DEFAULT 1");
} catch (e) {}

try {
  db.run("ALTER TABLE users ADD COLUMN notify_on_mention INTEGER DEFAULT 1");
} catch (e) {}

try {
  db.run("ALTER TABLE users ADD COLUMN show_scroll_buttons INTEGER DEFAULT 0");
} catch (e) {}

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

// Forum Topics Table
db.run(`
  CREATE TABLE IF NOT EXISTS topics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now')),
    views INTEGER DEFAULT 0,
    is_pinned INTEGER DEFAULT 0,
    is_featured INTEGER DEFAULT 0,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )
`);

try {
  db.run("ALTER TABLE topics ADD COLUMN is_featured INTEGER DEFAULT 0");
} catch (e) {}

// Forum Comments Table
db.run(`
  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    parent_id INTEGER,
    FOREIGN KEY(topic_id) REFERENCES topics(id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(parent_id) REFERENCES comments(id) ON DELETE SET NULL
  )
`);

try {
  db.run("ALTER TABLE comments ADD COLUMN parent_id INTEGER REFERENCES comments(id) ON DELETE SET NULL");
} catch (e) {}

// Chat Messages Table
db.run(`
  CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    room TEXT DEFAULT 'general',
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
  db.run("ALTER TABLE users ADD COLUMN nickname TEXT");
} catch (e) {}

try {
  db.run("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_nickname ON users(nickname)");
} catch (e) {}

try {
  db.run("ALTER TABLE users ADD COLUMN qq TEXT");
} catch (e) {}

try {
  db.run("ALTER TABLE users ADD COLUMN email TEXT");
} catch (e) {}

try {
  db.run("ALTER TABLE users ADD COLUMN phone TEXT");
} catch (e) {}

try {
  db.run("ALTER TABLE users ADD COLUMN download_preference TEXT DEFAULT 'default'");
} catch (e) {}

try {
  db.run("ALTER TABLE users ADD COLUMN reason TEXT");
} catch (e) {}

try {
  db.run("ALTER TABLE users ADD COLUMN registration_ip TEXT");
} catch (e) {}

try {
  db.run("ALTER TABLE users ADD COLUMN points INTEGER DEFAULT 0");
} catch (e) {}

try {
  db.run("ALTER TABLE users ADD COLUMN last_checkin_date TEXT");
} catch (e) {}

// User Points History Table
db.run(`
  CREATE TABLE IF NOT EXISTS user_points_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    amount INTEGER NOT NULL,
    reason TEXT NOT NULL,
    related_id INTEGER,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY(user_id) REFERENCES users(id)
  )
`);

// Topic Purchases Table
db.run(`
  CREATE TABLE IF NOT EXISTS topic_purchases (
    user_id INTEGER NOT NULL,
    topic_id INTEGER NOT NULL,
    amount INTEGER NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    PRIMARY KEY (user_id, topic_id),
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(topic_id) REFERENCES topics(id)
  )
`);

try {
  db.run("ALTER TABLE topics ADD COLUMN view_permission_level INTEGER DEFAULT 0");
} catch (e) {}

try {
  db.run("ALTER TABLE topics ADD COLUMN view_points_required INTEGER DEFAULT 0");
} catch (e) {}

try {
  db.run("ALTER TABLE topics ADD COLUMN bounty_points INTEGER DEFAULT 0");
} catch (e) {}

try {
  db.run("ALTER TABLE topics ADD COLUMN is_solved INTEGER DEFAULT 0");
} catch (e) {}

try {
  db.run("ALTER TABLE topics ADD COLUMN solved_comment_id INTEGER");
} catch (e) {}

// Seed default settings
for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
  db.run('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', key, value);
}

console.log(`Database connected at ${dbPath}`);

export default db;
