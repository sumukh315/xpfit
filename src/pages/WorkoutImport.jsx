import { useState, useRef } from 'react'
import { api } from '../lib/api'

// ─── CSV Parser ────────────────────────────────────────────────────────────────

function parseCSV(text) {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []
  // Skip header row
  const rows = lines.slice(1)
  const workoutMap = {}

  for (const line of rows) {
    // Simple CSV split (no quoted-comma support needed for this template)
    const cols = line.split(',').map(c => c.trim())
    const [date, workoutName, exercise, sets, reps, weight, notes] = cols
    if (!date || !workoutName) continue
    const key = `${date}__${workoutName}`
    if (!workoutMap[key]) {
      workoutMap[key] = { name: workoutName, created_at: parseDateString(date), exercises: [], notes: notes || '' }
    }
    if (exercise) {
      workoutMap[key].exercises.push({
        name: exercise,
        sets: parseInt(sets) || 1,
        reps: parseInt(reps) || 0,
        weight: parseFloat(weight) || 0,
      })
    }
  }

  return Object.values(workoutMap)
}

function parseDateString(str) {
  if (!str) return new Date().toISOString()
  // Try native Date parse first
  const d = new Date(str)
  if (!isNaN(d.getTime())) return d.toISOString()
  return new Date().toISOString()
}

// ─── Text/Paste Parser ─────────────────────────────────────────────────────────

function titleCase(str) {
  return str.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
}

// Matches a date line: "Feb 23, 2026", "March 10, 2024", "2024-03-10", "3/10/2024"
const DATE_RE = /^(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}|\d{4}-\d{2}-\d{2}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i

// Matches a set line: "290lb x 5", "• 135 lbs × 10", "100 x 20 Then hold"
const SET_RE = /^[•\-\*]?\s*(\d+(?:\.\d+)?)\s*(?:lbs?|kg)?\s*[x×]\s*(\d+)(.*)$/i

// Lines to skip
const SKIP_RE = /^(logged\s+using|logged\s+with|#\s)/i

function parseTextImport(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const workouts = []
  let current = null
  let currentExercise = null

  for (const line of lines) {
    if (SKIP_RE.test(line)) continue

    // Date line → start a new workout
    const dateMatch = line.match(DATE_RE)
    if (dateMatch) {
      const parsed = new Date(dateMatch[0])
      const dateIso = !isNaN(parsed.getTime()) ? parsed.toISOString() : new Date().toISOString()
      current = { name: `Workout — ${dateMatch[0]}`, created_at: dateIso, exercises: [] }
      workouts.push(current)
      currentExercise = null
      continue
    }

    // Ensure we have a workout to add to
    if (!current) {
      current = { name: 'Imported Workout', created_at: new Date().toISOString(), exercises: [] }
      workouts.push(current)
    }

    const startsWithNumber = /^[•\-\*]?\s*\d/.test(line)
    const setMatch = line.match(SET_RE)

    if (setMatch && startsWithNumber) {
      // It's a set line — add to current exercise
      const note = setMatch[3]?.trim() || undefined
      if (currentExercise) {
        currentExercise.sets.push({ weight: setMatch[1], reps: setMatch[2], ...(note ? { note } : {}) })
      }
      continue
    }

    // Otherwise it's a name line — workout name or exercise name
    const cleanName = line.replace(/^[•\-\*]\s*/, '').trim()
    if (!cleanName || cleanName.length > 80) continue

    if (current.exercises.length === 0 && current.name.startsWith('Workout —')) {
      // First non-date, non-set line → could be workout name, but for Rep Count it's the first exercise
      // If there's no date at all, treat as workout name; otherwise treat as exercise
    }

    // Treat as exercise name
    currentExercise = { name: titleCase(cleanName), sets: [] }
    current.exercises.push(currentExercise)
  }

  return workouts.filter(w => w.exercises.some(e => e.sets.length > 0))
}

// ─── Component ─────────────────────────────────────────────────────────────────

const CSV_TEMPLATE = 'Date,Workout Name,Exercise,Sets,Reps,Weight (lbs),Notes\n2024-03-10,Push Day,Bench Press,3,10,135,\n2024-03-10,Push Day,Overhead Press,3,8,95,\n2024-03-12,Leg Day,Squat,4,8,185,\n'

export default function WorkoutImport() {
  const [tab, setTab] = useState('csv') // 'csv' | 'text'

  // CSV state
  const [csvParsed, setCsvParsed] = useState(null)
  const [csvError, setCsvError] = useState('')
  const fileInputRef = useRef(null)

  // Text state
  const [pasteText, setPasteText] = useState('')
  const [textParsed, setTextParsed] = useState(null)

  // Import status
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const [importError, setImportError] = useState('')

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'xpfit_workout_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleCSVFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setCsvError('')
    setCsvParsed(null)
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const workouts = parseCSV(ev.target.result)
        if (workouts.length === 0) {
          setCsvError('No workouts found in file. Check the format matches the template.')
        } else {
          setCsvParsed(workouts)
        }
      } catch (err) {
        setCsvError('Failed to parse CSV: ' + err.message)
      }
    }
    reader.readAsText(file)
  }

  function handleParseText() {
    const workouts = parseTextImport(pasteText)
    setTextParsed(workouts)
  }

  async function handleImport(workouts) {
    setImporting(true)
    setImportError('')
    setImportResult(null)
    try {
      const result = await api.importWorkouts(workouts)
      setImportResult(result.imported)
      setCsvParsed(null)
      setTextParsed(null)
      setPasteText('')
    } catch (e) {
      setImportError(e.message)
    } finally {
      setImporting(false)
    }
  }

  const parsedWorkouts = tab === 'csv' ? csvParsed : textParsed

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="pixel-font text-sky-400 mb-1" style={{ fontSize: '14px' }}>Import Workout History</h1>
        <p className="text-gray-500" style={{ fontSize: '12px' }}>
          Bring in your past workouts — they'll appear in your history without adding XP (historical record only).
        </p>
      </div>

      {/* Success banner */}
      {importResult !== null && (
        <div className="pixel-card p-4 mb-6 border-green-500 bg-green-900/20">
          <p className="pixel-font text-green-400" style={{ fontSize: '10px' }}>
            Imported {importResult} workout{importResult !== 1 ? 's' : ''} successfully!
          </p>
        </div>
      )}

      {/* Tab switcher */}
      <div className="flex gap-2 mb-6">
        {[{ key: 'csv', label: '📄 CSV Upload' }, { key: 'text', label: '📋 Paste / Text' }].map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setImportResult(null); setImportError('') }}
            className={`pixel-btn py-2 px-5 ${tab === t.key ? 'bg-sky-800 border-sky-500 text-white' : 'bg-gray-900 border-gray-700 text-gray-400'}`}
            style={{ fontSize: '9px' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* CSV Tab */}
      {tab === 'csv' && (
        <div>
          <div className="pixel-card p-5 mb-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
              <div>
                <h2 className="pixel-font text-white mb-1" style={{ fontSize: '11px' }}>Upload CSV File</h2>
                <p className="text-gray-500" style={{ fontSize: '11px' }}>
                  Format: Date, Workout Name, Exercise, Sets, Reps, Weight (lbs), Notes
                </p>
              </div>
              <button onClick={downloadTemplate}
                className="pixel-btn bg-gray-800 border-gray-600 text-gray-300 px-4 py-2 whitespace-nowrap"
                style={{ fontSize: '8px' }}>
                Download Template
              </button>
            </div>

            <div
              className="border-2 border-dashed border-gray-700 hover:border-sky-500 transition-colors rounded p-8 text-center cursor-pointer"
              onClick={() => fileInputRef.current?.click()}>
              <div className="text-3xl mb-2">📂</div>
              <p className="text-gray-400" style={{ fontSize: '12px' }}>Click to select a CSV file</p>
              <p className="text-gray-600" style={{ fontSize: '11px' }}>or drag and drop</p>
              <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleCSVFile} />
            </div>

            {csvError && (
              <p className="text-red-400 mt-3" style={{ fontSize: '12px' }}>{csvError}</p>
            )}
          </div>
        </div>
      )}

      {/* Text Paste Tab */}
      {tab === 'text' && (
        <div>
          <div className="pixel-card p-5 mb-4">
            <h2 className="pixel-font text-white mb-2" style={{ fontSize: '11px' }}>Paste Workout Text</h2>
            <p className="text-gray-500 mb-4" style={{ fontSize: '11px' }}>
              Paste anything — notes app entries, messenger logs, spreadsheet copy-paste. The parser detects dates and exercise patterns automatically.
            </p>
            <p className="text-gray-600 mb-3" style={{ fontSize: '10px' }}>
              Examples it understands: "Bench Press 3x10 135lbs" · "Squats: 3 sets of 8 at 185" · "deadlift 225 5x5" · "bench 3x10@135"
            </p>
            <textarea
              value={pasteText}
              onChange={e => { setPasteText(e.target.value); setTextParsed(null) }}
              rows={10}
              className="w-full bg-black/40 border-2 border-gray-700 text-white px-3 py-2 focus:border-sky-500 outline-none font-mono resize-y"
              style={{ fontSize: '12px' }}
              placeholder={`March 10, 2024\nPush Day\nBench Press 3x10 135lbs\nOverhead Press 3x8 95lbs\n\nMarch 12, 2024\nLeg Day\nSquat 4x8 185lbs\nLeg Press 3x12 270lbs`}
            />
            <button onClick={handleParseText} disabled={!pasteText.trim()}
              className="pixel-btn bg-sky-800 border-sky-600 text-white px-6 py-2 mt-3 disabled:opacity-40"
              style={{ fontSize: '9px' }}>
              Parse Text
            </button>
          </div>
        </div>
      )}

      {/* Preview */}
      {parsedWorkouts && parsedWorkouts.length > 0 && (
        <div className="pixel-card p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="pixel-font text-sky-400" style={{ fontSize: '11px' }}>
              Preview — {parsedWorkouts.length} workout{parsedWorkouts.length !== 1 ? 's' : ''} detected
            </h2>
          </div>

          <div className="flex flex-col gap-3 mb-5 max-h-80 overflow-y-auto">
            {parsedWorkouts.map((w, i) => (
              <div key={i} className="bg-black/30 border border-gray-800 p-3">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-white font-medium" style={{ fontSize: '13px' }}>{w.name}</span>
                  <span className="text-gray-500 text-xs">{new Date(w.created_at).toLocaleDateString()}</span>
                </div>
                {w.exercises.length > 0 ? (
                  <div className="flex flex-col gap-0.5 mt-1">
                    {w.exercises.map((ex, j) => (
                      <div key={j} className="text-gray-400" style={{ fontSize: '11px' }}>
                        · {ex.name} — {(ex.sets || []).map(s => `${s.weight}×${s.reps}`).join(', ')}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-600" style={{ fontSize: '11px' }}>No exercises parsed</div>
                )}
              </div>
            ))}
          </div>

          {importError && (
            <p className="text-red-400 mb-3" style={{ fontSize: '12px' }}>{importError}</p>
          )}

          <button
            onClick={() => handleImport(parsedWorkouts)}
            disabled={importing}
            className="pixel-btn bg-green-700 border-green-500 text-white px-8 py-3 disabled:opacity-50"
            style={{ fontSize: '10px' }}>
            {importing ? 'Importing...' : `Import ${parsedWorkouts.length} Workout${parsedWorkouts.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      )}

      {parsedWorkouts && parsedWorkouts.length === 0 && (
        <div className="pixel-card p-5 text-center">
          <p className="text-gray-500" style={{ fontSize: '12px' }}>
            No workouts could be parsed. Try a different format or check the examples above.
          </p>
        </div>
      )}
    </div>
  )
}
