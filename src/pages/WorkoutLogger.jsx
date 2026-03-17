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
    id: 'arms',
    label: 'Arms',
    exercises: [
      'Isolated Bicep Curl', 'Isolated Hammer Curl',
      'Barbell Curl', 'Dumbbell Curl', 'Hammer Curl', 'Preacher Curl',
      'Cable Curl', 'Concentration Curl', 'Incline Dumbbell Curl',
      'Tricep Pushdown', 'Skull Crusher', 'Overhead Tricep Extension',
      'Diamond Push-Up', 'Tricep Dip', 'Close-Grip Bench Press',
      'Wrist Curl', 'Reverse Curl',
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
    id: 'abs',
    label: 'Abs',
    exercises: [
      'Crunch', 'Sit-Up', 'Bicycle Crunch', 'Russian Twist',
      'Plank', 'Side Plank', 'Leg Raise', 'Hanging Leg Raise',
      'Ab Rollout', 'Cable Crunch', 'Dragon Flag',
      'Mountain Climber', 'V-Up', 'Dead Bug',
      'Torso Rotation', 'Cable Woodchop', 'Landmine Rotation',
      'Pallof Press', 'Medicine Ball Rotational Throw', 'Seated Torso Rotation',
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
  const weightOnlyRe = /^[•\-\*]?\s*(\d+(?:\.\d+)?)\s*(?:lbs?|kg)?\s*$/i
  const dashFormatRe = /^(.+?)\s*[-–]\s*(.+)$/
  const inlineRe = /^(.+?)\s{1,}(\d+(?:\.\d+)?)\s*(?:lbs?|kg)?\s*[x×]\s*(\d+)(.*)?$/i
  const skipRe = /^(workout\s*#?\d*|date:|notes?:|day\s*\d|logged\s+using|logged\s+with)/i

  function parseDashChunk(chunk) {
    chunk = chunk.trim().replace(/\*+$/, () => '')
    const raw = chunk.trim()
    const xm = raw.match(/^(\d+(?:\.\d+)?)\s*(?:lbs?|kg)?\s*[x×]\s*(\d+)\s*(.*)$/i)
    if (xm) return { weight: xm[1], reps: xm[2], note: xm[3]?.trim() || undefined }
    const wm = raw.match(/^(\d+(?:\.\d+)?)\s*(min|km|cal|sec|s)?\s*$/i)
    if (wm) return { weight: wm[1], reps: '1', note: wm[2] || undefined }
    return null
  }

  for (const line of lines) {
    const dateMatch = line.match(DATE_LINE_RE)
    if (dateMatch) {
      const d = new Date(dateMatch[0])
      if (!isNaN(d.getTime())) detectedDate = d
      continue
    }
    if (skipRe.test(line)) continue

    const dashMatch = line.match(dashFormatRe)
    if (dashMatch) {
      const name = dashMatch[1].replace(/^[•\-\*]\s*/, '').trim()
      if (name && !/^\d+$/.test(name)) {
        const chunks = dashMatch[2].split('/')
        const sets = chunks.map(parseDashChunk).filter(Boolean)
        if (sets.length > 0) {
          current = { name: titleCase(name), sets }
          exercises.push(current)
          continue
        }
      }
    }

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

    const weightMatch = line.match(weightOnlyRe)
    if (weightMatch && current) {
      const w = parseFloat(weightMatch[1])
      if (w > 5) {
        current.sets.push({ weight: weightMatch[1], reps: '1' })
        continue
      }
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

function formatDatetimeDisplay(str) {
  if (!str) return '—'
  const d = new Date(str)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) +
    ' at ' + d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
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
          <span className="pixel-font text-sky-400" style={{ fontSize: '13px' }}>IMPORT FROM TEXT</span>
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
              style={{ fontSize: '13px' }}>
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
                  <div className="mb-4 bg-black/40 border border-gray-700 p-3">
                    <div className="pixel-font text-gray-500 mb-2" style={{ fontSize: '13px' }}>WORKOUT DATE & TIME</div>
                    <input
                      type="datetime-local"
                      value={workoutDate}
                      onChange={e => setWorkoutDate(e.target.value)}
                      className="w-full bg-transparent text-white focus:outline-none"
                      style={{ fontSize: '13px' }}
                    />
                  </div>
                  <p className="pixel-font text-green-400 mb-3" style={{ fontSize: '12px' }}>
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
                className="flex-1 py-2 border border-gray-700 text-gray-400 hover:text-white transition-all" style={{ fontSize: '13px' }}>
                ← Edit
              </button>
              <button onClick={() => { onImport(preview, workoutDate ? new Date(workoutDate) : null); onClose() }}
                disabled={preview.length === 0}
                className="flex-1 pixel-btn bg-green-700 border-green-500 text-white py-2 disabled:opacity-40" style={{ fontSize: '13px' }}>
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
function ExercisePicker({ onSelect, onClose, customExercises = {}, usageCounts = {}, onAddCustomExercise }) {
  const [activeGroup, setActiveGroup] = useState('legs')
  const [search, setSearch] = useState('')
  const [addingCustom, setAddingCustom] = useState(false)
  const [customName, setCustomName] = useState('')
  const inputRef = useRef(null)
  const customInputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])
  useEffect(() => { if (addingCustom) customInputRef.current?.focus() }, [addingCustom])

  const group = MUSCLE_GROUPS.find(g => g.id === activeGroup)

  function sortByUsage(names) {
    return [...names].sort((a, b) => (usageCounts[b] || 0) - (usageCounts[a] || 0))
  }

  const groupCustom = customExercises[activeGroup] || []
  const groupDefault = sortByUsage(group?.exercises || [])
  const allForGroup = [...groupCustom, ...groupDefault.filter(e => !groupCustom.includes(e))]

  const allExercises = search
    ? (() => {
        const all = MUSCLE_GROUPS.flatMap(g => [
          ...(customExercises[g.id] || []),
          ...g.exercises.filter(e => !(customExercises[g.id] || []).includes(e)),
        ])
        const unique = [...new Set(all)]
        const matched = unique.filter(e => e.toLowerCase().includes(search.toLowerCase()))
        return sortByUsage(matched)
      })()
    : allForGroup

  function handleAddCustom() {
    const name = customName.trim()
    if (!name) return
    onAddCustomExercise(activeGroup, name)
    setCustomName('')
    setAddingCustom(false)
    onSelect(name)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="pixel-card w-full max-w-lg" style={{ background: '#12121e', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div className="p-4 border-b border-gray-800 flex items-center gap-3">
          <input ref={inputRef} type="text" placeholder="Search exercises..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-black/40 border border-gray-700 text-white px-3 py-2 focus:border-sky-500 outline-none"
            style={{ fontSize: '13px' }} />
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl px-2">✕</button>
        </div>
        {!search && (
          <div className="flex overflow-x-auto border-b border-gray-800" style={{ scrollbarWidth: 'none' }}>
            {MUSCLE_GROUPS.map(g => (
              <button key={g.id} onClick={() => { setActiveGroup(g.id); setAddingCustom(false) }}
                className={`flex-shrink-0 px-4 py-3 pixel-font transition-all ${
                  activeGroup === g.id
                    ? 'text-sky-300 border-b-2 border-sky-500 bg-sky-900/20'
                    : 'text-gray-500 hover:text-gray-300'
                }`} style={{ fontSize: '12px' }}>
                {g.label}
              </button>
            ))}
          </div>
        )}
        <div className="overflow-y-auto flex-1 p-2">
          {search && (
            <p className="pixel-font text-gray-600 px-2 py-1 mb-1" style={{ fontSize: '13px' }}>
              {allExercises.length} results
            </p>
          )}
          <div className="grid grid-cols-2 gap-1">
            {allExercises.map(name => {
              const isCustom = (customExercises[activeGroup] || []).includes(name) ||
                Object.values(customExercises).some(arr => arr.includes(name))
              return (
                <button key={name} onClick={() => { onSelect(name); onClose() }}
                  className="text-left px-3 py-2.5 border border-gray-800 hover:border-sky-600 hover:bg-sky-900/20 transition-all text-gray-300 hover:text-white flex items-center gap-1.5"
                  style={{ fontSize: '12px' }}>
                  {isCustom && <span className="text-sky-500 flex-shrink-0" style={{ fontSize: '10px' }}>★</span>}
                  <span>{name}</span>
                  {usageCounts[name] > 0 && (
                    <span className="ml-auto text-gray-600 flex-shrink-0" style={{ fontSize: '10px' }}>{usageCounts[name]}×</span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Add custom exercise */}
          {!search && (
            <div className="mt-3 px-1">
              {addingCustom ? (
                <div className="flex gap-2">
                  <input ref={customInputRef} type="text" placeholder="Exercise name..."
                    value={customName} onChange={e => setCustomName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddCustom()}
                    className="flex-1 bg-black/40 border border-sky-700 text-white px-3 py-2 focus:outline-none"
                    style={{ fontSize: '13px' }} />
                  <button onClick={handleAddCustom}
                    className="pixel-btn bg-sky-700 border-sky-500 text-white px-4" style={{ fontSize: '12px' }}>
                    Add
                  </button>
                  <button onClick={() => { setAddingCustom(false); setCustomName('') }}
                    className="text-gray-500 hover:text-white px-2" style={{ fontSize: '18px' }}>✕</button>
                </div>
              ) : (
                <button onClick={() => setAddingCustom(true)}
                  className="w-full py-2.5 border border-dashed border-gray-700 text-sky-400 hover:border-sky-600 hover:bg-sky-900/10 transition-all text-center"
                  style={{ fontSize: '12px' }}>
                  + Add Custom Exercise to {group?.label}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Set Row ──────────────────────────────────────────────────────────────────
function SetRow({ set, index, onChange, onRemove, isIsolated }) {
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!showMenu) return
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showMenu])

  const inputCls = 'bg-transparent text-white w-full focus:outline-none font-semibold'

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-800/40 last:border-b-0">
      {/* Circled number */}
      <div className="w-7 h-7 rounded-full border border-gray-600 flex items-center justify-center flex-shrink-0">
        <span className="text-gray-400 font-semibold" style={{ fontSize: '12px' }}>{index + 1}</span>
      </div>

      {isIsolated ? (
        <>
          {/* Left */}
          <div className="flex-1 min-w-0">
            <div className="text-blue-400 font-semibold" style={{ fontSize: '10px' }}>LEFT lb</div>
            <input type="number" value={set.weightLeft || ''} placeholder="—"
              onChange={e => onChange({ ...set, weightLeft: e.target.value })}
              className={inputCls} style={{ fontSize: '15px' }} />
          </div>
          {/* Right */}
          <div className="flex-1 min-w-0">
            <div className="text-orange-400 font-semibold" style={{ fontSize: '10px' }}>RIGHT lb</div>
            <input type="number" value={set.weightRight || ''} placeholder="—"
              onChange={e => onChange({ ...set, weightRight: e.target.value })}
              className={inputCls} style={{ fontSize: '15px' }} />
          </div>
        </>
      ) : (
        <div className="flex-1 min-w-0">
          <div className="text-gray-500" style={{ fontSize: '11px' }}>Lb</div>
          <input type="number" value={set.weight || ''} placeholder="—"
            onChange={e => onChange({ ...set, weight: e.target.value })}
            className={inputCls} style={{ fontSize: '15px' }} />
        </div>
      )}

      {/* Reps */}
      <div className="flex-1 min-w-0">
        <div className="text-gray-500" style={{ fontSize: '11px' }}>Reps</div>
        <input type="number" value={set.reps || ''} placeholder="—"
          onChange={e => onChange({ ...set, reps: e.target.value })}
          className={inputCls} style={{ fontSize: '15px' }} />
      </div>

      {/* Notes */}
      <div className="flex-[2] min-w-0">
        <div className="text-gray-500" style={{ fontSize: '11px' }}>Notes</div>
        <input type="text" value={set.note || ''} placeholder="—"
          onChange={e => onChange({ ...set, note: e.target.value })}
          className="bg-transparent text-white w-full focus:outline-none"
          style={{ fontSize: '14px' }} />
      </div>

      {/* Set menu */}
      <div className="relative flex-shrink-0" ref={menuRef}>
        <button onClick={() => setShowMenu(v => !v)}
          className="text-sky-400 hover:text-sky-300 w-8 h-8 flex items-center justify-center"
          style={{ fontSize: '20px', letterSpacing: '1px', lineHeight: 1 }}>
          ···
        </button>
        {showMenu && (
          <div className="absolute right-0 top-9 z-50 bg-gray-900 border border-gray-700 rounded-xl shadow-xl overflow-hidden w-36"
            style={{ backdropFilter: 'blur(12px)' }}>
            <button onClick={() => { onRemove(); setShowMenu(false) }}
              className="w-full text-left px-4 py-3 text-red-400 hover:bg-red-900/20"
              style={{ fontSize: '13px' }}>
              Delete Set
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── History Modal ─────────────────────────────────────────────────────────────
function HistoryModal({ exerciseName, allWorkouts, onClose }) {
  const history = []
  for (const w of (allWorkouts || [])) {
    for (const ex of (w.exercises || [])) {
      if (ex.name === exerciseName && ex.sets?.length > 0) {
        history.push({ date: w.start_time || w.created_at, sets: ex.sets })
        break
      }
    }
    if (history.length >= 6) break
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.8)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-lg" style={{
        background: '#0d0d1f',
        borderRadius: '20px 20px 0 0',
        border: '1px solid rgba(103,232,249,0.14)',
        borderBottom: 'none',
        maxHeight: '72vh',
        display: 'flex', flexDirection: 'column',
      }}>
        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
          <div>
            <div className="font-bold text-white" style={{ fontSize: '16px' }}>{exerciseName}</div>
            <div className="pixel-font text-gray-500 mt-0.5" style={{ fontSize: '11px' }}>HISTORY</div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl w-8 h-8 flex items-center justify-center">✕</button>
        </div>
        <div className="overflow-y-auto flex-1 px-4 py-4 flex flex-col gap-5">
          {history.length === 0 ? (
            <p className="text-gray-500 text-center py-8" style={{ fontSize: '13px' }}>No history yet</p>
          ) : history.map((entry, i) => (
            <div key={i}>
              <div className="text-gray-400 font-semibold mb-2" style={{ fontSize: '13px' }}>
                {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
              <div className="flex flex-col gap-1.5">
                {entry.sets.map((s, j) => (
                  <div key={j} className="flex items-center gap-3 glass-row px-3 py-2">
                    <div className="w-6 h-6 rounded-full border border-gray-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-gray-400 font-semibold" style={{ fontSize: '11px' }}>{j + 1}</span>
                    </div>
                    <span className="text-white font-semibold" style={{ fontSize: '14px' }}>
                      {s.weightLeft !== undefined
                        ? `L ${s.weightLeft || '—'} / R ${s.weightRight || '—'} lbs × ${s.reps || '—'}`
                        : `${s.weight || '—'} lbs × ${s.reps || '—'}`}
                    </span>
                    {s.note && <span className="text-gray-500" style={{ fontSize: '12px' }}>— {s.note}</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function isIsolatedExercise(name) {
  return name.toLowerCase().includes('isolated')
}

// ─── Exercise Card ────────────────────────────────────────────────────────────
function ExerciseCard({ exercise, onChange, onRemove, onMoveUp, onMoveDown, onReplace, onShowHistory, recommendation, isFirst, isLast }) {
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef(null)
  const isolated = isIsolatedExercise(exercise.name)

  useEffect(() => {
    if (!showMenu) return
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showMenu])

  function addSet() {
    const lastSet = exercise.sets?.[exercise.sets.length - 1]
    const newSet = isolated
      ? { weightLeft: lastSet?.weightLeft || '', weightRight: lastSet?.weightRight || '', reps: lastSet?.reps || '' }
      : { weight: lastSet?.weight || '', reps: lastSet?.reps || '' }
    onChange({ ...exercise, sets: [...(exercise.sets || []), newSet] })
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
    <div className="pixel-card mb-3" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <span className="text-white font-bold" style={{ fontSize: '16px' }}>{exercise.name}</span>
        <div className="relative" ref={menuRef}>
          <button onClick={() => setShowMenu(v => !v)}
            className="text-sky-400 hover:text-sky-300 w-8 h-8 flex items-center justify-center rounded-full hover:bg-sky-900/20 transition-all"
            style={{ fontSize: '20px', letterSpacing: '1px', lineHeight: 1 }}>
            ···
          </button>
          {showMenu && (
            <div className="absolute right-0 top-10 z-50 rounded-2xl shadow-2xl overflow-hidden w-48"
              style={{ background: 'rgba(15,15,30,0.97)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)' }}>
              <div className="px-4 py-2.5 border-b border-gray-800">
                <span className="text-gray-400 font-semibold" style={{ fontSize: '12px' }}>{exercise.name}</span>
              </div>
              <div className="flex border-b border-gray-800">
                <button onClick={() => { onMoveUp?.(); setShowMenu(false) }}
                  disabled={isFirst}
                  className="flex-1 py-3 flex flex-col items-center gap-1 text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed border-r border-gray-800"
                  style={{ fontSize: '13px' }}>
                  <span style={{ fontSize: '16px' }}>↑</span>
                  <span>Up</span>
                </button>
                <button onClick={() => { onMoveDown?.(); setShowMenu(false) }}
                  disabled={isLast}
                  className="flex-1 py-3 flex flex-col items-center gap-1 text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed border-r border-gray-800"
                  style={{ fontSize: '13px' }}>
                  <span style={{ fontSize: '16px' }}>↓</span>
                  <span>Down</span>
                </button>
                <button onClick={() => { onReplace(); setShowMenu(false) }}
                  className="flex-1 py-3 flex flex-col items-center gap-1 text-white hover:bg-gray-800 border-r border-gray-800"
                  style={{ fontSize: '13px' }}>
                  <span style={{ fontSize: '16px' }}>↺</span>
                  <span>Replace</span>
                </button>
                <button onClick={() => { onRemove(); setShowMenu(false) }}
                  className="flex-1 py-3 flex flex-col items-center gap-1 text-red-400 hover:bg-red-900/20"
                  style={{ fontSize: '13px' }}>
                  <span style={{ fontSize: '16px' }}>✕</span>
                  <span>Delete</span>
                </button>
              </div>
              <button onClick={() => { onShowHistory(); setShowMenu(false) }}
                className="w-full text-left px-4 py-3 text-white hover:bg-gray-800 flex items-center justify-between"
                style={{ fontSize: '14px' }}>
                <span>History</span>
                <span className="text-gray-500" style={{ fontSize: '12px' }}>›</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {recommendation && (
        <div className="mx-4 mb-3 bg-sky-900/20 border border-sky-800 p-2 text-sky-300 rounded-lg" style={{ fontSize: '12px' }}>
          💡 {recommendation.reason}
          {recommendation.weight && ` Try ${recommendation.weight}lbs × ${recommendation.reps} reps.`}
        </div>
      )}

      {/* Sets */}
      <div className="border-t border-gray-800/60">
        {(exercise.sets || []).map((set, i) => (
          <SetRow key={i} set={set} index={i} onChange={s => updateSet(i, s)} onRemove={() => removeSet(i)} isIsolated={isolated} />
        ))}
      </div>

      {/* Add Set */}
      <div className="px-4 py-3 border-t border-gray-800/40">
        <button onClick={addSet}
          className="flex items-center gap-2.5 text-sky-400 hover:text-sky-300 transition-colors font-semibold"
          style={{ fontSize: '14px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" flexShrink="0">
            <circle cx="12" cy="12" r="10.5" stroke="currentColor" strokeWidth="2"/>
            <line x1="12" y1="7" x2="12" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="7" y1="12" x2="17" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Add Set
        </button>
      </div>
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
  const [allWorkouts, setAllWorkouts] = useState([])
  const [savedWorkout, setSavedWorkout] = useState(null)
  const [prResult, setPrResult] = useState(null)
  const [levelUp, setLevelUp] = useState(null)
  const [copied, setCopied] = useState(false)
  const [pickedUnlockClass, setPickedUnlockClass] = useState(null)
  const [unlockSaving, setUnlockSaving] = useState(false)
  const [unlockSaved, setUnlockSaved] = useState(false)
  const [historyExercise, setHistoryExercise] = useState(null) // exercise name to show history for
  const [replaceIdx, setReplaceIdx] = useState(null)           // index of exercise being replaced

  const [startTime] = useState(() => new Date())
  const [workoutStartStr, setWorkoutStartStr] = useState(() => toDatetimeLocal(new Date()))
  const [workoutEndStr, setWorkoutEndStr] = useState(() => toDatetimeLocal(new Date()))

  useEffect(() => { fetchPreviousData() }, [])

  async function fetchPreviousData() {
    try {
      const data = await api.getWorkouts()
      setAllWorkouts(data)
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

  // Build usage count map from workout history
  const usageCounts = {}
  allWorkouts.forEach(w => {
    w.exercises?.forEach(ex => {
      if (ex.name) usageCounts[ex.name] = (usageCounts[ex.name] || 0) + 1
    })
  })

  const customExercises = profile?.custom_exercises || {}

  async function handleAddCustomExercise(groupId, name) {
    const updated = { ...customExercises, [groupId]: [...(customExercises[groupId] || []), name] }
    try {
      await api.updateProfile({ custom_exercises: updated })
      await refreshProfile()
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
      const str = toDatetimeLocal(date)
      setWorkoutStartStr(str)
      setWorkoutEndStr(str)
    }
  }

  function moveExercise(idx, direction) {
    setExercises(prev => {
      const arr = [...prev]
      const target = idx + direction
      if (target < 0 || target >= arr.length) return arr
      ;[arr[idx], arr[target]] = [arr[target], arr[idx]]
      return arr
    })
  }

  function replaceExercise(idx, newName) {
    setExercises(prev => prev.map((ex, i) => i === idx ? { ...ex, name: newName } : ex))
    setReplaceIdx(null)
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

    const effectiveStart = new Date(workoutStartStr)
    const effectiveEnd = new Date(workoutEndStr)
    const durationMins = effectiveEnd > effectiveStart
      ? Math.round((effectiveEnd - effectiveStart) / 60000)
      : null

    setSaving(true)
    setShowFinish(false)
    const oldLevel = getLevelFromXP(profile?.total_xp || 0).level
    try {
      const result = await api.createWorkout({
        name: workoutName, exercises, notes,
        xp_earned: xpPreview, points_earned: pointsPreview,
        photo: photoFile,
        start_time: effectiveStart.toISOString(),
        end_time: effectiveEnd.toISOString(),
        duration_minutes: durationMins,
      })
      if (result.pr_exercises?.length > 0) {
        setPrResult({ count: result.pr_exercises.length, exercises: result.pr_exercises, pointsEarned: result.pr_points_earned })
      }
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

  async function handlePhotoShare() {
    if (!photoFile) return
    const img = new Image()
    const objectUrl = URL.createObjectURL(photoFile)
    img.src = objectUrl
    await new Promise(resolve => { img.onload = resolve })

    const MAX = 1080
    const scale = Math.min(1, MAX / Math.max(img.width, img.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.width * scale)
    canvas.height = Math.round(img.height * scale)
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    URL.revokeObjectURL(objectUrl)

    const stripH = Math.round(canvas.height * 0.2)
    const grad = ctx.createLinearGradient(0, canvas.height - stripH, 0, canvas.height)
    grad.addColorStop(0, 'rgba(0,0,0,0)')
    grad.addColorStop(1, 'rgba(0,0,0,0.75)')
    ctx.fillStyle = grad
    ctx.fillRect(0, canvas.height - stripH, canvas.width, stripH)

    const pad = Math.round(canvas.width * 0.04)
    const nameSize = Math.round(stripH * 0.36)
    ctx.font = `bold ${nameSize}px -apple-system, sans-serif`
    ctx.fillStyle = '#ffffff'
    ctx.textBaseline = 'bottom'
    ctx.textAlign = 'left'
    ctx.fillText(savedWorkout.name, pad, canvas.height - pad)

    const sub = []
    if (savedWorkout.duration) sub.push(`${savedWorkout.duration} min`)
    if (savedWorkout.workoutDate) {
      sub.push(savedWorkout.workoutDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }))
    }
    if (sub.length > 0) {
      const subSize = Math.round(nameSize * 0.65)
      ctx.font = `${subSize}px -apple-system, sans-serif`
      ctx.fillStyle = 'rgba(255,255,255,0.75)'
      ctx.fillText(sub.join(' · '), pad, canvas.height - pad - nameSize - 4)
    }

    const brandSize = Math.round(canvas.width * 0.038)
    ctx.font = `bold ${brandSize}px -apple-system, sans-serif`
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.textBaseline = 'top'
    ctx.textAlign = 'right'
    ctx.fillText('XPFIT', canvas.width - pad, pad)

    const petId = profile?.active_pet
    async function drawPetAndExport() {
      if (petId) {
        const petImg = new Image()
        petImg.src = '/pets.png'
        await new Promise(resolve => { petImg.onload = resolve; petImg.onerror = resolve })
        const petDefs = {
          angel_cat:  { col: 0,   row: 0 },
          dragon:     { col: 1,   row: 0 },
          hellhound:  { col: 0,   row: 1 },
          unicorn:    { col: 1,   row: 1 },
          shroom_pup: { col: 0.5, row: 2 },
        }
        const pd = petDefs[petId]
        if (pd && petImg.complete) {
          const petSize = Math.round(canvas.width * 0.22)
          const sx = pd.col * 512
          const sy = pd.row * 512
          const margin = Math.round(canvas.width * 0.03)
          ctx.drawImage(petImg, sx, sy, 512, 512, margin, canvas.height - petSize - margin, petSize, petSize)
        }
      }
      canvas.toBlob(async blob => {
        const file = new File([blob], 'workout.jpg', { type: 'image/jpeg' })
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          try { await navigator.share({ files: [file], title: savedWorkout.name }) } catch (_) {}
        } else {
          const a = document.createElement('a')
          a.href = URL.createObjectURL(blob)
          a.download = 'workout.jpg'
          a.click()
        }
      }, 'image/jpeg', 0.92)
    }
    drawPetAndExport()
  }

  // ─── Level Up Screen ─────────────────────────────────────────────────────────
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
          <div className="pixel-font text-yellow-400 mb-2" style={{ fontSize: '13px', letterSpacing: '3px' }}>LEVEL UP!</div>
          <div className="fantasy-font text-white mb-1" style={{ fontSize: '48px' }}>{levelUp.newLevel}</div>
          <div className="pixel-font text-sky-400 mb-6" style={{ fontSize: '14px' }}>{levelUp.title}</div>

          {canChoose && !unlockSaved ? (
            <div className="mb-6">
              <div className="bg-yellow-900/30 border border-yellow-600 px-4 py-3 mb-4">
                <div className="pixel-font text-yellow-400 mb-1" style={{ fontSize: '12px' }}>UNLOCK A NEW CLASS!</div>
                <div className="text-gray-300" style={{ fontSize: '12px' }}>Every 5 levels, pick one class to unlock</div>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {lockedClasses.map(cls => {
                  const info = CLASS_INFO[cls]
                  const selected = pickedUnlockClass === cls
                  return (
                    <button key={cls} onClick={() => setPickedUnlockClass(cls)}
                      className={`py-3 px-2 flex flex-col items-center gap-2 ${selected ? 'glass-option-gold' : 'glass-option'}`}>
                      <PixelCharacter options={{ gender: profile?.character?.gender || 'male', charClass: cls }} scale={0.4} />
                      <div className={`pixel-font ${selected ? 'text-yellow-300' : 'text-gray-400'}`} style={{ fontSize: '13px' }}>{info.label}</div>
                    </button>
                  )
                })}
              </div>
              <button onClick={handleUnlockClass} disabled={!pickedUnlockClass || unlockSaving}
                className="pixel-btn bg-yellow-700 border-yellow-500 text-white px-10 py-3 w-full disabled:opacity-40" style={{ fontSize: '13px' }}>
                {unlockSaving ? 'Unlocking...' : 'Unlock Class'}
              </button>
            </div>
          ) : canChoose && unlockSaved ? (
            <div className="bg-yellow-900/30 border border-yellow-600 px-4 py-3 mb-6">
              <div className="pixel-font text-yellow-400 mb-1" style={{ fontSize: '12px' }}>CLASS UNLOCKED!</div>
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
              className="pixel-btn bg-yellow-700 border-yellow-500 text-white px-10 py-4 w-full" style={{ fontSize: '13px' }}>
              Continue →
            </button>
          )}
        </div>
      </div>
    )
  }

  // ─── Saved Workout Screen ─────────────────────────────────────────────────────
  if (savedWorkout) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 flex flex-col items-center text-center">
        <div className="pixel-card p-8 w-full">
          <h2 className="fantasy-font text-green-400 mb-1" style={{ fontSize: '24px' }}>Workout Done!</h2>
          <p className="text-gray-400 mb-2" style={{ fontSize: '13px' }}>{savedWorkout.name}</p>
          <p className="pixel-font text-sky-400 mb-2" style={{ fontSize: '12px' }}>+{savedWorkout.xp} XP earned</p>
          {prResult && (
            <div className="glass-row p-3 mb-4 text-left">
              <p className="pixel-font text-purple-400 mb-1" style={{ fontSize: '12px' }}>
                {prResult.count} PR{prResult.count > 1 ? 's' : ''}! +{prResult.pointsEarned} PR Points
              </p>
              <p className="text-gray-500" style={{ fontSize: '12px' }}>
                {prResult.exercises.join(', ')}
              </p>
            </div>
          )}

          <p className="pixel-font text-gray-500 mb-3" style={{ fontSize: '12px' }}>SHARE YOUR WORKOUT</p>
          <div className="flex flex-col gap-3 mb-6">
            {photoFile && (
              <button onClick={handlePhotoShare}
                className="pixel-btn bg-sky-700 border-sky-500 text-white py-3 w-full" style={{ fontSize: '13px' }}>
                Share Photo to Messages
              </button>
            )}
            <button onClick={handleDiscordShare}
              className="pixel-btn bg-indigo-800 border-indigo-600 text-white py-3 w-full" style={{ fontSize: '13px' }}>
              Share to Discord
            </button>
            <button onClick={handleNativeShare}
              className="pixel-btn bg-blue-800 border-blue-600 text-white py-3 w-full" style={{ fontSize: '13px' }}>
              Share via Text / Messenger
            </button>
            <button onClick={handleCopy}
              className="pixel-btn bg-gray-800 border-gray-600 text-white py-3 w-full" style={{ fontSize: '13px' }}>
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

  // ─── Main Logger UI ───────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-32">

      {/* ── Top card: name + times ── */}
      <div className="pixel-card mb-5" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="px-4 pt-4 pb-3">
          <input
            type="text"
            placeholder="Workout name..."
            value={workoutName}
            onChange={e => setWorkoutName(e.target.value)}
            className="w-full bg-transparent text-white font-bold focus:outline-none"
            style={{ fontSize: '20px' }}
          />
        </div>
        <div className="border-t border-gray-800/60">
          <label className="flex items-center justify-between px-4 py-3 border-b border-gray-800/40 cursor-pointer hover:bg-white/[0.02] transition-colors">
            <span className="text-white" style={{ fontSize: '14px' }}>Start Time</span>
            <input
              type="datetime-local"
              value={workoutStartStr}
              onChange={e => setWorkoutStartStr(e.target.value)}
              className="bg-transparent text-gray-400 focus:outline-none focus:text-sky-400 text-right"
              style={{ fontSize: '13px' }}
            />
          </label>
          <label className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-white/[0.02] transition-colors">
            <span className="text-white" style={{ fontSize: '14px' }}>End Time</span>
            <input
              type="datetime-local"
              value={workoutEndStr}
              onChange={e => setWorkoutEndStr(e.target.value)}
              className="bg-transparent text-gray-400 focus:outline-none focus:text-sky-400 text-right"
              style={{ fontSize: '13px' }}
            />
          </label>
        </div>
      </div>

      {/* ── Exercises ── */}
      {exercises.length === 0 ? (
        <div className="text-center py-10 mb-5 glass-row">
          <p className="text-gray-500 mb-4">No exercises yet</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button onClick={() => setShowPicker(true)}
              className="pixel-btn bg-sky-700 border-sky-500 text-white px-8 py-3" style={{ fontSize: '13px' }}>
              + Add Exercise
            </button>
            <button onClick={() => setShowPaste(true)}
              className="pixel-btn bg-gray-800 border-gray-600 text-white px-8 py-3" style={{ fontSize: '13px' }}>
              Paste from App
            </button>
          </div>
        </div>
      ) : (
        <>
          {exercises.map((ex, i) => (
            <ExerciseCard
              key={`${ex.name}-${i}`}
              exercise={ex}
              onChange={e => setExercises(prev => prev.map((x, idx) => idx === i ? e : x))}
              onRemove={() => setExercises(prev => prev.filter((_, idx) => idx !== i))}
              onMoveUp={() => moveExercise(i, -1)}
              onMoveDown={() => moveExercise(i, 1)}
              onReplace={() => setReplaceIdx(i)}
              onShowHistory={() => setHistoryExercise(ex.name)}
              recommendation={recommendations[ex.name]}
              isFirst={i === 0}
              isLast={i === exercises.length - 1}
            />
          ))}
          <div className="flex gap-2 mb-5">
            <button onClick={() => setShowPicker(true)}
              className="flex-1 py-3 border-2 border-dashed border-gray-700 text-gray-400 hover:border-sky-600 hover:text-sky-400 transition-all" style={{ fontSize: '12px' }}>
              + Add Exercise
            </button>
            <button onClick={() => setShowPaste(true)}
              className="py-3 px-4 border-2 border-dashed border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300 transition-all" style={{ fontSize: '13px' }}>
              📋 Paste
            </button>
          </div>
        </>
      )}

      {/* ── Photo ── */}
      <div className="pixel-card p-4 mb-3">
        <label className="pixel-font text-gray-400 block mb-2" style={{ fontSize: '12px' }}>ADD PHOTO</label>
        <input type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files[0])} className="text-gray-400 text-sm" />
        {photoFile && <p className="text-green-400 text-xs mt-1">Selected: {photoFile.name}</p>}
      </div>

      {/* ── Notes ── */}
      <div className="pixel-card p-4 mb-5">
        <label className="pixel-font text-gray-400 block mb-2" style={{ fontSize: '12px' }}>NOTES</label>
        <textarea placeholder="How did it go? Any PRs? How you felt..."
          value={notes} onChange={e => setNotes(e.target.value)}
          rows={3} className="w-full bg-transparent text-white resize-none focus:outline-none"
          style={{ fontSize: '14px' }} />
      </div>

      {/* ── Sticky finish bar ── */}
      <div className="fixed left-0 right-0 z-40 border-t border-sky-900/60 px-4 py-4 md:bottom-0"
        style={{ bottom: '56px', background: 'linear-gradient(to top, #0d0d1a, #12122288)' }}>
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div>
            <div className="pixel-font text-gray-500 mb-1" style={{ fontSize: '13px' }}>YOU WILL EARN</div>
            <div className="flex gap-3">
              <span className="pixel-font text-sky-400" style={{ fontSize: '13px' }}>+{xpPreview} XP</span>
              <span className="pixel-font text-yellow-400" style={{ fontSize: '13px' }}>+{pointsPreview} 🪙</span>
              <span className="text-gray-600" style={{ fontSize: '13px' }}>{exercises.length} exercises · {totalSets} sets</span>
            </div>
          </div>
          <button onClick={() => {
            if (!workoutName.trim()) return alert('Give your workout a name!')
            if (exercises.length === 0) return
            setWorkoutEndStr(toDatetimeLocal(new Date()))
            setShowFinish(true)
          }} disabled={saving || exercises.length === 0}
            className="pixel-btn bg-green-700 border-green-500 text-white px-6 py-3 flex-shrink-0 disabled:opacity-40" style={{ fontSize: '13px' }}>
            {saving ? 'Saving...' : '✓ Finish'}
          </button>
        </div>
      </div>

      {/* ── Modals ── */}
      {showPicker && replaceIdx === null && (
        <ExercisePicker
          onSelect={addExercise}
          onClose={() => setShowPicker(false)}
          customExercises={customExercises}
          usageCounts={usageCounts}
          onAddCustomExercise={handleAddCustomExercise}
        />
      )}
      {replaceIdx !== null && (
        <ExercisePicker
          onSelect={name => replaceExercise(replaceIdx, name)}
          onClose={() => setReplaceIdx(null)}
          customExercises={customExercises}
          usageCounts={usageCounts}
          onAddCustomExercise={handleAddCustomExercise}
        />
      )}
      {showPaste && (
        <PasteImportModal onImport={importExercises} onClose={() => setShowPaste(false)} />
      )}
      {historyExercise && (
        <HistoryModal
          exerciseName={historyExercise}
          allWorkouts={allWorkouts}
          onClose={() => setHistoryExercise(null)}
        />
      )}

      {/* ── Finish confirmation modal ── */}
      {showFinish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)' }}>
          <div className="pixel-card w-full max-w-sm p-6" style={{ background: '#0d0d1f' }}>
            <h2 className="pixel-font text-sky-400 mb-1 text-center" style={{ fontSize: '12px' }}>FINISH WORKOUT</h2>
            <p className="text-white font-bold text-center mb-1" style={{ fontSize: '16px' }}>{workoutName}</p>
            <p className="text-gray-500 text-center mb-5" style={{ fontSize: '13px' }}>
              {exercises.length} exercises · {totalSets} sets · +{xpPreview} XP
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowFinish(false)}
                className="flex-1 py-3 glass-option text-gray-400 hover:text-white transition-all" style={{ fontSize: '13px' }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 pixel-btn bg-green-700 border-green-500 text-white py-3 disabled:opacity-40" style={{ fontSize: '13px' }}>
                {saving ? 'Saving...' : 'Save Workout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
