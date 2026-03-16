import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'
import { calcWorkoutXP, calcWorkoutPoints, getRecommendation, getLevelFromXP, getLevelTitle } from '../lib/xpSystem'
import { CLASS_INFO, CLASSES } from '../lib/pixelCharacter'
import PixelCharacter from '../components/PixelCharacter'

// ─── Exercise Library ─────────────────────────────────────────────────────────
const MUSCLE_GROUPS = [
  {
    id: 'chest',
    label: 'Chest',
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
    exercises: [
      'Running', 'Treadmill', 'Cycling', 'Rowing Machine',
      'Elliptical', 'Jump Rope', 'Stair Climber', 'HIIT Sprint',
      'Battle Ropes', 'Burpee', 'Box Jump', 'Sled Push',
    ],
  },
]

// ─── Workout Text Parser ──────────────────────────────────────────────────────
const DATE_LINE_RE = /^((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}|\d{4}-\d{2}-\d{2}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i

function parseWorkoutText(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const exercises = []
  let current = null
  let detectedDate = null

  const setOnlyRe = /^[•\-\*]?\s*(\d+(?:\.\d+)?)\s*(?:lbs?|kg)?\s*[x×]\s*(\d+)(.*)$/i
  const inlineRe = /^(.+?)\s{1,}(\d+(?:\.\d+)?)\s*(?:lbs?|kg)?\s*[x×]\s*(\d+)(.*)?$/i
  const skipRe = /^(workout\s*#?\d*|date:|notes?:|day\s*\d|logged\s+using|logged\s+with)/i

  for (const line of lines) {
    // Try to detect a date line first
    const dateMatch = line.match(DATE_LINE_RE)
    if (dateMatch) {
      const d = new Date(dateMatch[0])
      if (!isNaN(d.getTime())) detectedDate = d
      continue
    }

    if (skipRe.test(line)) continue

    const setMatch = line.match(setOnlyRe)
    if (setMatch) {
      const trailingNote = setMatch[3]?.trim() || ''
      const startsWithNumber = /^[•\-\*]?\s*\d/.test(line)
      if (startsWithNumber && current) {
        current.sets.push({ weight: setMatch[1], reps: setMatch[2], note: trailingNote || undefined })
        continue
      }
    }

    const inlineMatch = line.match(inlineRe)
    if (inlineMatch) {
      const name = inlineMatch[1].replace(/^[•\-\*]\s*/, '').trim()
      const trailingNote = inlineMatch[4]?.trim() || ''
      if (/^\d+$/.test(name)) {
        if (current) current.sets.push({ weight: name, reps: inlineMatch[3], note: trailingNote || undefined })
      } else {
        current = { name: titleCase(name), sets: [{ weight: inlineMatch[2], reps: inlineMatch[3], note: trailingNote || undefined }] }
        exercises.push(current)
      }
      continue
    }

    const cleanName = line.replace(/^[•\-\*]\s*/, '').trim()
    if (cleanName && !/^\d+$/.test(cleanName)) {
      current = { name: titleCase(cleanName), sets: [] }
      exercises.push(current)
    }
  }

  return { exercises: exercises.filter(e => e.sets.length > 0), detectedDate }
}

function titleCase(str) {
  return str.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
}

function toDatetimeLocal(date) {
  const pad = n => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

// ─── Paste Import Modal ───────────────────────────────────────────────────────
function PasteImportModal({ onImport, onClose }) {
  const [text, setText] = useState('')
  const [preview, setPreview] = useState(null)
  const [workoutDate, setWorkoutDate] = useState(toDatetimeLocal(new Date()))

  function handleParse() {
    const { exercises, detectedDate } = parseWorkoutText(text)
    if (detectedDate) setWorkoutDate(toDatetimeLocal(detectedDate))
    setPreview(exercises)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="pixel-card w-full max-w-lg" style={{ background: '#12121e', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
          <span className="pixel-font text-sky-400" style={{ fontSize: '10px' }}>IMPORT FROM TEXT</span>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">✕</button>
        </div>

        {!preview ? (
          <div className="p-4 flex flex-col gap-3 flex-1">
            <p className="text-gray-400" style={{ fontSize: '12px' }}>
              Paste your workout from Rep Count, Notes, or any format.
            </p>
            <textarea
              autoFocus
              placeholder={"Feb 23, 2026\n\nBench Press\n135lb x 10\n155lb x 8\n\nSquat\n225lb x 5"}
              value={text}
              onChange={e => setText(e.target.value)}
              rows={10}
              className="w-full bg-black/40 border border-gray-700 text-white px-3 py-2 resize-none focus:border-sky-500 outline-none font-mono"
              style={{ fontSize: '12px' }}
            />
            <button
              onClick={handleParse}
              disabled={!text.trim()}
              className="pixel-btn bg-sky-700 border-sky-500 text-white py-3 disabled:opacity-40"
              style={{ fontSize: '10px' }}>
              Parse Workout →
            </button>
          </div>
        ) : (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="overflow-y-auto flex-1 p-4">
              {preview.length === 0 ? (
                <p className="text-red-400 text-center py-8" style={{ fontSize: '13px' }}>
                  Couldn't parse any exercises. Try a different format.
                </p>
              ) : (
                <>
                  {/* Editable workout date */}
                  <div className="mb-4 bg-black/40 border border-gray-700 p-3">
                    <div className="pixel-font text-gray-500 mb-2" style={{ fontSize: '7px' }}>WORKOUT DATE & TIME</div>
                    <input
                      type="datetime-local"
                      value={workoutDate}
                      onChange={e => setWorkoutDate(e.target.value)}
                      className="w-full bg-transparent text-white focus:outline-none"
                      style={{ fontSize: '13px' }}
                    />
                  </div>

                  <p className="pixel-font text-green-400 mb-3" style={{ fontSize: '8px' }}>
                    FOUND {preview.length} EXERCISE{preview.length !== 1 ? 'S' : ''}
                  </p>
                  {preview.map((ex, i) => (
                    <div key={i} className="bg-black/40 border border-gray-800 p-3 mb-2">
                      <div className="text-white font-medium mb-1" style={{ fontSize: '13px' }}>{ex.name}</div>
                      <div className="flex flex-wrap gap-2">
                        {ex.sets.map((s, j) => (
                          <span key={j} className="text-sky-300 text-xs border border-sky-900 px-2 py-0.5">
                            {s.weight}lbs × {s.reps}{s.note ? ` (${s.note})` : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
            <div className="p-4 border-t border-gray-800 flex gap-3">
              <button onClick={() => setPreview(null)}
                className="flex-1 py-2 border border-gray-700 text-gray-400 hover:text-white transition-all" style={{ fontSize: '11px' }}>
                ← Edit
              </button>
              <button onClick={() => { onImport(preview, workoutDate ? new Date(workoutDate) : null); onClose() }}
                disabled={preview.length === 0}
                className="flex-1 pixel-btn bg-green-700 border-green-500 text-white py-2 disabled:opacity-40" style={{ fontSize: '10px' }}>
                Add to Workout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

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
                {g.label}
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
      <input type="text" placeholder="note..." value={set.note || ''}
        onChange={e => onChange({ ...set, note: e.target.value })}
        className="flex-1 bg-black/40 border border-gray-700 text-white px-2 py-1.5 text-sm focus:border-sky-500 outline-none" />
      <button onClick={onRemove} className="text-gray-700 hover:text-red-400 text-sm px-1 flex-shrink-0">✕</button>
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
            <span className="ml-2 text-gray-600" style={{ fontSize: '11px' }}>{muscleGroup.label}</span>
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
        <span className="flex-1">Note</span>
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
  const [showPaste, setShowPaste] = useState(false)
  const [showFinish, setShowFinish] = useState(false)
  const [recommendations, setRecommendations] = useState({})
  const [previousWorkouts, setPreviousWorkouts] = useState({})
  const [savedWorkout, setSavedWorkout] = useState(null)
  const [levelUp, setLevelUp] = useState(null) // { oldLevel, newLevel, title }
  const [copied, setCopied] = useState(false)
  const [pickedUnlockClass, setPickedUnlockClass] = useState(null)
  const [unlockSaving, setUnlockSaving] = useState(false)
  const [unlockSaved, setUnlockSaved] = useState(false)

  const [startTime] = useState(() => new Date())
  const [endTime, setEndTime] = useState(() => {
    const now = new Date()
    const pad = n => String(n).padStart(2, '0')
    return `${pad(now.getHours())}:${pad(now.getMinutes())}`
  })
  const [importedDate, setImportedDate] = useState(null)
  const [importedStartStr, setImportedStartStr] = useState('')
  const [importedEndStr, setImportedEndStr] = useState('')

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

  function importExercises(parsed, date) {
    setExercises(prev => [...prev, ...parsed])
    if (date) {
      setImportedDate(date)
      const str = toDatetimeLocal(date)
      setImportedStartStr(str)
      setImportedEndStr(str)
    }
  }

  const totalSets = exercises.reduce((acc, e) => acc + (e.sets?.length || 0), 0)
  const xpPreview = calcWorkoutXP(totalSets)
  const pointsPreview = calcWorkoutPoints(totalSets)

  function buildShareText(name, exList, duration, workoutDate) {
    const d = workoutDate || new Date()
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    const lines = [dateStr]
    if (duration && duration > 0) lines.push(`${duration} min`)
    lines.push('')
    exList.forEach(ex => {
      lines.push(ex.name)
      ;(ex.sets || []).forEach(s => {
        const note = s.note ? ` ${s.note}` : ''
        lines.push(`${s.weight}lb x ${s.reps}${note}`)
      })
      lines.push('')
    })
    return lines.join('\n').trimEnd()
  }

  async function handleSave() {
    if (!workoutName.trim()) return alert('Give your workout a name!')

    let effectiveStart, effectiveEnd, durationMins

    if (importedDate) {
      effectiveStart = importedStartStr ? new Date(importedStartStr) : importedDate
      effectiveEnd = importedEndStr ? new Date(importedEndStr) : importedDate
      durationMins = effectiveEnd > effectiveStart ? Math.round((effectiveEnd - effectiveStart) / 60000) : null
    } else {
      const [hours, mins] = endTime.split(':').map(Number)
      effectiveEnd = new Date()
      effectiveEnd.setHours(hours, mins, 0, 0)
      if (effectiveEnd < startTime) effectiveEnd.setDate(effectiveEnd.getDate() + 1)
      effectiveStart = startTime
      durationMins = Math.round((effectiveEnd - effectiveStart) / 60000)
    }

    setSaving(true)
    setShowFinish(false)
    const oldLevel = getLevelFromXP(profile?.total_xp || 0).level
    try {
      await api.createWorkout({
        name: workoutName, exercises, notes,
        xp_earned: xpPreview, points_earned: pointsPreview,
        photo: photoFile,
        start_time: effectiveStart.toISOString(),
        end_time: effectiveEnd.toISOString(),
        duration_minutes: durationMins,
      })
      await refreshProfile()
      const newLevel = getLevelFromXP((profile?.total_xp || 0) + xpPreview).level
      if (newLevel > oldLevel) {
        setLevelUp({ oldLevel, newLevel, title: getLevelTitle(newLevel) })
      }
      setSavedWorkout({
        name: workoutName,
        exercises,
        xp: xpPreview,
        duration: durationMins,
        workoutDate: effectiveStart,
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
    const text = buildShareText(savedWorkout.name, savedWorkout.exercises, savedWorkout.duration, savedWorkout.workoutDate)
    try {
      await fetch(profile.discord_webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      })
    } catch (_) {}
  }

  async function handleCopy() {
    const text = buildShareText(savedWorkout.name, savedWorkout.exercises, savedWorkout.duration, savedWorkout.workoutDate)
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleNativeShare() {
    const text = buildShareText(savedWorkout.name, savedWorkout.exercises, savedWorkout.duration, savedWorkout.workoutDate)
    if (navigator.share) {
      try { await navigator.share({ title: savedWorkout.name, text }) } catch (_) {}
    } else {
      handleCopy()
    }
  }

  const startTimeStr = startTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) +
    ' ' + startTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase()

  if (levelUp) {
    const currentUnlocked = profile?.unlocked_classes || ['warrior', 'mage']
    const lockedClasses = CLASSES.filter(c => !currentUnlocked.includes(c))
    const canChoose = levelUp.newLevel % 5 === 0 && lockedClasses.length > 0

    async function handleUnlockClass() {
      if (!pickedUnlockClass) return
      setUnlockSaving(true)
      try {
        await api.updateProfile({ unlocked_classes: [...currentUnlocked, pickedUnlockClass] })
        await refreshProfile()
        setUnlockSaved(true)
      } catch (e) { console.error(e) }
      finally { setUnlockSaving(false) }
    }

    return (
      <div className="max-w-md mx-auto px-4 py-12 flex flex-col items-center text-center">
        <div className="pixel-card p-8 w-full" style={{ background: 'linear-gradient(135deg, #001d3d, #0a1628)', borderColor: '#38bdf8' }}>

          <div className="pixel-font text-yellow-400 mb-2" style={{ fontSize: '11px', letterSpacing: '3px' }}>LEVEL UP!</div>
          <div className="fantasy-font text-white mb-1" style={{ fontSize: '48px' }}>{levelUp.newLevel}</div>
          <div className="pixel-font text-sky-400 mb-6" style={{ fontSize: '14px' }}>{levelUp.title}</div>

          {canChoose && !unlockSaved ? (
            <div className="mb-6">
              <div className="bg-yellow-900/30 border border-yellow-600 px-4 py-3 mb-4">
                <div className="pixel-font text-yellow-400 mb-1" style={{ fontSize: '8px' }}>UNLOCK A NEW CLASS!</div>
                <div className="text-gray-300" style={{ fontSize: '12px' }}>Every 5 levels, pick one class to unlock</div>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {lockedClasses.map(cls => {
                  const info = CLASS_INFO[cls]
                  const selected = pickedUnlockClass === cls
                  return (
                    <button key={cls} onClick={() => setPickedUnlockClass(cls)}
                      className={`py-3 px-2 border-2 transition-all flex flex-col items-center gap-2 ${
                        selected ? 'border-yellow-400 bg-yellow-900/30' : 'border-gray-700 hover:border-gray-500 bg-black/20'
                      }`}>
                      <PixelCharacter options={{ gender: profile?.character?.gender || 'male', charClass: cls }} scale={0.4} />
                      <div className={`pixel-font ${selected ? 'text-yellow-300' : 'text-gray-400'}`} style={{ fontSize: '7px' }}>{info.label}</div>
                    </button>
                  )
                })}
              </div>
              <button onClick={handleUnlockClass} disabled={!pickedUnlockClass || unlockSaving}
                className="pixel-btn bg-yellow-700 border-yellow-500 text-white px-10 py-3 w-full disabled:opacity-40" style={{ fontSize: '10px' }}>
                {unlockSaving ? 'Unlocking...' : 'Unlock Class'}
              </button>
            </div>
          ) : canChoose && unlockSaved ? (
            <div className="bg-yellow-900/30 border border-yellow-600 px-4 py-3 mb-6">
              <div className="pixel-font text-yellow-400 mb-1" style={{ fontSize: '8px' }}>CLASS UNLOCKED!</div>
              <div className="text-white" style={{ fontSize: '14px' }}>{CLASS_INFO[pickedUnlockClass]?.label}</div>
              <div className="text-gray-400 text-xs mt-1">Change your character in Profile</div>
            </div>
          ) : (
            <div className="text-gray-400 mb-8" style={{ fontSize: '13px' }}>
              You reached Level {levelUp.newLevel}. Keep pushing!
            </div>
          )}

          {(!canChoose || unlockSaved) && (
            <button onClick={() => setLevelUp(null)}
              className="pixel-btn bg-yellow-700 border-yellow-500 text-white px-10 py-4 w-full" style={{ fontSize: '11px' }}>
              Continue →
            </button>
          )}
        </div>
      </div>
    )
  }

  if (savedWorkout) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 flex flex-col items-center text-center">
        <div className="pixel-card p-8 w-full">

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

      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="pixel-font text-sky-400" style={{ fontSize: '14px' }}>Log Workout</h1>
        <div className="text-right">
          <div className="pixel-font text-gray-500 mb-0.5" style={{ fontSize: '7px' }}>
            {importedDate ? 'WORKOUT DATE' : 'STARTED'}
          </div>
          <div className={importedDate ? 'text-yellow-400' : 'text-white'} style={{ fontSize: '12px' }}>
            {importedDate
              ? importedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
              : startTimeStr}
          </div>
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

          <p className="text-gray-500 mb-4">No exercises yet</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button onClick={() => setShowPicker(true)}
              className="pixel-btn bg-sky-700 border-sky-500 text-white px-8 py-3" style={{ fontSize: '10px' }}>
              + Add Exercise
            </button>
            <button onClick={() => setShowPaste(true)}
              className="pixel-btn bg-gray-800 border-gray-600 text-white px-8 py-3" style={{ fontSize: '10px' }}>
              Paste from App
            </button>
          </div>
        </div>
      ) : (
        <>
          {exercises.map((ex, i) => (
            <ExerciseCard key={`${ex.name}-${i}`} exercise={ex} index={i}
              onChange={e => setExercises(prev => prev.map((x, idx) => idx === i ? e : x))}
              onRemove={() => setExercises(prev => prev.filter((_, idx) => idx !== i))}
              recommendation={recommendations[ex.name]} />
          ))}
          <div className="flex gap-2 mb-5">
            <button onClick={() => setShowPicker(true)}
              className="flex-1 py-3 border-2 border-dashed border-gray-700 text-gray-400 hover:border-sky-600 hover:text-sky-400 transition-all" style={{ fontSize: '12px' }}>
              + Add Exercise
            </button>
            <button onClick={() => setShowPaste(true)}
              className="py-3 px-4 border-2 border-dashed border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300 transition-all" style={{ fontSize: '11px' }}>
              📋 Paste
            </button>
          </div>
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
          <button onClick={() => {
            if (!workoutName.trim()) return alert('Give your workout a name!')
            if (exercises.length === 0) return
            const now = new Date()
            const pad = n => String(n).padStart(2, '0')
            setEndTime(`${pad(now.getHours())}:${pad(now.getMinutes())}`)
            setShowFinish(true)
          }} disabled={saving || exercises.length === 0}
            className="pixel-btn bg-green-700 border-green-500 text-white px-6 py-3 flex-shrink-0 disabled:opacity-40" style={{ fontSize: '10px' }}>
            {saving ? 'Saving...' : '✓ Finish'}
          </button>
        </div>
      </div>

      {/* Exercise picker modal */}
      {showPicker && (
        <ExercisePicker onSelect={addExercise} onClose={() => setShowPicker(false)} />
      )}

      {/* Paste import modal */}
      {showPaste && (
        <PasteImportModal onImport={importExercises} onClose={() => setShowPaste(false)} />
      )}

      {/* Finish confirmation modal */}
      {showFinish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)' }}>
          <div className="pixel-card w-full max-w-sm p-6" style={{ background: '#0d0d1f' }}>
            <h2 className="pixel-font text-sky-400 mb-5 text-center" style={{ fontSize: '12px' }}>
              {importedDate ? 'CONFIRM WORKOUT TIME' : 'CONFIRM END TIME'}
            </h2>
            {importedDate ? (
              <>
                <div className="mb-3">
                  <div className="pixel-font text-gray-500 mb-2" style={{ fontSize: '7px' }}>START</div>
                  <input
                    type="datetime-local"
                    value={importedStartStr}
                    onChange={e => setImportedStartStr(e.target.value)}
                    className="w-full bg-black/40 border-2 border-gray-700 text-white px-3 py-2 focus:border-sky-500 outline-none"
                    style={{ fontSize: '13px' }}
                  />
                </div>
                <div className="mb-5">
                  <div className="pixel-font text-gray-500 mb-2" style={{ fontSize: '7px' }}>END</div>
                  <input
                    type="datetime-local"
                    value={importedEndStr}
                    onChange={e => setImportedEndStr(e.target.value)}
                    className="w-full bg-black/40 border-2 border-gray-700 text-white px-3 py-2 focus:border-sky-500 outline-none"
                    style={{ fontSize: '13px' }}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="mb-2">
                  <div className="pixel-font text-gray-500 mb-1" style={{ fontSize: '7px' }}>START</div>
                  <div className="text-gray-300" style={{ fontSize: '13px' }}>{startTimeStr}</div>
                </div>
                <div className="mb-5">
                  <div className="pixel-font text-gray-500 mb-2" style={{ fontSize: '7px' }}>END</div>
                  <input
                    type="time"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="w-full bg-black/40 border-2 border-gray-700 text-white px-3 py-2 focus:border-sky-500 outline-none text-lg"
                  />
                </div>
              </>
            )}
            <div className="flex gap-3">
              <button onClick={() => setShowFinish(false)}
                className="flex-1 py-3 border border-gray-700 text-gray-400 hover:text-white transition-all" style={{ fontSize: '11px' }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 pixel-btn bg-green-700 border-green-500 text-white py-3 disabled:opacity-40" style={{ fontSize: '10px' }}>
                {saving ? 'Saving...' : 'Save Workout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
