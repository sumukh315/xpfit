import { Router } from 'express'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

router.get('/friends', (req, res) => {
  const friends = db.prepare(`
    SELECT u.id, u.username, u.total_xp, u.points, u.character, u.equipped
    FROM friendships f
    JOIN users u ON u.id = f.friend_id
    WHERE f.user_id = ? AND f.status = 'accepted'
  `).all(req.user.id)
  res.json(friends.map(u => ({
    ...u,
    character: JSON.parse(u.character || '{}'),
    equipped: JSON.parse(u.equipped || '{}'),
  })))
})

router.get('/requests', (req, res) => {
  const requests = db.prepare(`
    SELECT u.id, u.username, u.total_xp, u.character
    FROM friendships f
    JOIN users u ON u.id = f.user_id
    WHERE f.friend_id = ? AND f.status = 'pending'
  `).all(req.user.id)
  res.json(requests.map(u => ({
    ...u,
    character: JSON.parse(u.character || '{}'),
  })))
})

router.post('/request/:friendId', (req, res) => {
  try {
    db.prepare(`
      INSERT INTO friendships (user_id, friend_id, status) VALUES (?, ?, 'pending')
    `).run(req.user.id, req.params.friendId)
    res.json({ ok: true })
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(400).json({ error: 'Already sent' })
    res.status(500).json({ error: e.message })
  }
})

router.get('/suggested', (req, res) => {
  // Friends of friends that the user isn't already friends with
  const suggested = db.prepare(`
    SELECT DISTINCT u.id, u.username, u.total_xp, u.character, u.equipped
    FROM friendships f1
    JOIN friendships f2 ON f2.user_id = f1.friend_id AND f2.status = 'accepted'
    JOIN users u ON u.id = f2.friend_id
    WHERE f1.user_id = ? AND f1.status = 'accepted'
      AND f2.friend_id != ?
      AND f2.friend_id NOT IN (
        SELECT friend_id FROM friendships WHERE user_id = ?
      )
    LIMIT 20
  `).all(req.user.id, req.user.id, req.user.id)
  res.json(suggested.map(u => ({
    ...u,
    character: JSON.parse(u.character || '{}'),
    equipped: JSON.parse(u.equipped || '{}'),
  })))
})

router.post('/accept/:userId', (req, res) => {
  db.prepare(`
    UPDATE friendships SET status = 'accepted' WHERE user_id = ? AND friend_id = ?
  `).run(req.params.userId, req.user.id)
  // Add reverse friendship
  try {
    db.prepare(`
      INSERT INTO friendships (user_id, friend_id, status) VALUES (?, ?, 'accepted')
    `).run(req.user.id, req.params.userId)
  } catch {}
  res.json({ ok: true })
})

export default router
