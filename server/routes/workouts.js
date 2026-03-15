import { Router } from 'express'
import multer from 'multer'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const upload = multer({ dest: join(__dirname, '../uploads/') })
const router = Router()

router.use(requireAuth)

router.get('/', (req, res) => {
  const workouts = db.prepare(`
    SELECT * FROM workouts WHERE user_id = ? ORDER BY created_at DESC LIMIT ?
  `).all(req.user.id, 50)
  res.json(workouts.map(parseWorkout))
})

router.post('/', upload.single('photo'), (req, res) => {
  const { name, exercises, notes, xp_earned, points_earned, start_time, end_time, duration_minutes } = req.body
  const photo_url = req.file ? `/uploads/${req.file.filename}` : null

  const stmt = db.prepare(`
    INSERT INTO workouts (user_id, name, exercises, notes, photo_url, xp_earned, points_earned, start_time, end_time, duration_minutes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const result = stmt.run(
    req.user.id, name,
    typeof exercises === 'string' ? exercises : JSON.stringify(exercises || []),
    notes || null, photo_url,
    parseInt(xp_earned) || 0,
    parseInt(points_earned) || 0,
    start_time || null,
    end_time || null,
    parseInt(duration_minutes) || null
  )

  // Update user XP and points
  db.prepare(`
    UPDATE users SET total_xp = total_xp + ?, points = points + ? WHERE id = ?
  `).run(parseInt(xp_earned) || 0, parseInt(points_earned) || 0, req.user.id)

  const workout = db.prepare('SELECT * FROM workouts WHERE id = ?').get(result.lastInsertRowid)

  res.json(parseWorkout(workout))
})

router.post('/import', (req, res) => {
  const { workouts } = req.body
  if (!Array.isArray(workouts)) return res.status(400).json({ error: 'workouts must be an array' })
  const stmt = db.prepare(`INSERT INTO workouts (user_id, name, exercises, notes, xp_earned, points_earned, created_at) VALUES (?, ?, ?, ?, 0, 0, ?)`)
  let count = 0
  for (const w of workouts) {
    stmt.run(req.user.id, w.name, JSON.stringify(w.exercises || []), w.notes || null, w.created_at || new Date().toISOString())
    count++
  }
  res.json({ imported: count })
})

router.get('/user/:userId', (req, res) => {
  const workouts = db.prepare(`
    SELECT * FROM workouts WHERE user_id = ? ORDER BY created_at DESC LIMIT 10
  `).all(req.params.userId)
  res.json(workouts.map(parseWorkout))
})

function parseWorkout(w) {
  return {
    ...w,
    exercises: JSON.parse(w.exercises || '[]'),
  }
}

export default router
