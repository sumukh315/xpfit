import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'
import { calcWorkoutXP, calcWorkoutPoints, getRecommendation } from '../lib/xpSystem'

// ─── Exercise Library ─────────────────────────────────────────────────────────
const MUSCLE_GROUPS = [
  {
    id: 'chest',
    label: 'Chest',
    icon: '🫀',
    exercises: [
      'Bench Press', 'Incline Bench Press', 'Decline Bench Press',
      'Dumbbell Fly', 'Incline Dumbbell Fly', 'Cable Fly',
      'Push-Up', 'Chest Dip', 'Pec Deck', 'Cable Crossover',
      'Landmine Press', 'Machine Chest Press',
    ],
  },
  {
    id: 'back',
    label: 'Back',
    icon: '🔙',
    exercises: [
      'Deadlift', 'Barbell Row', 'Dumbbell Row', 'Pull-Up', 'Chin-Up',
      'Lat Pulldown', 'Seated Cable Row', 'T-Bar Row', 'Face Pull',
      'Straight-Arm Pulldown', 'Rack Pull', 'Good Morning',
      'Hyperextension', 'Shrug',
    ],
  },
  {
    id: 'arms',
    label: 'Arms',
    icon: '💪',
    exercises: [
      'Barbell Curl', 'Dumbbell Curl', 'Hammer Curl', 'Preacher Curl',
      'Cable Curl', 'Concentration Curl', 'Incline Dumbbell Curl',
      'Tricep Pushdown', 'Skull Crusher', 'Overhead Tricep Extension',
      'Diamond Push-Up', 'Tricep Dip', 'Close-Grip Bench Press',
      'Wrist Curl', 'Reverse Curl',
    ],
  },
  {
    id: 'shoulders',
    label: 'Shoulders',
    icon: '🎯',
    exercises: [
      'Overhead Press', 'Dumbbell Shoulder Press', 'Arnold Press',
      'Lateral Raise', 'Front Raise', 'Rear Delt Fly',
      'Upright Row', 'Cable Lateral Raise', 'Face Pull',
      'Machine Shoulder Press', 'Landmine Lateral Raise',
    ],
  },
  {
    id: 'legs',
    label: 'Legs',
    icon: '🦵',
    exercises: [
      'Squat', 'Front Squat', 'Goblet Squat', 'Bulgarian Split Squat',
      'Leg Press', 'Hack Squat', 'Romanian Deadlift', 'Leg Curl',
      'Leg Extension', 'Hip Thrust', 'Glute Bridge', 'Lunge',
      'Walking Lunge', 'Step-Up', 'Calf Raise', 'Seated Calf Raise',
      'Sumo Deadlift', 'Box Jump',
    ],
  },
  {
    id: 'abs',
    label: 'Abs',
    icon: '⚡',
    exercises: [
      'Crunch', 'Sit-Up', 'Bicycle Crunch', 'Russian Twist',
      'Plank', 'Side Plank', 'Leg Raise', 'Hanging Leg Raise',
      'Ab Rollout', 'Cable Crunch', 'Dragon Flag',
      'Mountain Climber', 'V-Up', 'Dead Bug',
    ],
  },
  {
    id: 'cardio',
    label: 'Cardio',
    icon: '🏃',
    exercises: [
      'Running', 'Treadmill', 'Cycling', 'Rowing Machine',
      'Elliptical', 'Jump Rope', 'Stair Climber', 'HIIT Sprint',
      'Battle Ropes', 'Burpee', 'Box Jump', 'Sled Push',
    ],
  },
]

// ─── Exercise Picker Modal ────────────────────────────────────────────────────
function ExercisePicker({ onSelect, onClose }) {
  const [activeGroup, setActiveGroup] = useState('chest')
  const [search, setSearch] = useState('')
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const group = MUSCLE_GROUPS.find(g => g.id === activeGroup)
  const filtered = search
    ? MUSCLE_GROUPS.flatMap(g => g.exercises).filter(e => e.toLowerCase().includes(search.toLowerCase()))
    : group.exercises

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="pixel-card w-full max-w-lg" style={{ background: '#12121e', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center gap-3">
          <input ref={inputRef} type="text" placeholder="Search exercises..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-black/40 border border-gray-700 text-white px-3 py-2 focus:border-sky-500 outline-none"
            style={{ fontSize: '13px' }} />
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl px-2">✕</button>
        </div>

        {/* Muscle group tabs */}
        {!search && (
          <div className="flex overflow-x-auto border-b border-gray-800" style={{ scrollbarWidth: 'none' }}>
            {MUSCLE_GROUPS.map(g => (
              <button key={g.id} onClick={() => setActiveGroup(g.id)}
                className={`flex-shrink-0 px-4 py-3 pixel-font transition-all ${
                  activeGroup === g.id
                    ? 'text-sky-300 border-b-2 border-sky-500 bg-sky-900/20'
                    : 'text-gray-500 hover:text-gray-300'
                }`} style={{ fontSize: '8px' }}>
                {g.icon} {g.label}
              </button>
            ))}
          </div>
        )}

        {/* Exercise list */}
        <div className="overflow-y-auto flex-1 p-2">
          {search && (
            <p className="pixel-font text-gray-600 px-2 py-1 mb-1" style={{ fontSize: '7px' }}>
              {filtered.length} results
            </p>
          )}
          <div className="grid grid-cols-2 gap-1">
            {filtered.map(name => (
              <button key={name} onClick={() => { onSelect(name); onClose() }}
                className="text-left px-3 py-2.5 border border-gray-800 hover:border-sky-600 hover:bg-sky-900/20 transition-all text-gray-300 hover:text-white"
                style={{ fontSize: '12px' }}>
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Set Row ──────────────────────────────────────────────────────────────────
function SetRow({ set, index, onChange, onRemove }) {
  return (
    <div className="flex gap-2 items-center">
      <span className="pixel-font text-gray-600 w-6 text-center flex-shrink-0" style={{ fontSize: '8px' }}>{index + 1}</span>
      <input type="number" placeholder="lbs" value={set.weight || ''}
        onChange={e => onChange({ ...set, weight: e.target.value })}
        className="w-20 bg-black/40 border border-gray-700 text-white px-2 py-1.5 text-sm text-center focus:border-sky-500 outline-none" />
      <span className="text-gray-600 flex-shrink-0">×</span>
      <input type="number" placeholder="reps" value={set.reps || ''}
        onChange={e => onChange({ ...set, reps: e.target.value })}
        className="w-16 bg-black/40 border border-gray-700 text-white px-2 py-1.5 text-sm text-center focus:border-sky-500 outline-none" />
      <button onClick={onRemove} className="text-gray-700 hover:text-red-400 text-sm px-1 ml-auto">✕</button>
    </div>
  )
}

// ─── Exercise Card ────────────────────────────────────────────────────────────
function ExerciseCard({ exercise, index, onChange, onRemove, recommendation }) {
  const muscleGroup = MUSCLE_GROUPS.find(g => g.exercises.includes(exercise.name))

  function addSet() {
    const lastSet = exercise.sets?.[exercise.sets.length - 1]
    onChange({ ...exercise, sets: [...(exercise.sets || []), { weight: lastSet?.weight || '', reps: lastSet?.reps || '' }] })
  }
  function updateSet(i, set) {
    const sets = [...(exercise.sets || [])]
    sets[i] = set
    onChange({ ...exercise, sets })
  }
  function removeSet(i) {
    onChange({ ...exercise, sets: (exercise.sets || []).filter((_, idx) => idx !== i) })
  }

  return (
    <div className="pixel-card p-4 mb-3">
      <div className="flex justify-between items-center mb-3">
        <div>
          <span className="text-white font-medium" style={{ fontSize: '15px' }}>{exercise.name}</span>
          {muscleGroup && (
            <span className="ml-2 text-gray-600" style={{ fontSize: '11px' }}>{muscleGroup.icon} {muscleGroup.label}</span>
          )}
        </div>
        <button onClick={onRemove} className="text-gray-700 hover:text-red-400 ml-2">✕</button>
      </div>

      {recommendation && (
        <div className="bg-sky-900/20 border border-sky-800 p-2 mb-3 text-xs text-sky-300">
          💡 <span className="pixel-font" style={{ fontSize: '7px' }}>TIP:</span> {recommendation.reason}
          {recommendation.weight && ` Try ${recommendation.weight}lbs × ${recommendation.reps} reps.`}
        </div>
      )}

      <div className="flex gap-2 text-xs text-gray-600 mb-2 ml-8">
        <span className="w-20 text-center">Weight</span>
        <span className="w-16 text-center">Reps</span>
      </div>
      <div className="flex flex-col gap-2 mb-3">
        {(exercise.sets || []).map((set, i) => (
          <SetRow key={i} set={set} index={i} onChange={s => updateSet(i, s)} onRemove={() => removeSet(i)} />
        ))}
      </div>
      <button onClick={addSet} className="text-sky-400 hover:text-sky-300 text-xs border border-sky-900 hover:border-sky-600 px-3 py-1 transition-all" style={{ fontSize: '11px' }}>
        + Add Set
      </button>
    </div>
  )
}

// ─── Timer Display ────────────────────────────────────────────────────────────
function formatDuration(ms) {
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// ─── Main Logger ──────────────────────────────────────────────────────────────
export default function WorkoutLogger() {
  const { profile, refreshProfile } = useAuth()
  const navigate = useNavigate()

  const [workoutName, setWorkoutName] = useState('')
  const [exercises, setExercises] = useState([])
  const [notes, setNotes] = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [recommendations, setRecommendations] = useState({})
  const [previousWorkouts, setPreviousWorkouts] = useState({})
  const [savedWorkout, setSavedWorkout] = useState(null)
  const [copied, setCopied] = useState(false)

  // Timer
  const [startTime] = useState(() => new Date())
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setElapsed(Date.now() - startTime.getTime()), 1000)
    return () => clearInterval(id)
  }, [startTime])

  useEffect(() => { fetchPreviousData() }, [])

  async function fetchPreviousData() {
    try {
      const data = await api.getWorkouts()
      const prevMap = {}
      data.forEach(w => {
        w.exercises?.forEach(ex => {
          if (ex.name && !prevMap[ex.name]) {
            const lastSet = ex.sets?.[ex.sets.length - 1]
            if (lastSet) prevMap[ex.name] = { weight: parseFloat(lastSet.weight), reps: parseInt(lastSet.reps), sets: ex.sets.length }
          }
        })
      })
      setPreviousWorkouts(prevMap)
    } catch (e) { console.error(e) }
  }

  useEffect(() => {
    const recs = {}
    exercises.forEach(ex => {
      if (ex.name && previousWorkouts[ex.name]) {
        recs[ex.name] = getRecommendation(previousWorkouts[ex.name].weight, previousWorkouts[ex.name].reps, previousWorkouts[ex.name].sets)
      }
    })
    setRecommendations(recs)
  }, [exercises, previousWorkouts])

  function addExercise(name) {
    setExercises(prev => [...prev, { name, sets: [{ weight: '', reps: '' }] }])
  }

  const totalSets = exercises.reduce((acc, e) => acc + (e.sets?.length || 0), 0)
  const xpPreview = calcWorkoutXP(totalSets)
  const pointsPreview = calcWorkoutPoints(totalSets)

  function buildShareText(name, exList, xp, duration) {
    const lines = [`Workout: ${name}`]
    if (duration) lines.push(`Duration: ${duration} min`)
    exList.forEach(ex => {
      const sets = (ex.sets || []).map(s => `${s.weight}lbs x${s.reps}`).join(', ')
      lines.push(`  ${ex.name}: ${sets}`)
    })
    lines.push(`XP earned: +${xp}`)
    lines.push('— XPFit')
    return lines.join('\n')
  }

  async function handleSave() {
    if (!workoutName.trim()) return alert('Give your workout a name!')
    const endTime = new Date()
    setSaving(true)
    try {
      await api.createWorkout({
        name: workoutName, exercises, notes,
        xp_earned: xpPreview, points_earned: pointsPreview,
        photo: photoFile,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        duration_minutes: Math.round((endTime - startTime) / 60000),
      })
      await refreshProfile()
      setSavedWorkout({
        name: workoutName,
        exercises,
        xp: xpPreview,
        duration: Math.round((endTime - startTime) / 60000),
      })
    } catch (e) {
      console.error(e)
      alert('Error saving workout: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDiscordShare() {
    if (!profile?.discord_webhook) {
      alert('Add your Discord webhook in the Friends page first.')
      return
    }
    const text = buildShareText(savedWorkout.name, savedWorkout.exercises, savedWorkout.xp, savedWorkout.duration)
    try {
      await fetch(profile.discord_webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      })
    } catch (_) {}
  }

  async function handleCopy() {
    const text = buildShareText(savedWorkout.name, savedWorkout.exercises, savedWorkout.xp, savedWorkout.duration)
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleNativeShare() {
    const text = buildShareText(savedWorkout.name, savedWorkout.exercises, savedWorkout.xp, savedWorkout.duration)
    if (navigator.share) {
      await navigator.share({ title: savedWorkout.name, text })
    } else {
      handleCopy()
    }
  }

  const startTimeStr = startTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) +
    ' ' + startTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase()
  const currentTimeStr = new Date(startTime.getTime() + elapsed).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) +
    ' ' + new Date(startTime.getTime() + elapsed).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase()

  if (savedWorkout) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 flex flex-col items-center text-center">
        <div className="pixel-card p-8 w-full">
          <div className="text-5xl mb-4">💪</div>
          <h2 className="fantasy-font text-green-400 mb-1" style={{ fontSize: '24px' }}>Workout Done!</h2>
          <p className="text-gray-400 mb-2" style={{ fontSize: '13px' }}>{savedWorkout.name}</p>
          <p className="pixel-font text-sky-400 mb-6" style={{ fontSize: '12px' }}>+{savedWorkout.xp} XP earned</p>

          <p className="pixel-font text-gray-500 mb-3" style={{ fontSize: '8px' }}>SHARE YOUR WORKOUT</p>
          <div className="flex flex-col gap-3 mb-6">
            <button onClick={handleDiscordShare}
              className="pixel-btn bg-indigo-800 border-indigo-600 text-white py-3 w-full" style={{ fontSize: '10px' }}>
              Share to Discord
            </button>
            <button onClick={handleNativeShare}
              className="pixel-btn bg-blue-800 border-blue-600 text-white py-3 w-full" style={{ fontSize: '10px' }}>
              Share via Text / Messenger
            </button>
            <button onClick={handleCopy}
              className="pixel-btn bg-gray-800 border-gray-600 text-white py-3 w-full" style={{ fontSize: '10px' }}>
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </button>
          </div>

          <button onClick={() => navigate('/dashboard')}
            className="text-gray-500 hover:text-white transition-colors" style={{ fontSize: '12px' }}>
            Skip → Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-32">

      {/* Header with timer */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="pixel-font text-sky-400" style={{ fontSize: '14px' }}>Log Workout</h1>
        <div className="text-center">
          <div className="pixel-font text-white tabular-nums" style={{ fontSize: '22px' }}>{formatDuration(elapsed)}</div>
          <div className="text-gray-600" style={{ fontSize: '10px' }}>elapsed</div>
        </div>
      </div>

      {/* Time info */}
      <div className="pixel-card p-3 mb-5 flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <div className="pixel-font text-gray-500 mb-1" style={{ fontSize: '7px' }}>START TIME</div>
          <div className="text-white" style={{ fontSize: '12px' }}>{startTimeStr}</div>
        </div>
        <div className="flex-1">
          <div className="pixel-font text-gray-500 mb-1" style={{ fontSize: '7px' }}>END TIME</div>
          <div className="text-gray-400" style={{ fontSize: '12px' }}>{currentTimeStr}</div>
        </div>
      </div>

      {/* Workout name */}
      <div className="pixel-card p-4 mb-5">
        <input type="text" placeholder="Workout name (e.g. Push Day, Leg Day...)"
          value={workoutName} onChange={e => setWorkoutName(e.target.value)}
          className="w-full bg-transparent text-white text-lg border-b-2 border-gray-700 pb-2 focus:border-sky-500 outline-none" />
      </div>

      {/* Exercise cards */}
      {exercises.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-gray-800 mb-5">
          <div className="text-4xl mb-3">💪</div>
          <p className="text-gray-500 mb-4">No exercises yet</p>
          <button onClick={() => setShowPicker(true)}
            className="pixel-btn bg-sky-700 border-sky-500 text-white px-8 py-3" style={{ fontSize: '10px' }}>
            + Add First Exercise
          </button>
        </div>
      ) : (
        <>
          {exercises.map((ex, i) => (
            <ExerciseCard key={`${ex.name}-${i}`} exercise={ex} index={i}
              onChange={e => setExercises(prev => prev.map((x, idx) => idx === i ? e : x))}
              onRemove={() => setExercises(prev => prev.filter((_, idx) => idx !== i))}
              recommendation={recommendations[ex.name]} />
          ))}
          <button onClick={() => setShowPicker(true)}
            className="w-full py-3 border-2 border-dashed border-gray-700 text-gray-400 hover:border-sky-600 hover:text-sky-400 transition-all mb-5" style={{ fontSize: '12px' }}>
            + Add Exercise
          </button>
        </>
      )}

      {/* Notes */}
      <div className="pixel-card p-4 mb-3">
        <label className="pixel-font text-gray-400 block mb-2" style={{ fontSize: '8px' }}>NOTES</label>
        <textarea placeholder="How did it go? Any PRs? How you felt..." value={notes} onChange={e => setNotes(e.target.value)}
          rows={3} className="w-full bg-black/40 border border-gray-700 text-white px-3 py-2 resize-none focus:border-sky-500 outline-none" />
      </div>

      {/* Photo */}
      <div className="pixel-card p-4 mb-5">
        <label className="pixel-font text-gray-400 block mb-2" style={{ fontSize: '8px' }}>ADD PHOTO</label>
        <input type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files[0])} className="text-gray-400 text-sm" />
        {photoFile && <p className="text-green-400 text-xs mt-1">Selected: {photoFile.name}</p>}
      </div>

      {/* Sticky finish bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-sky-900/60 px-4 py-4"
        style={{ background: 'linear-gradient(to top, #0d0d1a, #12122288)' }}>
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div>
            <div className="pixel-font text-gray-500 mb-1" style={{ fontSize: '7px' }}>YOU WILL EARN</div>
            <div className="flex gap-3">
              <span className="pixel-font text-sky-400" style={{ fontSize: '13px' }}>+{xpPreview} XP</span>
              <span className="pixel-font text-yellow-400" style={{ fontSize: '13px' }}>+{pointsPreview} 🪙</span>
              <span className="text-gray-600" style={{ fontSize: '11px' }}>{exercises.length} exercises · {totalSets} sets</span>
            </div>
          </div>
          <button onClick={handleSave} disabled={saving || exercises.length === 0}
            className="pixel-btn bg-green-700 border-green-500 text-white px-6 py-3 flex-shrink-0 disabled:opacity-40" style={{ fontSize: '10px' }}>
            {saving ? 'Saving...' : '✓ Finish'}
          </button>
        </div>
      </div>

      {/* Exercise picker modal */}
      {showPicker && (
        <ExercisePicker onSelect={addExercise} onClose={() => setShowPicker(false)} />
      )}
    </div>
  )
}
