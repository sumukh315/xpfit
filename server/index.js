import express from 'express'
import cors from 'cors'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import workoutRoutes from './routes/workouts.js'
import profileRoutes from './routes/profiles.js'
import socialRoutes from './routes/social.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(join(__dirname, 'uploads')))

// Serve built React app
const distPath = join(__dirname, '../dist')
app.use(express.static(distPath))

app.use('/api/auth', authRoutes)
app.use('/api/workouts', workoutRoutes)
app.use('/api/profiles', profileRoutes)
app.use('/api/social', socialRoutes)

// Catch-all: serve React app for any non-API route
app.get('/{*path}', (req, res) => {
  res.sendFile(join(distPath, 'index.html'))
})

app.listen(PORT, () => console.log(`XPFit server running on http://localhost:${PORT}`))
