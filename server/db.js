import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dbPath = process.env.DB_PATH || join(__dirname, 'xpfit.db')
const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    total_xp INTEGER DEFAULT 0,
    points INTEGER DEFAULT 100,
    character TEXT DEFAULT '{}',
    equipped TEXT DEFAULT '{}',
    inventory TEXT DEFAULT '[]',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS workouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    exercises TEXT DEFAULT '[]',
    notes TEXT,
    photo_url TEXT,
    xp_earned INTEGER DEFAULT 0,
    points_earned INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS friendships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted')),
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, friend_id)
  );

  CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    used INTEGER DEFAULT 0
  );
`)

// Add new columns if they don't exist yet
for (const sql of [
  "ALTER TABLE users ADD COLUMN fitness_profile TEXT DEFAULT '{}'",
  "ALTER TABLE users ADD COLUMN discord_webhook TEXT DEFAULT NULL",
  "ALTER TABLE workouts ADD COLUMN start_time TEXT DEFAULT NULL",
  "ALTER TABLE workouts ADD COLUMN end_time TEXT DEFAULT NULL",
  "ALTER TABLE workouts ADD COLUMN duration_minutes INTEGER DEFAULT NULL",
  `ALTER TABLE users ADD COLUMN unlocked_classes TEXT DEFAULT '["warrior","mage"]'`,
]) {
  try { db.exec(sql) } catch (_) {}
}

export default db
