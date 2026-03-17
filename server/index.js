import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import pool from './db.js'
import authRoutes from './routes/auth.js'
import workoutRoutes from './routes/workouts.js'
import profileRoutes from './routes/profiles.js'
import socialRoutes from './routes/social.js'
import feedbackRoutes from './routes/feedback.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(join(__dirname, 'uploads')))

// Admin routes
app.get('/api/admin/users', async (req, res) => {
  if (req.headers['x-admin-secret'] !== (process.env.ADMIN_SECRET || 'xpfit-admin')) return res.status(403).json({ error: 'Forbidden' })
  const { rows } = await pool.query('SELECT id, username, email, created_at FROM users')
  res.json(rows)
})

app.delete('/api/admin/user/:username', async (req, res) => {
  if (req.headers['x-admin-secret'] !== (process.env.ADMIN_SECRET || 'xpfit-admin')) return res.status(403).json({ error: 'Forbidden' })
  const { rowCount } = await pool.query('DELETE FROM users WHERE username = $1', [req.params.username])
  res.json({ deleted: rowCount })
})

app.post('/api/admin/reset-password', async (req, res) => {
  if (req.headers['x-admin-secret'] !== (process.env.ADMIN_SECRET || 'xpfit-admin')) return res.status(403).json({ error: 'Forbidden' })
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ error: 'Missing username or password' })
  const hash = await bcrypt.hash(password, 10)
  const { rowCount } = await pool.query(
    'UPDATE users SET password_hash = $1 WHERE LOWER(username) = LOWER($2)',
    [hash, username]
  )
  res.json({ updated: rowCount })
})

app.get('/health', (req, res) => res.json({ ok: true }))

app.use('/api/auth', authRoutes)
app.use('/api/workouts', workoutRoutes)
app.use('/api/profiles', profileRoutes)
app.use('/api/social', socialRoutes)
app.use('/api/feedback', feedbackRoutes)

app.listen(PORT, () => console.log(`XPFit server running on http://localhost:${PORT}`))
