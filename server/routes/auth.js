import { Router } from 'express'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import nodemailer from 'nodemailer'
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
  const user = db.prepare('SELECT * FROM users WHERE email = ? OR LOWER(username) = LOWER(?)').get(email, email)
  if (!user) return res.status(401).json({ error: 'Invalid username/email or password' })

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

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
  if (!user) return res.json({ message: 'If that email exists, a reset link was sent.' })

  const token = crypto.randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 1000 * 60 * 60).toISOString() // 1 hour
  db.prepare('INSERT OR REPLACE INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)').run(user.id, token, expires)

  const siteUrl = process.env.SITE_URL || 'http://localhost:5173'
  const resetLink = `${siteUrl}/reset-password?token=${token}`

  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    })
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'XPFit — Reset Your Password',
      html: `<p>Click below to reset your password. This link expires in 1 hour.</p><p><a href="${resetLink}">${resetLink}</a></p>`,
    }).catch(e => console.error('Email error:', e))
  } else {
    console.log('Password reset link (no email configured):', resetLink)
  }

  res.json({ message: 'If that email exists, a reset link was sent.' })
})

router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body
  if (!token || !password) return res.status(400).json({ error: 'Missing fields' })

  const record = db.prepare('SELECT * FROM password_reset_tokens WHERE token = ? AND used = 0').get(token)
  if (!record) return res.status(400).json({ error: 'Invalid or expired reset link.' })
  if (new Date(record.expires_at) < new Date()) return res.status(400).json({ error: 'Reset link has expired.' })

  const hash = await bcrypt.hash(password, 10)
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, record.user_id)
  db.prepare('UPDATE password_reset_tokens SET used = 1 WHERE id = ?').run(record.id)

  res.json({ message: 'Password updated successfully.' })
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
