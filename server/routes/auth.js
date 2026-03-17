import { Router } from 'express'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import nodemailer from 'nodemailer'
import pool from '../db.js'
import { signToken, requireAuth } from '../middleware/auth.js'

const router = Router()

router.post('/signup', async (req, res) => {
  const { email, password, username, character, fitnessProfile, unlockedClasses } = req.body
  if (!email || !password || !username) return res.status(400).json({ error: 'Missing fields' })

  try {
    const hash = await bcrypt.hash(password, 10)
    const initialUnlocked = Array.isArray(unlockedClasses) && unlockedClasses.length === 2
      ? unlockedClasses
      : ['warrior', 'mage']

    const { rows: [{ id }] } = await pool.query(
      `INSERT INTO users (username, email, password_hash, character, equipped, inventory, total_xp, points, fitness_profile, unlocked_classes)
       VALUES ($1, $2, $3, $4, '{}', '[]', 0, 100, $5, $6) RETURNING id`,
      [username, email, hash, JSON.stringify(character || {}), JSON.stringify(fitnessProfile || {}), JSON.stringify(initialUnlocked)]
    )
    const user = (await pool.query('SELECT * FROM users WHERE id = $1', [id])).rows[0]
    const token = signToken({ id: user.id, username: user.username })
    res.json({ token, user: sanitizeUser(user) })
  } catch (e) {
    if (e.message.includes('unique') || e.code === '23505') return res.status(400).json({ error: 'Username or email already taken' })
    res.status(500).json({ error: e.message })
  }
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE email = $1 OR LOWER(username) = LOWER($2)',
    [email, email]
  )
  const user = rows[0]
  if (!user) return res.status(401).json({ error: 'Invalid username/email or password' })

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) return res.status(401).json({ error: 'Invalid email or password' })

  const token = signToken({ id: user.id, username: user.username })
  res.json({ token, user: sanitizeUser(user) })
})

router.get('/me', requireAuth, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id])
  if (!rows[0]) return res.status(404).json({ error: 'User not found' })
  res.json(sanitizeUser(rows[0]))
})

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email])
  if (!rows[0]) return res.json({ message: 'If that email exists, a reset link was sent.' })
  const user = rows[0]

  const token = crypto.randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 1000 * 60 * 60).toISOString()
  await pool.query(
    'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [user.id, token, expires]
  )

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

  const { rows } = await pool.query(
    'SELECT * FROM password_reset_tokens WHERE token = $1 AND used = 0',
    [token]
  )
  const record = rows[0]
  if (!record) return res.status(400).json({ error: 'Invalid or expired reset link.' })
  if (new Date(record.expires_at) < new Date()) return res.status(400).json({ error: 'Reset link has expired.' })

  const hash = await bcrypt.hash(password, 10)
  await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, record.user_id])
  await pool.query('UPDATE password_reset_tokens SET used = 1 WHERE id = $1', [record.id])

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
    unlocked_classes: JSON.parse(safe.unlocked_classes || '["warrior","mage"]'),
    owned_pets: JSON.parse(safe.owned_pets || '[]'),
    custom_exercises: JSON.parse(safe.custom_exercises || '{}'),
  }
}

export default router
