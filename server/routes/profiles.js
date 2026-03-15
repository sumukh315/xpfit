import { Router } from 'express'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

router.patch('/me', (req, res) => {
  const allowed = ['character', 'equipped', 'inventory', 'points', 'discord_webhook', 'fitness_profile']
  const updates = {}
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      updates[key] = typeof req.body[key] === 'object' ? JSON.stringify(req.body[key]) : req.body[key]
    }
  }
  if (!Object.keys(updates).length) return res.status(400).json({ error: 'Nothing to update' })

  const setClause = Object.keys(updates).map(k => `${k} = ?`).join(', ')
  db.prepare(`UPDATE users SET ${setClause} WHERE id = ?`).run(...Object.values(updates), req.user.id)

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)
  const { password_hash, ...safe } = user
  res.json({
    ...safe,
    character: JSON.parse(safe.character || '{}'),
    equipped: JSON.parse(safe.equipped || '{}'),
    inventory: JSON.parse(safe.inventory || '[]'),
    fitness_profile: JSON.parse(safe.fitness_profile || '{}'),
  })
})

router.get('/search', (req, res) => {
  const { q } = req.query
  if (!q) return res.json([])
  const users = db.prepare(`
    SELECT id, username, total_xp, points, character, equipped FROM users
    WHERE username LIKE ? AND id != ?
    LIMIT 10
  `).all(`%${q}%`, req.user.id)
  res.json(users.map(u => ({
    ...u,
    character: JSON.parse(u.character || '{}'),
    equipped: JSON.parse(u.equipped || '{}'),
  })))
})

router.get('/:id', (req, res) => {
  const user = db.prepare(`
    SELECT id, username, total_xp, points, character, equipped FROM users WHERE id = ?
  `).get(req.params.id)
  if (!user) return res.status(404).json({ error: 'Not found' })
  res.json({
    ...user,
    character: JSON.parse(user.character || '{}'),
    equipped: JSON.parse(user.equipped || '{}'),
  })
})

export default router
