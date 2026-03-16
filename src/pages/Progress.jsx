import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

const MUSCLE_GROUPS = [
  { id: 'chest',     label: 'Chest',     color: '#ec4899' },
  { id: 'back',      label: 'Back',      color: '#3b82f6' },
  { id: 'arms',      label: 'Arms',      color: '#f59e0b' },
  { id: 'shoulders', label: 'Shoulders', color: '#8b5cf6' },
  { id: 'legs',      label: 'Legs',      color: '#10b981' },
  { id: 'abs',       label: 'Abs',       color: '#ef4444' },
  { id: 'cardio',    label: 'Cardio',    color: '#06b6d4' },
]

const EXERCISES_BY_GROUP = {
  chest:     ['Bench Press','Incline Bench Press','Decline Bench Press','Dumbbell Fly','Incline Dumbbell Fly','Cable Fly','Push-Up','Chest Dip','Pec Deck','Cable Crossover','Landmine Press','Machine Chest Press'],
  back:      ['Deadlift','Barbell Row','Dumbbell Row','Pull-Up','Chin-Up','Lat Pulldown','Seated Cable Row','T-Bar Row','Face Pull','Straight-Arm Pulldown','Rack Pull','Good Morning','Hyperextension','Shrug'],
  arms:      ['Barbell Curl','Dumbbell Curl','Hammer Curl','Preacher Curl','Cable Curl','Concentration Curl','Incline Dumbbell Curl','Tricep Pushdown','Skull Crusher','Overhead Tricep Extension','Diamond Push-Up','Tricep Dip','Close-Grip Bench Press','Wrist Curl','Reverse Curl'],
  shoulders: ['Overhead Press','Dumbbell Shoulder Press','Arnold Press','Lateral Raise','Front Raise','Rear Delt Fly','Upright Row','Cable Lateral Raise','Face Pull','Machine Shoulder Press','Landmine Lateral Raise'],
  legs:      ['Squat','Front Squat','Goblet Squat','Bulgarian Split Squat','Leg Press','Hack Squat','Romanian Deadlift','Leg Curl','Leg Extension','Hip Thrust','Glute Bridge','Lunge','Walking Lunge','Step-Up','Calf Raise','Seated Calf Raise','Sumo Deadlift','Box Jump'],
  abs:       ['Crunch','Sit-Up','Bicycle Crunch','Russian Twist','Plank','Side Plank','Leg Raise','Hanging Leg Raise','Ab Rollout','Cable Crunch','Dragon Flag','Mountain Climber','V-Up','Dead Bug'],
  cardio:    ['Running','Treadmill','Cycling','Rowing Machine','Elliptical','Jump Rope','Stair Climber','HIIT Sprint','Battle Ropes','Burpee','Box Jump','Sled Push'],
}

function getGroupForExercise(name) {
  return Object.entries(EXERCISES_BY_GROUP).find(([, list]) => list.includes(name))?.[0] || null
}

function getMondayKey(dateStr) {
  const d = new Date(dateStr)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const mon = new Date(d)
  mon.setDate(diff)
  return mon.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="pixel-card px-3 py-2">
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }} className="text-xs">{p.name}: {p.value}</p>
      ))}
    </div>
  )
}

export default function Progress() {
  const { profile } = useAuth()
  const [workouts, setWorkouts] = useState([])
  const [selectedGroup, setSelectedGroup] = useState('legs')
  const [selectedExercise, setSelectedExercise] = useState(null)

  useEffect(() => { if (profile) fetchWorkouts() }, [profile])

  async function fetchWorkouts() {
    try {
      const data = await api.getWorkouts()
      setWorkouts([...data].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)))
    } catch (e) { console.error(e) }
  }

  // Exercises the user has actually logged for the selected group
  const doneExercises = useMemo(() => {
    const names = new Set()
    workouts.forEach(w => w.exercises?.forEach(e => {
      if (e.name && getGroupForExercise(e.name) === selectedGroup) names.add(e.name)
    }))
    return [...names]
  }, [workouts, selectedGroup])

  // Auto-select first exercise when group changes
  useEffect(() => {
    if (doneExercises.length > 0 && (!selectedExercise || !doneExercises.includes(selectedExercise))) {
      setSelectedExercise(doneExercises[0])
    } else if (doneExercises.length === 0) {
      setSelectedExercise(null)
    }
  }, [doneExercises])

  // Weight trend for selected exercise
  const exerciseHistory = useMemo(() => {
    if (!selectedExercise) return []
    return workouts
      .filter(w => w.exercises?.some(e => e.name === selectedExercise))
      .map(w => {
        const ex = w.exercises.find(e => e.name === selectedExercise)
        const maxWeight = Math.max(...(ex.sets || []).map(s => parseFloat(s.weight) || 0))
        return {
          date: new Date(w.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          weight: maxWeight || null,
        }
      })
      .filter(d => d.weight)
  }, [selectedExercise, workouts])

  // Sets per week by muscle group (last 10 weeks)
  const weeklyData = useMemo(() => {
    const map = {}
    workouts.forEach(w => {
      const week = getMondayKey(w.created_at)
      if (!map[week]) map[week] = {}
      w.exercises?.forEach(ex => {
        const group = getGroupForExercise(ex.name)
        if (group) map[week][group] = (map[week][group] || 0) + (ex.sets?.length || 0)
      })
    })
    return Object.entries(map)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .slice(-10)
      .map(([week, groups]) => ({ week, ...groups }))
  }, [workouts])

  // PRs
  const prs = useMemo(() => {
    const map = {}
    workouts.forEach(w => w.exercises?.forEach(ex => {
      if (!ex.name) return
      const max = Math.max(...(ex.sets || []).map(s => parseFloat(s.weight) || 0))
      if (max > 0 && (!map[ex.name] || max > map[ex.name])) map[ex.name] = max
    }))
    return map
  }, [workouts])

  const groupColor = MUSCLE_GROUPS.find(g => g.id === selectedGroup)?.color || '#38bdf8'

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="pixel-font text-sky-400 mb-6" style={{ fontSize: '14px' }}>Progress & Stats</h1>

      {workouts.length === 0 ? (
        <div className="pixel-card p-8 text-center text-gray-500">No workout data yet. Log some workouts to see your progress!</div>
      ) : (
        <>
          {/* ── Exercise Progress ───────────────────────────────────── */}
          <div className="pixel-card p-4 mb-6">
            <h2 className="pixel-font text-sky-400 mb-4" style={{ fontSize: '13px' }}>Exercise Progress</h2>

            {/* Muscle group tabs */}
            <div className="flex flex-wrap gap-1 mb-4">
              {MUSCLE_GROUPS.map(g => (
                <button key={g.id} onClick={() => setSelectedGroup(g.id)}
                  className={`px-3 py-1 pixel-font border transition-all ${
                    selectedGroup === g.id
                      ? 'border-sky-500 bg-sky-900/40 text-sky-300'
                      : 'border-gray-700 text-gray-500 hover:border-gray-500'
                  }`} style={{ fontSize: '13px' }}>
                  {g.label}
                </button>
              ))}
            </div>

            {/* Exercise buttons */}
            {doneExercises.length === 0 ? (
              <p className="text-gray-600 text-sm py-4 text-center">No {selectedGroup} exercises logged yet.</p>
            ) : (
              <>
                <div className="flex flex-wrap gap-2 mb-5">
                  {doneExercises.map(name => (
                    <button key={name} onClick={() => setSelectedExercise(name)}
                      className={`px-3 py-1.5 border-2 transition-all`}
                      style={{
                        fontSize: '13px',
                        borderColor: selectedExercise === name ? groupColor : '#374151',
                        background: selectedExercise === name ? `${groupColor}22` : 'transparent',
                        color: selectedExercise === name ? groupColor : '#9ca3af',
                      }}>
                      {name}
                    </button>
                  ))}
                </div>

                {exerciseHistory.length > 1 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={exerciseHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2d2d4e" />
                      <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} />
                      <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} unit=" lbs" />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="weight" stroke={groupColor} strokeWidth={2}
                        dot={{ fill: groupColor, r: 3 }} name="Max Weight (lbs)" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : exerciseHistory.length === 1 ? (
                  <p className="text-gray-500 text-center py-6" style={{ fontSize: '12px' }}>
                    Only 1 session logged for {selectedExercise} — need more to show a trend.
                  </p>
                ) : (
                  <p className="text-gray-500 text-center py-6" style={{ fontSize: '12px' }}>No weight data for this exercise.</p>
                )}
              </>
            )}
          </div>

          {/* ── Sets Per Week ───────────────────────────────────────── */}
          <div className="pixel-card p-4 mb-6">
            <h2 className="pixel-font text-sky-400 mb-4" style={{ fontSize: '13px' }}>Sets Per Week by Muscle Group</h2>
            {weeklyData.length === 0 ? (
              <p className="text-gray-500 text-center py-6" style={{ fontSize: '12px' }}>Not enough data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={weeklyData} barSize={10}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d2d4e" />
                  <XAxis dataKey="week" tick={{ fill: '#6b7280', fontSize: 9 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '13px', color: '#9ca3af' }} />
                  {MUSCLE_GROUPS.map(g => (
                    <Bar key={g.id} dataKey={g.id} name={g.label} fill={g.color} stackId="a" />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* ── Personal Records ────────────────────────────────────── */}
          <div className="pixel-card p-4">
            <h2 className="pixel-font text-sky-400 mb-4" style={{ fontSize: '13px' }}>Personal Records</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(prs).slice(0, 9).map(([name, weight]) => (
                <div key={name} className="glass-row p-3">
                  <div className="text-gray-400 text-xs mb-1 truncate">{name}</div>
                  <div className="pixel-font text-yellow-400" style={{ fontSize: '12px' }}>PR: {weight} lbs</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
