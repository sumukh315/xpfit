import { Router } from 'express'
import pool from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

function parseProfile(u) {
  return {
    ...u,
    character: JSON.parse(u.character || '{}'),
    equipped: JSON.parse(u.equipped || '{}'),
    inventory: JSON.parse(u.inventory || '[]'),
    fitness_profile: JSON.parse(u.fitness_profile || '{}'),
    unlocked_classes: JSON.parse(u.unlocked_classes || '["warrior","mage"]'),
    owned_pets: JSON.parse(u.owned_pets || '[]'),
    custom_exercises: JSON.parse(u.custom_exercises || '{}'),
  }
}

router.patch('/me', async (req, res) => {
  const allowed = [
    'character', 'equipped', 'inventory', 'points', 'discord_webhook',
    'fitness_profile', 'unlocked_classes', 'owned_pets', 'active_pet', 'pr_points', 'custom_exercises',
  ]
  const updates = {}
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      updates[key] = typeof req.body[key] === 'object' ? JSON.stringify(req.body[key]) : req.body[key]
    }
  }
  if (!Object.keys(updates).length) return res.status(400).json({ error: 'Nothing to update' })

  const keys = Object.keys(updates)
  const values = Object.values(updates)
  const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ')
  await pool.query(
    `UPDATE users SET ${setClause} WHERE id = $${keys.length + 1}`,
    [...values, req.user.id]
  )

  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id])
  const { password_hash, ...safe } = rows[0]
  res.json(parseProfile(safe))
})

router.get('/search', async (req, res) => {
  const { q } = req.query
  if (!q) return res.json([])
  const { rows } = await pool.query(
    `SELECT id, username, total_xp, points, pr_points, character, equipped, active_pet FROM users
     WHERE username ILIKE $1 AND id != $2 LIMIT 10`,
    [`%${q}%`, req.user.id]
  )
  res.json(rows.map(u => ({
    ...u,
    character: JSON.parse(u.character || '{}'),
    equipped: JSON.parse(u.equipped || '{}'),
  })))
})

router.get('/:id', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, username, total_xp, points, pr_points, character, equipped, active_pet FROM users WHERE id = $1',
    [req.params.id]
  )
  if (!rows[0]) return res.status(404).json({ error: 'Not found' })
  res.json({
    ...rows[0],
    character: JSON.parse(rows[0].character || '{}'),
    equipped: JSON.parse(rows[0].equipped || '{}'),
  })
})

export default router
