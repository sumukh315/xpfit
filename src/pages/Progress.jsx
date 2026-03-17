import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'
import {
  ComposedChart, Line, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
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
  legs:      ['Squat','Front Squat','Goblet Squat','Bulgarian Split Squat','Leg Press','Hack Squat','Romanian Deadlift','Leg Curl','Leg Extension','Hip Thrust','Glute Bridge','Lunge','Walking Lunge','Step-Up','Calf Raise','Seated Calf Raise','Sumo Deadlift','Box Jump','Hip Adductor','Hip Abductor','Cable Kickback','Donkey Kick','Fire Hydrant','Frog Pump','Single Leg Hip Thrust','Banded Squat','Curtsy Lunge','Reverse Hyperextension','Cable Pull Through'],
  abs:       ['Crunch','Sit-Up','Bicycle Crunch','Russian Twist','Plank','Side Plank','Leg Raise','Hanging Leg Raise','Ab Rollout','Cable Crunch','Dragon Flag','Mountain Climber','V-Up','Dead Bug'],
  cardio:    ['Running','Treadmill','Cycling','Rowing Machine','Elliptical','Jump Rope','Stair Climber','HIIT Sprint','Battle Ropes','Burpee','Box Jump','Sled Push'],
}

function getGroupForExercise(name) {
  return Object.entries(EXERCISES_BY_GROUP).find(([, list]) => list.includes(name))?.[0] || null
}

function getWeekStart(offset = 0) {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const mon = new Date(d)
  mon.setDate(diff + offset * 7)
  mon.setHours(0, 0, 0, 0)
  return mon
}

function formatWeekLabel(weekStart) {
  const end = new Date(weekStart)
  end.setDate(end.getDate() + 6)
  return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
}

const TIME_RANGES = [
  { label: '1W', days: 7 },
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '6M', days: 180 },
  { label: 'All', days: null },
]

const TOOLTIP_STYLE = { background: 'rgba(5,10,20,0.97)', border: '1px solid rgba(103,232,249,0.15)', borderRadius: 6, padding: '6px 10px' }

const DotTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  return (
    <div style={TOOLTIP_STYLE}>
      <p className="text-gray-400" style={{ fontSize: '11px', marginBottom: 2 }}>{d.dateLabel}</p>
      <p style={{ color: d.color, fontSize: '12px' }}>{d.weight} lbs</p>
    </div>
  )
}

const BarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={TOOLTIP_STYLE}>
      <p className="text-gray-400" style={{ fontSize: '11px', marginBottom: 2 }}>{label}</p>
      <p style={{ color: payload[0]?.fill, fontSize: '12px' }}>{payload[0]?.value} sets</p>
    </div>
  )
}

export default function Progress() {
  const { profile } = useAuth()
  const [workouts, setWorkouts] = useState([])
  const [selectedGroup, setSelectedGroup] = useState('legs')
  const [selectedExercise, setSelectedExercise] = useState(null)
  const [timeRange, setTimeRange] = useState('3M')
  const [weekOffset, setWeekOffset] = useState(0)

  useEffect(() => { if (profile) fetchWorkouts() }, [profile])

  async function fetchWorkouts() {
    try {
      const data = await api.getWorkouts()
      const wDate = w => w.start_time || w.created_at
      setWorkouts([...data].sort((a, b) => new Date(wDate(a)) - new Date(wDate(b))))
    } catch (e) { console.error(e) }
  }

  const doneExercises = useMemo(() => {
    const names = new Set()
    workouts.forEach(w => w.exercises?.forEach(e => {
      if (e.name && getGroupForExercise(e.name) === selectedGroup) names.add(e.name)
    }))
    return [...names]
  }, [workouts, selectedGroup])

  useEffect(() => {
    if (doneExercises.length > 0 && (!selectedExercise || !doneExercises.includes(selectedExercise))) {
      setSelectedExercise(doneExercises[0])
    } else if (doneExercises.length === 0) {
      setSelectedExercise(null)
    }
  }, [doneExercises])

  // Dot chart data filtered by time range
  const exerciseHistory = useMemo(() => {
    if (!selectedExercise) return []
    const range = TIME_RANGES.find(r => r.label === timeRange)
    const cutoff = range?.days ? new Date(Date.now() - range.days * 86400000) : null
    const groupColor = MUSCLE_GROUPS.find(g => g.id === selectedGroup)?.color || '#38bdf8'
    return workouts
      .filter(w => {
        if (cutoff && new Date(w.start_time || w.created_at) < cutoff) return false
        return w.exercises?.some(e => e.name === selectedExercise)
      })
      .map(w => {
        const ex = w.exercises.find(e => e.name === selectedExercise)
        const maxWeight = Math.max(...(ex.sets || []).map(s => parseFloat(s.weight) || 0))
        const d = new Date(w.start_time || w.created_at)
        return {
          dateLabel: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          dateTs: d.getTime(),
          weight: maxWeight || null,
          color: groupColor,
        }
      })
      .filter(d => d.weight)
  }, [selectedExercise, workouts, timeRange, selectedGroup])

  // Week navigation
  const weekStart = useMemo(() => getWeekStart(weekOffset), [weekOffset])
  const weekEnd = useMemo(() => { const e = new Date(weekStart); e.setDate(e.getDate() + 7); return e }, [weekStart])

  const weeklySetsByGroup = useMemo(() => {
    return MUSCLE_GROUPS.map(g => {
      let sets = 0
      workouts.forEach(w => {
        const d = new Date(w.start_time || w.created_at)
        if (d >= weekStart && d < weekEnd) {
          w.exercises?.forEach(ex => {
            if (getGroupForExercise(ex.name) === g.id) sets += ex.sets?.length || 0
          })
        }
      })
      return { group: g.label, sets, color: g.color }
    }).filter(g => g.sets > 0)
  }, [workouts, weekStart, weekEnd])

  const groupColor = MUSCLE_GROUPS.find(g => g.id === selectedGroup)?.color || '#38bdf8'

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="pixel-font text-sky-400 mb-6" style={{ fontSize: '14px' }}>Progress & Stats</h1>

      {workouts.length === 0 ? (
        <div className="pixel-card p-8 text-center text-gray-500">No workout data yet. Log some workouts to see your progress!</div>
      ) : (
        <>
          {/* ── Weight Progression Dot Chart ── */}
          <div className="pixel-card p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="pixel-font text-sky-400" style={{ fontSize: '13px' }}>Weight Progression</h2>
              <div className="flex gap-1">
                {TIME_RANGES.map(r => (
                  <button key={r.label} onClick={() => setTimeRange(r.label)}
                    className={`px-2 py-1 pixel-font border transition-all ${
                      timeRange === r.label
                        ? 'border-sky-500 bg-sky-900/40 text-sky-300'
                        : 'border-gray-700 text-gray-500 hover:border-gray-500'
                    }`} style={{ fontSize: '11px' }}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Muscle group tabs */}
            <div className="flex flex-wrap gap-1 mb-3">
              {MUSCLE_GROUPS.map(g => (
                <button key={g.id} onClick={() => setSelectedGroup(g.id)}
                  className={`px-3 py-1 pixel-font border transition-all ${
                    selectedGroup === g.id
                      ? 'border-sky-500 bg-sky-900/40 text-sky-300'
                      : 'border-gray-700 text-gray-500 hover:border-gray-500'
                  }`} style={{ fontSize: '11px' }}>
                  {g.label}
                </button>
              ))}
            </div>

            {/* Exercise selector */}
            {doneExercises.length === 0 ? (
              <p className="text-gray-500 text-sm py-4 text-center">No {selectedGroup} exercises logged yet.</p>
            ) : (
              <>
                <div className="flex flex-wrap gap-2 mb-4">
                  {doneExercises.map(name => (
                    <button key={name} onClick={() => setSelectedExercise(name)}
                      className="px-3 py-1.5 border-2 transition-all"
                      style={{
                        fontSize: '12px',
                        borderColor: selectedExercise === name ? groupColor : '#374151',
                        background: selectedExercise === name ? `${groupColor}22` : 'transparent',
                        color: selectedExercise === name ? groupColor : '#9ca3af',
                      }}>
                      {name}
                    </button>
                  ))}
                </div>

                {exerciseHistory.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <ComposedChart data={exerciseHistory} margin={{ top: 10, right: 15, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
                      <XAxis
                        dataKey="dateLabel"
                        tick={{ fill: '#6b7280', fontSize: 10 }}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tick={{ fill: '#6b7280', fontSize: 10 }}
                        unit=" lbs"
                        width={55}
                      />
                      <Tooltip content={<DotTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} wrapperStyle={{ background: 'transparent', border: 'none', boxShadow: 'none' }} />
                      <Line
                        dataKey="weight"
                        stroke={groupColor}
                        strokeWidth={2}
                        strokeOpacity={0.5}
                        dot={(props) => {
                          const { cx, cy, payload } = props
                          if (!cx || !cy) return null
                          return (
                            <g key={payload.dateTs}>
                              <circle cx={cx} cy={cy} r={6} fill={payload.color} fillOpacity={0.9} />
                              <circle cx={cx} cy={cy} r={10} fill={payload.color} fillOpacity={0.15} />
                            </g>
                          )
                        }}
                        activeDot={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-500 text-center py-6" style={{ fontSize: '12px' }}>
                    No data for {selectedExercise} in this time range.
                  </p>
                )}
              </>
            )}
          </div>

          {/* ── Sets Per Week ── */}
          <div className="pixel-card p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="pixel-font text-sky-400" style={{ fontSize: '13px' }}>Sets Per Week</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => setWeekOffset(v => v - 1)}
                  className="text-gray-400 hover:text-white w-8 h-8 flex items-center justify-center border border-gray-700 hover:border-gray-500 transition-all"
                  style={{ fontSize: '14px' }}>‹</button>
                <span className="text-gray-400 pixel-font text-center" style={{ fontSize: '11px', minWidth: '130px' }}>
                  {formatWeekLabel(weekStart)}
                </span>
                <button onClick={() => setWeekOffset(v => Math.min(0, v + 1))}
                  disabled={weekOffset === 0}
                  className="text-gray-400 hover:text-white w-8 h-8 flex items-center justify-center border border-gray-700 hover:border-gray-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ fontSize: '14px' }}>›</button>
              </div>
            </div>

            {weeklySetsByGroup.length === 0 ? (
              <p className="text-gray-500 text-center py-8" style={{ fontSize: '12px' }}>No workouts logged this week.</p>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={weeklySetsByGroup} barSize={36} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" vertical={false} />
                  <XAxis dataKey="group" tick={{ fill: '#6b7280', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} allowDecimals={false} />
                  <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} wrapperStyle={{ background: 'transparent', border: 'none', boxShadow: 'none' }} />
                  <Bar dataKey="sets" radius={[4, 4, 0, 0]}>
                    {weeklySetsByGroup.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </>
      )}
    </div>
  )
}
