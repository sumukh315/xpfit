import { Router } from 'express'
import pool from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

router.get('/friends', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT u.id, u.username, u.total_xp, u.points, u.character, u.equipped
     FROM friendships f
     JOIN users u ON u.id = f.friend_id
     WHERE f.user_id = $1 AND f.status = 'accepted'`,
    [req.user.id]
  )
  res.json(rows.map(u => ({
    ...u,
    character: JSON.parse(u.character || '{}'),
    equipped: JSON.parse(u.equipped || '{}'),
  })))
})

router.get('/pending', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT u.id, u.username, u.character
     FROM friendships f
     JOIN users u ON u.id = f.friend_id
     WHERE f.user_id = $1 AND f.status = 'pending'`,
    [req.user.id]
  )
  res.json(rows.map(u => ({ ...u, character: JSON.parse(u.character || '{}') })))
})

router.get('/requests', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT u.id, u.username, u.total_xp, u.character
     FROM friendships f
     JOIN users u ON u.id = f.user_id
     WHERE f.friend_id = $1 AND f.status = 'pending'`,
    [req.user.id]
  )
  res.json(rows.map(u => ({ ...u, character: JSON.parse(u.character || '{}') })))
})

router.post('/request/:friendId', async (req, res) => {
  try {
    await pool.query(
      `INSERT INTO friendships (user_id, friend_id, status) VALUES ($1, $2, 'pending')`,
      [req.user.id, req.params.friendId]
    )
    res.json({ ok: true })
  } catch (e) {
    if (e.code === '23505') return res.status(400).json({ error: 'Already sent' })
    res.status(500).json({ error: e.message })
  }
})

router.get('/suggested', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT DISTINCT u.id, u.username, u.total_xp, u.character, u.equipped
     FROM friendships f1
     JOIN friendships f2 ON f2.user_id = f1.friend_id AND f2.status = 'accepted'
     JOIN users u ON u.id = f2.friend_id
     WHERE f1.user_id = $1 AND f1.status = 'accepted'
       AND f2.friend_id != $2
       AND f2.friend_id NOT IN (SELECT friend_id FROM friendships WHERE user_id = $3)
     LIMIT 20`,
    [req.user.id, req.user.id, req.user.id]
  )
  res.json(rows.map(u => ({
    ...u,
    character: JSON.parse(u.character || '{}'),
    equipped: JSON.parse(u.equipped || '{}'),
  })))
})

router.post('/accept/:userId', async (req, res) => {
  await pool.query(
    `UPDATE friendships SET status = 'accepted' WHERE user_id = $1 AND friend_id = $2`,
    [req.params.userId, req.user.id]
  )
  try {
    await pool.query(
      `INSERT INTO friendships (user_id, friend_id, status) VALUES ($1, $2, 'accepted')`,
      [req.user.id, req.params.userId]
    )
  } catch {}
  res.json({ ok: true })
})

export default router
