import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function Progress() {
  const { profile } = useAuth()
  const [workouts, setWorkouts] = useState([])
  const [selectedExercise, setSelectedExercise] = useState('')
  const [exerciseHistory, setExerciseHistory] = useState([])
  const [allExercises, setAllExercises] = useState([])

  useEffect(() => {
    if (profile) fetchWorkouts()
  }, [profile])

  async function fetchWorkouts() {
    try {
      const data = await api.getWorkouts()
      const sorted = [...data].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      setWorkouts(sorted)
      const names = new Set()
      sorted.forEach(w => w.exercises?.forEach(e => e.name && names.add(e.name)))
      const nameList = [...names]
      setAllExercises(nameList)
      if (nameList.length > 0) setSelectedExercise(nameList[0])
    } catch (e) { console.error(e) }
  }

  useEffect(() => {
    if (!selectedExercise || !workouts.length) return
    const history = []
    workouts.forEach(w => {
      const ex = w.exercises?.find(e => e.name === selectedExercise)
      if (ex) {
        const maxWeight = Math.max(...(ex.sets || []).map(s => parseFloat(s.weight) || 0))
        const totalReps = (ex.sets || []).reduce((a, s) => a + (parseInt(s.reps) || 0), 0)
        history.push({
          date: new Date(w.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          weight: maxWeight, reps: totalReps, volume: maxWeight * totalReps,
        })
      }
    })
    setExerciseHistory(history)
  }, [selectedExercise, workouts])

  const xpHistory = workouts.map((w, i) => ({
    date: new Date(w.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    xp: workouts.slice(0, i + 1).reduce((a, w) => a + (w.xp_earned || 0), 0),
  }))

  const monthlyVolume = workouts.reduce((acc, w) => {
    const month = new Date(w.created_at).toLocaleDateString('en-US', { month: 'short' })
    acc[month] = (acc[month] || 0) + 1
    return acc
  }, {})
  const monthlyData = Object.entries(monthlyVolume).map(([month, count]) => ({ month, count }))

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div className="pixel-card px-3 py-2">
          <p className="text-gray-400 text-xs mb-1">{label}</p>
          {payload.map(p => <p key={p.name} style={{ color: p.color }} className="text-sm">{p.name}: {p.value}</p>)}
        </div>
      )
    }
    return null
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="pixel-font text-purple-400 mb-6" style={{ fontSize: '14px' }}>Progress & Stats</h1>

      {workouts.length === 0 ? (
        <div className="pixel-card p-8 text-center text-gray-500">No workout data yet. Log some workouts to see your progress!</div>
      ) : (
        <>
          <div className="pixel-card p-4 mb-6">
            <h2 className="pixel-font text-purple-400 mb-4" style={{ fontSize: '10px' }}>XP Over Time</h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={xpHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d2d4e" />
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="xp" stroke="#a855f7" strokeWidth={2} dot={{ fill: '#a855f7', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="pixel-card p-4 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="pixel-font text-purple-400" style={{ fontSize: '10px' }}>Exercise Progress</h2>
              <select value={selectedExercise} onChange={e => setSelectedExercise(e.target.value)}
                className="bg-black/40 border border-gray-700 text-white px-2 py-1 text-sm focus:border-purple-500 outline-none">
                {allExercises.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
            {exerciseHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={exerciseHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d2d4e" />
                  <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="weight" stroke="#ec4899" strokeWidth={2} dot={{ fill: '#ec4899', r: 3 }} name="Max Weight (lbs)" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-8">No data for this exercise yet.</p>
            )}
          </div>

          <div className="pixel-card p-4 mb-6">
            <h2 className="pixel-font text-purple-400 mb-4" style={{ fontSize: '10px' }}>Personal Records 🏆</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {allExercises.slice(0, 6).map(name => {
                const prs = []
                workouts.forEach(w => {
                  const ex = w.exercises?.find(e => e.name === name)
                  if (ex) {
                    const max = Math.max(...(ex.sets || []).map(s => parseFloat(s.weight) || 0))
                    if (max > 0) prs.push(max)
                  }
                })
                const pr = prs.length ? Math.max(...prs) : null
                return pr ? (
                  <div key={name} className="bg-black/30 border border-gray-800 p-3">
                    <div className="text-gray-400 text-xs mb-1 truncate">{name}</div>
                    <div className="pixel-font text-yellow-400" style={{ fontSize: '12px' }}>{pr} lbs</div>
                  </div>
                ) : null
              })}
            </div>
          </div>

          <div className="pixel-card p-4">
            <h2 className="pixel-font text-purple-400 mb-4" style={{ fontSize: '10px' }}>Workouts Per Month</h2>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d2d4e" />
                <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 10 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="count" stroke="#4ade80" strokeWidth={2} dot={{ fill: '#4ade80', r: 3 }} name="Workouts" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  )
}
