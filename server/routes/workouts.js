import { Router } from 'express'
import multer from 'multer'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import pool from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const upload = multer({ dest: join(__dirname, '../uploads/') })
const router = Router()

router.use(requireAuth)

router.get('/', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM workouts WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
    [req.user.id]
  )
  res.json(rows.map(parseWorkout))
})

router.post('/', upload.single('photo'), async (req, res) => {
  const { name, exercises: exercisesRaw, notes, xp_earned, points_earned, start_time, end_time, duration_minutes } = req.body
  const exercises = typeof exercisesRaw === 'string' ? JSON.parse(exercisesRaw) : (exercisesRaw || [])

  // ── PR Detection ──────────────────────────────────────────────────────────
  const { rows: prevWorkouts } = await pool.query(
    'SELECT exercises FROM workouts WHERE user_id = $1 ORDER BY created_at DESC LIMIT 30',
    [req.user.id]
  )
  const prevBests = {}
  for (const pw of prevWorkouts) {
    for (const ex of JSON.parse(pw.exercises || '[]')) {
      for (const set of (ex.sets || [])) {
        const score = parseFloat(set.weight || 0) * Math.max(1, parseInt(set.reps || 1))
        if (score > 0 && (!prevBests[ex.name] || score > prevBests[ex.name])) {
          prevBests[ex.name] = score
        }
      }
    }
  }
  const prExercises = []
  for (const ex of exercises) {
    if (!ex.sets?.length) continue
    const maxScore = Math.max(...ex.sets.map(s => parseFloat(s.weight || 0) * Math.max(1, parseInt(s.reps || 1))))
    if (prevBests[ex.name] !== undefined && maxScore > prevBests[ex.name]) {
      prExercises.push(ex.name)
    }
  }
  const prPointsEarned = prExercises.length * 3  // 3 PR points per exercise PR

  const serverUrl = process.env.SERVER_URL || ''
  const photo_url = req.file ? `${serverUrl}/uploads/${req.file.filename}` : null

  const { rows: [{ id }] } = await pool.query(
    `INSERT INTO workouts (user_id, name, exercises, notes, photo_url, xp_earned, points_earned, start_time, end_time, duration_minutes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
    [
      req.user.id, name,
      JSON.stringify(exercises),
      notes || null, photo_url,
      parseInt(xp_earned) || 0,
      parseInt(points_earned) || 0,
      start_time || null,
      end_time || null,
      parseInt(duration_minutes) || null,
    ]
  )

  await pool.query(
    'UPDATE users SET total_xp = total_xp + $1, points = points + $2, pr_points = COALESCE(pr_points, 0) + $3 WHERE id = $4',
    [parseInt(xp_earned) || 0, parseInt(points_earned) || 0, prPointsEarned, req.user.id]
  )

  const workout = (await pool.query('SELECT * FROM workouts WHERE id = $1', [id])).rows[0]
  res.json({ ...parseWorkout(workout), pr_points_earned: prPointsEarned, pr_exercises: prExercises })
})

router.patch('/:id/photo', upload.single('photo'), async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id FROM workouts WHERE id = $1 AND user_id = $2',
    [req.params.id, req.user.id]
  )
  if (!rows[0]) return res.status(404).json({ error: 'Not found' })
  if (!req.file) return res.status(400).json({ error: 'No photo uploaded' })

  const serverUrl = process.env.SERVER_URL || ''
  const photo_url = `${serverUrl}/uploads/${req.file.filename}`

  await pool.query('UPDATE workouts SET photo_url = $1 WHERE id = $2', [photo_url, req.params.id])
  res.json({ photo_url })
})

router.delete('/:id', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM workouts WHERE id = $1 AND user_id = $2',
    [req.params.id, req.user.id]
  )
  if (!rows[0]) return res.status(404).json({ error: 'Not found' })
  const workout = rows[0]

  await pool.query(
    'UPDATE users SET total_xp = GREATEST(0, total_xp - $1), points = GREATEST(0, points - $2) WHERE id = $3',
    [workout.xp_earned || 0, workout.points_earned || 0, req.user.id]
  )
  await pool.query('DELETE FROM workouts WHERE id = $1', [req.params.id])
  res.json({ success: true })
})

router.post('/import', async (req, res) => {
  const { workouts } = req.body
  if (!Array.isArray(workouts)) return res.status(400).json({ error: 'workouts must be an array' })

  const XP_PER_SET = 10
  const XP_PER_WORKOUT = 50
  const POINTS_PER_WORKOUT = 25

  let count = 0
  let totalXP = 0
  let totalPoints = 0

  for (const w of workouts) {
    const exercises = w.exercises || []
    const totalSets = exercises.reduce((acc, ex) => acc + (Array.isArray(ex.sets) ? ex.sets.length : (ex.sets || 1)), 0)
    const xp = XP_PER_WORKOUT + totalSets * XP_PER_SET
    const points = POINTS_PER_WORKOUT + Math.floor(totalSets / 3) * 5
    await pool.query(
      `INSERT INTO workouts (user_id, name, exercises, notes, xp_earned, points_earned, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [req.user.id, w.name, JSON.stringify(exercises), w.notes || null, xp, points, w.created_at || new Date().toISOString()]
    )
    totalXP += xp
    totalPoints += points
    count++
  }

  if (totalXP > 0) {
    await pool.query(
      'UPDATE users SET total_xp = total_xp + $1, points = points + $2 WHERE id = $3',
      [totalXP, totalPoints, req.user.id]
    )
  }

  res.json({ imported: count, xp_earned: totalXP })
})

router.get('/user/:userId', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM workouts WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10',
    [req.params.userId]
  )
  res.json(rows.map(parseWorkout))
})

function parseWorkout(w) {
  return { ...w, exercises: JSON.parse(w.exercises || '[]') }
}

export default router
