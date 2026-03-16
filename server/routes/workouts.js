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

router.delete('/:id', (req, res) => {
  const workout = db.prepare('SELECT * FROM workouts WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id)
  if (!workout) return res.status(404).json({ error: 'Not found' })

  // Reverse XP and points
  db.prepare('UPDATE users SET total_xp = MAX(0, total_xp - ?), points = MAX(0, points - ?) WHERE id = ?')
    .run(workout.xp_earned || 0, workout.points_earned || 0, req.user.id)

  db.prepare('DELETE FROM workouts WHERE id = ?').run(req.params.id)
  res.json({ success: true })
})

router.post('/import', (req, res) => {
  const { workouts } = req.body
  if (!Array.isArray(workouts)) return res.status(400).json({ error: 'workouts must be an array' })

  const XP_PER_SET = 10
  const XP_PER_WORKOUT = 50
  const POINTS_PER_WORKOUT = 25

  const stmt = db.prepare(`INSERT INTO workouts (user_id, name, exercises, notes, xp_earned, points_earned, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
  let count = 0
  let totalXP = 0
  let totalPoints = 0

  for (const w of workouts) {
    const exercises = w.exercises || []
    const totalSets = exercises.reduce((acc, ex) => acc + (Array.isArray(ex.sets) ? ex.sets.length : (ex.sets || 1)), 0)
    const xp = XP_PER_WORKOUT + totalSets * XP_PER_SET
    const points = POINTS_PER_WORKOUT + Math.floor(totalSets / 3) * 5
    stmt.run(req.user.id, w.name, JSON.stringify(exercises), w.notes || null, xp, points, w.created_at || new Date().toISOString())
    totalXP += xp
    totalPoints += points
    count++
  }

  // Award XP and points for all imported workouts
  if (totalXP > 0) {
    db.prepare('UPDATE users SET total_xp = total_xp + ?, points = points + ? WHERE id = ?').run(totalXP, totalPoints, req.user.id)
  }

  res.json({ imported: count, xp_earned: totalXP })
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
