import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'
import { getLevelFromXP, getLevelTitle } from '../lib/xpSystem'
import { getRecommendations } from '../lib/recommendations'
import XPBar from '../components/XPBar'
import PixelCharacter from '../components/PixelCharacter'

export default function Dashboard() {
  const { profile, refreshProfile } = useAuth()
  const [recentWorkouts, setRecentWorkouts] = useState([])
  const [weekStats, setWeekStats] = useState({ workouts: 0, sets: 0 })
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    if (profile) fetchRecentWorkouts()
  }, [profile])

  async function fetchRecentWorkouts() {
    try {
      const data = await api.getWorkouts()
      setRecentWorkouts(data.slice(0, 5))
      calcWeekStats(data)
      calcStreak(data)
    } catch (e) {
      console.error(e)
    }
  }

  function workoutDate(w) { return w.start_time || w.created_at }

  function calcWeekStats(workouts) {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const thisWeek = workouts.filter(w => new Date(workoutDate(w)) > weekAgo)
    const sets = thisWeek.reduce((acc, w) => acc + (w.exercises?.reduce((a, e) => a + (e.sets?.length || 0), 0) || 0), 0)
    setWeekStats({ workouts: thisWeek.length, sets })
  }

  function calcStreak(workouts) {
    if (!workouts.length) return setStreak(0)
    let s = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dates = workouts.map(w => {
      const d = new Date(workoutDate(w))
      d.setHours(0, 0, 0, 0)
      return d.getTime()
    })
    const uniqueDates = [...new Set(dates)].sort((a, b) => b - a)
    let expected = today.getTime()
    for (const d of uniqueDates) {
      if (d === expected) { s++; expected -= 86400000 }
      else if (d === expected + 86400000) { expected = d - 86400000 }
      else break
    }
    setStreak(s)
  }

  const { level } = getLevelFromXP(profile?.total_xp || 0)
  const charOptions = profile?.character || { gender: 'male', charClass: 'warrior' }
  const recommendations = getRecommendations(profile?.fitness_profile)

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="pixel-card p-6 mb-6 flex flex-col md:flex-row items-center gap-6" style={{ background: 'linear-gradient(135deg, #001d3d, #0a1628)' }}>
        <div className="pixel-card p-4 glow-purple">
          <PixelCharacter options={charOptions} scale={0.9} />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h1 className="fantasy-font text-white mb-1" style={{ fontSize: '24px' }}>
            {profile?.username || 'Hero'}
          </h1>
          <p className="pixel-font text-sky-400 mb-4" style={{ fontSize: '13px' }}>
            Level {level} {getLevelTitle(level)}
          </p>
          <XPBar totalXP={profile?.total_xp || 0} />
          <div className="flex gap-4 mt-4 justify-center md:justify-start">
            <div className="text-center">
              <div className="pixel-font text-yellow-400" style={{ fontSize: '14px' }}>{profile?.points || 0}</div>
              <div className="text-gray-400 text-xs">Points</div>
            </div>
            <div className="text-center">
              <div className="pixel-font text-orange-400" style={{ fontSize: '14px' }}>{streak}</div>
              <div className="text-gray-400 text-xs">Day Streak</div>
            </div>
            <div className="text-center">
              <div className="pixel-font text-green-400" style={{ fontSize: '14px' }}>{weekStats.workouts}</div>
              <div className="text-gray-400 text-xs">This Week</div>
            </div>
          </div>
        </div>
        <Link to="/workout/new"
          className="pixel-btn bg-green-700 border-green-500 text-white px-6 py-4 no-underline glow-green"
          style={{ fontSize: '13px', whiteSpace: 'nowrap' }}>
          + New Workout
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {[
          { label: 'Total Workouts', value: recentWorkouts.length },
          { label: 'Sets This Week', value: weekStats.sets },
          { label: 'Total XP', value: profile?.total_xp || 0 },
          { label: 'Current Level', value: level },
        ].map(stat => (
          <div key={stat.label} className="pixel-card p-4 text-center">
            <div className="pixel-font text-white" style={{ fontSize: '16px' }}>{stat.value}</div>
            <div className="text-gray-400 text-xs mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <Link to="/progress" className="pixel-card p-4 mb-6 flex items-center justify-between no-underline hover:border-sky-600 transition-all group" style={{ display: 'flex' }}>
        <div>
          <div className="pixel-font text-sky-400" style={{ fontSize: '13px' }}>Progress &amp; Stats</div>
          <div className="text-gray-400 text-xs mt-1">Charts, PRs, and muscle group breakdown</div>
        </div>
        <span className="text-sky-400 group-hover:text-sky-300 text-lg">→</span>
      </Link>

      {recommendations.length > 0 && (
        <div className="pixel-card p-4 mb-6" style={{ borderColor: '#0369a1' }}>
          <h2 className="pixel-font text-sky-400 mb-4" style={{ fontSize: '13px' }}>
            Personalized Tips
          </h2>
          <div className="flex flex-col gap-3">
            {recommendations.map((rec, i) => (
              <div key={i} className="flex gap-3 glass-row p-3">
                <div className="text-sky-400 pixel-font mt-0.5" style={{ fontSize: '12px', minWidth: '16px' }}>{i + 1}</div>
                <div>
                  <div className="pixel-font text-white mb-1" style={{ fontSize: '12px' }}>{rec.title}</div>
                  <div className="text-gray-400" style={{ fontSize: '12px' }}>{rec.tip}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pixel-card p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="pixel-font text-sky-400" style={{ fontSize: '13px' }}>Recent Workouts</h2>
          <div className="flex items-center gap-4">
            <Link to="/progress" className="text-gray-400 hover:text-sky-300 text-sm no-underline">View Stats →</Link>
            <Link to="/logs" className="text-sky-400 hover:text-sky-300 text-sm no-underline">View All →</Link>
          </div>
        </div>
        {recentWorkouts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No workouts yet. Start your quest!</p>
            <Link to="/workout/new" className="pixel-btn bg-sky-700 border-sky-500 text-white px-6 py-3 no-underline" style={{ fontSize: '13px' }}>
              Log First Workout
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {recentWorkouts.map(w => (
              <div key={w.id} className="flex items-center justify-between p-3 glass-row">
                <Link to="/logs" className="flex-1 min-w-0 no-underline hover:opacity-80 transition-opacity">
                  <div className="text-white font-medium">{w.name}</div>
                  <div className="text-gray-400 text-xs">
                    {new Date(workoutDate(w)).toLocaleDateString()} · {w.exercises?.length || 0} exercises
                  </div>
                </Link>
                <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                  <div className="pixel-font text-sky-400" style={{ fontSize: '12px' }}>
                    +{w.xp_earned || 0} XP
                  </div>
                  <button onClick={async () => {
                    if (!confirm('Delete this workout?')) return
                    await api.deleteWorkout(w.id)
                    fetchRecentWorkouts()
                    refreshProfile()
                  }} className="text-gray-700 hover:text-red-400 transition-colors text-sm">✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
