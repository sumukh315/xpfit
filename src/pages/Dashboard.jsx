import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'
import { getLevelFromXP, getLevelTitle } from '../lib/xpSystem'
import { getRecommendations } from '../lib/recommendations'
import XPBar from '../components/XPBar'
import PixelCharacter from '../components/PixelCharacter'

export default function Dashboard() {
  const { profile } = useAuth()
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

  function calcWeekStats(workouts) {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const thisWeek = workouts.filter(w => new Date(w.created_at) > weekAgo)
    const sets = thisWeek.reduce((acc, w) => acc + (w.exercises?.reduce((a, e) => a + (e.sets?.length || 0), 0) || 0), 0)
    setWeekStats({ workouts: thisWeek.length, sets })
  }

  function calcStreak(workouts) {
    if (!workouts.length) return setStreak(0)
    let s = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dates = workouts.map(w => {
      const d = new Date(w.created_at)
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
      <div className="pixel-card p-6 mb-6 flex flex-col md:flex-row items-center gap-6" style={{ background: 'linear-gradient(135deg, #1a0a2e, #16162a)' }}>
        <div className="pixel-card p-4 glow-purple">
          <PixelCharacter options={charOptions} scale={0.9} />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h1 className="fantasy-font text-white mb-1" style={{ fontSize: '24px' }}>
            {profile?.username || 'Hero'}
          </h1>
          <p className="pixel-font text-purple-400 mb-4" style={{ fontSize: '10px' }}>
            Level {level} {getLevelTitle(level)}
          </p>
          <XPBar totalXP={profile?.total_xp || 0} />
          <div className="flex gap-4 mt-4 justify-center md:justify-start">
            <div className="text-center">
              <div className="pixel-font text-yellow-400" style={{ fontSize: '14px' }}>🪙 {profile?.points || 0}</div>
              <div className="text-gray-500 text-xs">Points</div>
            </div>
            <div className="text-center">
              <div className="pixel-font text-orange-400" style={{ fontSize: '14px' }}>🔥 {streak}</div>
              <div className="text-gray-500 text-xs">Day Streak</div>
            </div>
            <div className="text-center">
              <div className="pixel-font text-green-400" style={{ fontSize: '14px' }}>💪 {weekStats.workouts}</div>
              <div className="text-gray-500 text-xs">This Week</div>
            </div>
          </div>
        </div>
        <Link to="/workout/new"
          className="pixel-btn bg-green-700 border-green-500 text-white px-6 py-4 no-underline glow-green"
          style={{ fontSize: '10px', whiteSpace: 'nowrap' }}>
          + New Workout
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Workouts', value: recentWorkouts.length, icon: '🏋️' },
          { label: 'Sets This Week', value: weekStats.sets, icon: '📊' },
          { label: 'Total XP', value: profile?.total_xp || 0, icon: '⭐' },
          { label: 'Current Level', value: level, icon: '🎯' },
        ].map(stat => (
          <div key={stat.label} className="pixel-card p-4 text-center">
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="pixel-font text-white" style={{ fontSize: '16px' }}>{stat.value}</div>
            <div className="text-gray-500 text-xs mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {recommendations.length > 0 && (
        <div className="pixel-card p-4 mb-6" style={{ borderColor: '#6d28d9' }}>
          <h2 className="pixel-font text-purple-400 mb-4" style={{ fontSize: '11px' }}>
            ⚡ Personalized Tips
          </h2>
          <div className="flex flex-col gap-3">
            {recommendations.map((rec, i) => (
              <div key={i} className="flex gap-3 bg-black/30 border border-purple-900/40 p-3">
                <div className="text-purple-400 pixel-font mt-0.5" style={{ fontSize: '12px', minWidth: '16px' }}>{i + 1}</div>
                <div>
                  <div className="pixel-font text-white mb-1" style={{ fontSize: '9px' }}>{rec.title}</div>
                  <div className="text-gray-400" style={{ fontSize: '12px' }}>{rec.tip}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pixel-card p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="pixel-font text-purple-400" style={{ fontSize: '11px' }}>Recent Workouts</h2>
          <Link to="/progress" className="text-purple-400 hover:text-purple-300 text-sm">View All →</Link>
        </div>
        {recentWorkouts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No workouts yet. Start your quest!</p>
            <Link to="/workout/new" className="pixel-btn bg-purple-700 border-purple-500 text-white px-6 py-3 no-underline" style={{ fontSize: '10px' }}>
              Log First Workout
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {recentWorkouts.map(w => (
              <div key={w.id} className="flex items-center justify-between p-3 bg-black/30 border border-gray-800">
                <div>
                  <div className="text-white font-medium">{w.name}</div>
                  <div className="text-gray-500 text-xs">
                    {new Date(w.created_at).toLocaleDateString()} · {w.exercises?.length || 0} exercises
                  </div>
                </div>
                <div className="pixel-font text-purple-400" style={{ fontSize: '9px' }}>
                  +{w.xp_earned || 0} XP
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
