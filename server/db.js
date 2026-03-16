import pkg from 'pg'
const { Pool } = pkg

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is not set')
  process.exit(1)
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

try {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      total_xp INTEGER DEFAULT 0,
      points INTEGER DEFAULT 100,
      character TEXT DEFAULT '{}',
      equipped TEXT DEFAULT '{}',
      inventory TEXT DEFAULT '[]',
      fitness_profile TEXT DEFAULT '{}',
      discord_webhook TEXT DEFAULT NULL,
      unlocked_classes TEXT DEFAULT '["warrior","mage"]',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS workouts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      exercises TEXT DEFAULT '[]',
      notes TEXT,
      photo_url TEXT,
      xp_earned INTEGER DEFAULT 0,
      points_earned INTEGER DEFAULT 0,
      start_time TIMESTAMPTZ DEFAULT NULL,
      end_time TIMESTAMPTZ DEFAULT NULL,
      duration_minutes INTEGER DEFAULT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS friendships (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      friend_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted')),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, friend_id)
    );

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      used INTEGER DEFAULT 0
    );
  `)
  console.log('Database connected and tables ready')
} catch (e) {
  console.error('Database init error:', e.message)
  process.exit(1)
}

export default pool
