import { Router } from 'express'
import bcrypt from 'bcryptjs'
import db from '../db.js'
import { signToken, requireAuth } from '../middleware/auth.js'

const router = Router()

router.post('/signup', async (req, res) => {
  const { email, password, username, character, fitnessProfile } = req.body
  if (!email || !password || !username) return res.status(400).json({ error: 'Missing fields' })

  try {
    const hash = await bcrypt.hash(password, 10)
    const stmt = db.prepare(`
      INSERT INTO users (username, email, password_hash, character, equipped, inventory, total_xp, points, fitness_profile)
      VALUES (?, ?, ?, ?, '{}', '[]', 0, 100, ?)
    `)
    const result = stmt.run(username, email, hash, JSON.stringify(character || {}), JSON.stringify(fitnessProfile || {}))
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid)
    const token = signToken({ id: user.id, username: user.username })
    res.json({ token, user: sanitizeUser(user) })
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(400).json({ error: 'Username or email already taken' })
    res.status(500).json({ error: e.message })
  }
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
  if (!user) return res.status(401).json({ error: 'Invalid email or password' })

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) return res.status(401).json({ error: 'Invalid email or password' })

  const token = signToken({ id: user.id, username: user.username })
  res.json({ token, user: sanitizeUser(user) })
})

router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)
  if (!user) return res.status(404).json({ error: 'User not found' })
  res.json(sanitizeUser(user))
})

function sanitizeUser(user) {
  const { password_hash, ...safe } = user
  return {
    ...safe,
    character: JSON.parse(safe.character || '{}'),
    equipped: JSON.parse(safe.equipped || '{}'),
    inventory: JSON.parse(safe.inventory || '[]'),
    fitness_profile: JSON.parse(safe.fitness_profile || '{}'),
  }
}

export default router
